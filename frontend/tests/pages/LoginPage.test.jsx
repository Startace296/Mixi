import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

import LoginPage from '../../src/pages/LoginPage.jsx';
import { login } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { inputByLabel, renderAtRoute } from '../helpers/render.jsx';

vi.mock('../../src/lib/api');
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().clearAuth();
});

function renderLogin() {
  const user = userEvent.setup();
  renderAtRoute(<LoginPage />, { path: '/login' });
  return {
    user,
    emailInput: inputByLabel(screen, 'Email address'),
    passwordInput: inputByLabel(screen, 'Password'),
    submitButton: screen.getByRole('button', { name: 'Log in' }),
  };
}

describe('LoginPage', () => {
  it('logs in, stores the session and goes to /home', async () => {
    login.mockResolvedValue({ token: 'jwt-123', user: { id: 'u1', displayName: 'Alice' }, message: 'Welcome back' });
    const { user, emailInput, passwordInput, submitButton } = renderLogin();

    await user.type(emailInput, 'alice@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    expect(login).toHaveBeenCalledWith({ email: 'alice@example.com', password: 'Password123!' });
    expect(await screen.findByTestId('location')).toHaveTextContent('/home');
    expect(useAuthStore.getState()).toMatchObject({ token: 'jwt-123', isAuthenticated: true });
    expect(localStorage.getItem('token')).toBe('jwt-123');
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 'u1', displayName: 'Alice' });
    expect(toast.success).toHaveBeenCalledWith('Welcome back');
  });

  it('shows the server error and stays on the page when login fails', async () => {
    login.mockRejectedValue(new Error('Invalid email or password'));
    const { user, emailInput, passwordInput, submitButton } = renderLogin();

    await user.type(emailInput, 'alice@example.com');
    await user.type(passwordInput, 'wrong-password');
    await user.click(submitButton);

    expect(toast.error).toHaveBeenCalledWith('Invalid email or password');
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(localStorage.getItem('token')).toBeNull();
    // The button is usable again after the failure.
    expect(screen.getByRole('button', { name: 'Log in' })).toBeEnabled();
  });

  it('disables the button while logging in and ignores double submits', async () => {
    let resolveLogin;
    login.mockReturnValue(new Promise((resolve) => { resolveLogin = resolve; }));
    const { user, emailInput, passwordInput, submitButton } = renderLogin();

    await user.type(emailInput, 'alice@example.com');
    await user.type(passwordInput, 'Password123!');
    await user.click(submitButton);

    const loadingButton = screen.getByRole('button', { name: 'Logging in...' });
    expect(loadingButton).toBeDisabled();
    await user.click(loadingButton);
    expect(login).toHaveBeenCalledTimes(1);

    resolveLogin({ token: 'jwt', user: { id: 'u1' } });
    expect(await screen.findByTestId('location')).toHaveTextContent('/home');
  });

  it('toggles password visibility', async () => {
    const { user, passwordInput } = renderLogin();
    expect(passwordInput).toHaveAttribute('type', 'password');

    await user.type(passwordInput, 'secret');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(passwordInput).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('links to sign up', async () => {
    const { user } = renderLogin();
    await user.click(screen.getByRole('button', { name: 'Create new account' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/signup');
  });

  it('links to forgot password', async () => {
    const { user } = renderLogin();
    await user.click(screen.getByRole('button', { name: 'Forgotten password?' }));
    expect(screen.getByTestId('location')).toHaveTextContent('/forgot-password');
  });
});
