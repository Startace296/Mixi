import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { completeRegistration, completeGoogleRegistration } from '../../lib/api';
import { getErrorMessage } from '../../lib/errors';
import { useAuthStore } from '../../stores/useAuthStore';
import type { AuthSuccessResponse, Gender } from '../../types';

interface UseRegisterFormOptions {
  email?: string;
  registrationToken?: string;
  fromGoogle?: boolean;
  googleSignupToken?: string;
  googleDisplayName?: string;
}

export interface RegisterFormErrors {
  displayName: string;
  gender: string;
  dob: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_ERRORS: RegisterFormErrors = {
  displayName: '',
  gender: '',
  dob: '',
  password: '',
  confirmPassword: '',
};

function validateAge(day: string, month: string, year: string): boolean {
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const minAllowed = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return birthDate <= minAllowed;
}

export function useRegisterForm({
  email,
  registrationToken,
  fromGoogle,
  googleSignupToken,
  googleDisplayName,
}: UseRegisterFormOptions) {
  const navigate = useNavigate();
  const applyAuthSuccess = useAuthStore((state) => state.applyAuthSuccess);

  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<Gender | ''>('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<RegisterFormErrors>(EMPTY_ERRORS);

  useEffect(() => {
    if (fromGoogle && googleDisplayName) {
      setDisplayName(googleDisplayName);
    }
  }, [fromGoogle, googleDisplayName]);

  function clearError(field: keyof RegisterFormErrors) {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const next: RegisterFormErrors = { ...EMPTY_ERRORS };
    let hasError = false;

    if (!displayName.trim()) {
      next.displayName = 'This field is required';
      hasError = true;
    }
    if (!gender) {
      next.gender = 'Please select gender';
      hasError = true;
    }
    if (!day || !month || !year) {
      next.dob = 'Please select your full date of birth';
      hasError = true;
    } else if (!validateAge(day, month, year)) {
      next.dob = 'You must be at least 18 years old';
      hasError = true;
    }
    if (!fromGoogle) {
      if (!password) {
        next.password = 'Password is required';
        hasError = true;
      } else if (password.trim().length < 8) {
        next.password = 'Password must be at least 8 characters';
        hasError = true;
      } else if (password !== confirmPassword) {
        next.confirmPassword = 'Password not match';
        hasError = true;
      }
    }

    setErrors(next);
    return !hasError;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      let data: AuthSuccessResponse;
      if (fromGoogle && googleSignupToken) {
        data = await completeGoogleRegistration({
          googleSignupToken,
          displayName,
          gender,
          day: day || undefined,
          month: month || undefined,
          year: year || undefined,
        });
      } else {
        // RegisterPage redirects to /signup before rendering the form when these are missing.
        data = await completeRegistration({
          email: email ?? '',
          registrationToken: registrationToken ?? '',
          password,
          displayName,
          gender,
          day: day || undefined,
          month: month || undefined,
          year: year || undefined,
        });
      }
      applyAuthSuccess(data);
      toast.success(data.message || 'Account created successfully.');
      navigate('/home', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }

  const fields = {
    displayName, setDisplayName: (v: string) => { setDisplayName(v); clearError('displayName'); },
    gender, setGender: (v: Gender | '') => { setGender(v); clearError('gender'); },
    day, setDay: (v: string) => { setDay(v); clearError('dob'); },
    month, setMonth: (v: string) => { setMonth(v); clearError('dob'); },
    year, setYear: (v: string) => { setYear(v); clearError('dob'); },
    password, setPassword: (v: string) => { setPassword(v); clearError('password'); },
    confirmPassword, setConfirmPassword: (v: string) => { setConfirmPassword(v); clearError('confirmPassword'); },
  };

  const isSubmitDisabled = isLoading || (!fromGoogle && (password.length < 8 || password !== confirmPassword));

  return { fields, errors, isLoading, isSubmitDisabled, handleSubmit };
}
