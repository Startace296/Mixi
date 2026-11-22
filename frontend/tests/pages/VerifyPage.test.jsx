import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, screen } from '@testing-library/react';
import toast from 'react-hot-toast';

import VerifyPage from '../../src/pages/VerifyPage.jsx';
import { requestSignupOtp, verifyOtp } from '../../src/lib/api';
import { renderAtRoute } from '../helpers/render.jsx';

vi.mock('../../src/lib/api');
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

// The page has a 60s resend countdown, so these tests drive time by hand.
beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const EMAIL = 'new@example.com';

function renderVerify(state = { email: EMAIL }) {
  renderAtRoute(<VerifyPage />, { path: '/verify', state });
  return {
    codeInput: screen.queryByRole('textbox'),
    confirmButton: screen.queryByRole('button', { name: 'Confirm' }),
    resendButton: screen.queryByRole('button', { name: 'Resend code' }),
  };
}

/** Lets pending promises (mocked API calls) settle inside act(). */
const flush = () => act(async () => {});

describe('VerifyPage', () => {
  it('redirects to /signup when opened without an email', () => {
    renderVerify(null);
    expect(screen.getByTestId('location')).toHaveTextContent('/signup');
  });

  it('keeps only digits, at most 6, and enables Confirm at 6 digits', () => {
    const { codeInput, confirmButton } = renderVerify();
    expect(confirmButton).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: '12a3-4' } });
    expect(codeInput).toHaveValue('1234');
    expect(confirmButton).toBeDisabled();

    fireEvent.change(codeInput, { target: { value: '12345678' } });
    expect(codeInput).toHaveValue('123456');
    expect(confirmButton).toBeEnabled();
  });

  it('verifies the code and continues to /register with the registration token', async () => {
    verifyOtp.mockResolvedValue({ registrationToken: 'reg-token' });
    const { codeInput, confirmButton } = renderVerify();

    fireEvent.change(codeInput, { target: { value: '654321' } });
    fireEvent.click(confirmButton);
    await flush();

    expect(verifyOtp).toHaveBeenCalledWith({ email: EMAIL, otpCode: '654321' });
    const location = screen.getByTestId('location');
    expect(location).toHaveTextContent('/register');
    expect(JSON.parse(location.dataset.state)).toEqual({ email: EMAIL, registrationToken: 'reg-token' });
  });

  it('shows the error for a wrong code and stays on the page', async () => {
    verifyOtp.mockRejectedValue(new Error('Invalid OTP'));
    const { codeInput, confirmButton } = renderVerify();

    fireEvent.change(codeInput, { target: { value: '000000' } });
    fireEvent.click(confirmButton);
    await flush();

    expect(toast.error).toHaveBeenCalledWith('Invalid OTP');
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });

  it('counts down from 60s and only allows resending once it reaches 0', async () => {
    requestSignupOtp.mockResolvedValue({ success: true });
    const { resendButton } = renderVerify();

    expect(screen.getByText('Code expired in 60s')).toBeInTheDocument();
    expect(resendButton).toBeDisabled();

    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByText('Code expired in 59s')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(59000));
    expect(screen.queryByText(/Code expired in/)).not.toBeInTheDocument();
    expect(resendButton).toBeEnabled();
    // An expired code can no longer be confirmed.
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '123456' } });
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeDisabled();

    fireEvent.click(resendButton);
    await flush();

    expect(requestSignupOtp).toHaveBeenCalledWith({ email: EMAIL });
    expect(toast.success).toHaveBeenCalledWith('OTP resent successfully.');
    expect(screen.getByText('Code expired in 60s')).toBeInTheDocument();
    expect(resendButton).toBeDisabled();
  });
});
