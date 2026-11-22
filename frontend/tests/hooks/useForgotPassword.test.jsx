import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import toast from 'react-hot-toast';

import { ROUTER_FUTURE } from '../helpers/render.jsx';
import { useForgotPasswordRequest, useResetPassword } from '../../src/hooks/auth';
import { requestForgotPasswordOtp, resetPasswordWithOtp } from '../../src/lib/api';

vi.mock('../../src/lib/api');
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const submitEvent = () => ({ preventDefault: vi.fn() });

function withRouterState(state) {
  return function RouterWrapper({ children }) {
    return (
      <MemoryRouter initialEntries={[{ pathname: '/', state }]} future={ROUTER_FUTURE}>{children}</MemoryRouter>
    );
  };
}

describe('useForgotPasswordRequest', () => {
  it('sends the OTP to the trimmed email and goes to the verify step', async () => {
    requestForgotPasswordOtp.mockResolvedValue({});
    const { result } = renderHook(() => useForgotPasswordRequest(), { wrapper: withRouterState() });

    act(() => result.current.setEmail('  me@example.com '));
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(requestForgotPasswordOtp).toHaveBeenCalledWith({ email: 'me@example.com' });
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-verify', { state: { email: 'me@example.com' } });
  });

  it('reports errors and does not navigate', async () => {
    requestForgotPasswordOtp.mockRejectedValue(new Error('No account with this email'));
    const { result } = renderHook(() => useForgotPasswordRequest(), { wrapper: withRouterState() });

    act(() => result.current.setEmail('nobody@example.com'));
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(toast.error).toHaveBeenCalledWith('No account with this email');
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useResetPassword', () => {
  const state = { email: 'me@example.com', code: '123456' };

  it('redirects to /forgot-password without a verified email and code', () => {
    renderHook(() => useResetPassword(), { wrapper: withRouterState({ email: 'me@example.com' }) });
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password', { replace: true });
  });

  it.each([
    ['', '', 'passwordError', 'Password is required'],
    ['short', 'short', 'passwordError', 'Password must be at least 8 characters'],
    ['Password123!', 'Password123?', 'confirmError', 'Password not match'],
  ])('validates password %j / confirm %j', async (password, confirm, field, message) => {
    const { result } = renderHook(() => useResetPassword(), { wrapper: withRouterState(state) });

    act(() => {
      result.current.setPassword(password);
      result.current.setConfirmPassword(confirm);
    });
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current[field]).toBe(message);
    expect(resetPasswordWithOtp).not.toHaveBeenCalled();
  });

  it('resets the password with the verified OTP and goes to /login', async () => {
    resetPasswordWithOtp.mockResolvedValue({ message: 'Password updated' });
    const { result } = renderHook(() => useResetPassword(), { wrapper: withRouterState(state) });

    act(() => {
      result.current.setPassword('NewPassword1!');
      result.current.setConfirmPassword('NewPassword1!');
    });
    await act(() => result.current.handleSubmit(submitEvent()));

    expect(resetPasswordWithOtp).toHaveBeenCalledWith({
      email: 'me@example.com',
      otpCode: '123456',
      newPassword: 'NewPassword1!',
    });
    expect(toast.success).toHaveBeenCalledWith('Password updated');
    expect(mockNavigate).toHaveBeenCalledWith('/login', { replace: true });
  });
});
