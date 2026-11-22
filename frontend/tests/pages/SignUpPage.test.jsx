import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

import SignUpPage from '../../src/pages/SignUpPage';
import { requestSignupOtp } from '../../src/lib/api';
import { inputByLabel, renderAtRoute } from '../helpers/render.jsx';

vi.mock('../../src/lib/api');
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderSignUp() {
  const user = userEvent.setup();
  renderAtRoute(<SignUpPage />, { path: '/signup' });
  return { user, emailInput: inputByLabel(screen, 'Email address') };
}

describe('SignUpPage', () => {
  it('requests an OTP for the trimmed email and goes to /verify with it', async () => {
    requestSignupOtp.mockResolvedValue({ success: true });
    const { user, emailInput } = renderSignUp();

    await user.type(emailInput, '  new@example.com  ');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(requestSignupOtp).toHaveBeenCalledWith({ email: 'new@example.com' });
    const location = await screen.findByTestId('location');
    expect(location).toHaveTextContent('/verify');
    expect(JSON.parse(location.dataset.state)).toEqual({ email: 'new@example.com' });
    expect(toast.success).toHaveBeenCalled();
  });

  it('does nothing when the email is blank', async () => {
    const { user, emailInput } = renderSignUp();

    await user.type(emailInput, '   ');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(requestSignupOtp).not.toHaveBeenCalled();
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
  });

  it('shows the error when the email is already registered', async () => {
    requestSignupOtp.mockRejectedValue(new Error('Email already registered'));
    const { user, emailInput } = renderSignUp();

    await user.type(emailInput, 'taken@example.com');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    expect(toast.error).toHaveBeenCalledWith('Email already registered');
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Verify' })).toBeEnabled();
  });
});
