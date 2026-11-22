import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';

import RegisterPage from '../../src/pages/RegisterPage';
import { completeGoogleRegistration, completeRegistration } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { inputByLabel, renderAtRoute } from '../helpers/render.jsx';

vi.mock('../../src/lib/api');
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.getState().clearAuth();
});

const LOCAL_STATE = { email: 'new@example.com', registrationToken: 'reg-token' };
const GOOGLE_STATE = {
  email: 'g@example.com',
  fromGoogle: true,
  googleSignupToken: 'google-token',
  displayName: 'Google Name',
};

function renderRegister(state = LOCAL_STATE) {
  const user = userEvent.setup();
  renderAtRoute(<RegisterPage />, { path: '/register', state });
  if (screen.queryByTestId('location')) return { user };

  const [gender, day, month, year] = screen.getAllByRole('combobox');
  return {
    user,
    displayName: inputByLabel(screen, 'Display name'),
    password: screen.queryByText('Password', { selector: 'label' }) && inputByLabel(screen, 'Password'),
    confirmPassword: screen.queryByText('Confirm password', { selector: 'label' }) && inputByLabel(screen, 'Confirm password'),
    gender,
    day,
    month,
    year,
    submit: () => user.click(screen.getByRole('button', { name: 'Create Account' })),
  };
}

async function fillValidForm(form, { name = 'Alice', password = 'Password123!' } = {}) {
  const { user } = form;
  if (name) await user.type(form.displayName, name);
  await user.selectOptions(form.gender, 'Female');
  await user.selectOptions(form.day, '15');
  await user.selectOptions(form.month, '6');
  await user.selectOptions(form.year, '2000');
  if (form.password) {
    await user.type(form.password, password);
    await user.type(form.confirmPassword, password);
  }
}

describe('RegisterPage (email signup)', () => {
  it('redirects to /signup without a registration token', () => {
    renderRegister({ email: 'new@example.com' });
    expect(screen.getByTestId('location')).toHaveTextContent('/signup');
  });

  it('shows the email as read-only', () => {
    renderRegister();
    const emailInput = inputByLabel(screen, 'Email');
    expect(emailInput).toHaveValue('new@example.com');
    expect(emailInput).toHaveAttribute('readonly');
  });

  it('creates the account, stores the session and goes to /home', async () => {
    completeRegistration.mockResolvedValue({ token: 'jwt', user: { id: 'u1', displayName: 'Alice' } });
    const form = renderRegister();

    await fillValidForm(form);
    await form.submit();

    expect(completeRegistration).toHaveBeenCalledWith({
      email: 'new@example.com',
      registrationToken: 'reg-token',
      password: 'Password123!',
      displayName: 'Alice',
      gender: 'Female',
      day: '15',
      month: '6',
      year: '2000',
    });
    expect(await screen.findByTestId('location')).toHaveTextContent('/home');
    expect(useAuthStore.getState()).toMatchObject({ token: 'jwt', isAuthenticated: true });
    expect(toast.success).toHaveBeenCalledWith('Account created successfully.');
  });

  it('shows required-field errors and clears each one when the field is fixed', async () => {
    const form = renderRegister();
    await form.user.type(form.password, 'Password123!');
    await form.user.type(form.confirmPassword, 'Password123!');
    await form.submit();

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByText('Please select gender')).toBeInTheDocument();
    expect(screen.getByText('Please select your full date of birth')).toBeInTheDocument();
    expect(completeRegistration).not.toHaveBeenCalled();

    await form.user.type(form.displayName, 'A');
    expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    await form.user.selectOptions(form.gender, 'Male');
    expect(screen.queryByText('Please select gender')).not.toBeInTheDocument();
    await form.user.selectOptions(form.day, '1');
    expect(screen.queryByText('Please select your full date of birth')).not.toBeInTheDocument();
  });

  it('treats a whitespace-only display name as missing', async () => {
    const form = renderRegister();
    await fillValidForm(form, { name: '   ' });
    await form.submit();

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(completeRegistration).not.toHaveBeenCalled();
  });

  it('rejects users younger than 18', async () => {
    const form = renderRegister();
    await fillValidForm(form);
    await form.user.selectOptions(form.year, String(new Date().getFullYear() - 10));
    await form.submit();

    expect(screen.getByText('You must be at least 18 years old')).toBeInTheDocument();
    expect(completeRegistration).not.toHaveBeenCalled();
  });

  it('keeps Create Account disabled until the password is 8+ chars and confirmed', async () => {
    const form = renderRegister();
    const button = screen.getByRole('button', { name: 'Create Account' });
    expect(button).toBeDisabled();

    await form.user.type(form.password, 'short');
    await form.user.type(form.confirmPassword, 'short');
    expect(button).toBeDisabled();

    await form.user.clear(form.password);
    await form.user.clear(form.confirmPassword);
    await form.user.type(form.password, 'Password123!');
    await form.user.type(form.confirmPassword, 'Password123?');
    expect(button).toBeDisabled();

    await form.user.clear(form.confirmPassword);
    await form.user.type(form.confirmPassword, 'Password123!');
    expect(button).toBeEnabled();
  });

  it('shows the server error and stays on the page when registration fails', async () => {
    completeRegistration.mockRejectedValue(new Error('Registration token expired'));
    const form = renderRegister();

    await fillValidForm(form);
    await form.submit();

    expect(toast.error).toHaveBeenCalledWith('Registration token expired');
    expect(screen.queryByTestId('location')).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('RegisterPage (Google signup)', () => {
  it('redirects to /signup without a Google signup token', () => {
    renderRegister({ email: 'g@example.com', fromGoogle: true });
    expect(screen.getByTestId('location')).toHaveTextContent('/signup');
  });

  it('prefills the Google name, hides the password fields and completes the Google signup', async () => {
    completeGoogleRegistration.mockResolvedValue({ token: 'g-jwt', user: { id: 'g1' } });
    const form = renderRegister(GOOGLE_STATE);

    expect(form.displayName).toHaveValue('Google Name');
    expect(form.password).toBeFalsy();
    expect(form.confirmPassword).toBeFalsy();

    await fillValidForm(form, { name: null });
    await form.submit();

    expect(completeGoogleRegistration).toHaveBeenCalledWith({
      googleSignupToken: 'google-token',
      displayName: 'Google Name',
      gender: 'Female',
      day: '15',
      month: '6',
      year: '2000',
    });
    expect(completeRegistration).not.toHaveBeenCalled();
    expect(await screen.findByTestId('location')).toHaveTextContent('/home');
    expect(useAuthStore.getState().token).toBe('g-jwt');
  });
});
