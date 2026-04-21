import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { completeRegistration, completeGoogleRegistration } from '../services/api.js';

function validateAge(day, month, year) {
  const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
  const today = new Date();
  const minAllowed = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  return birthDate <= minAllowed;
}

export function useRegisterForm({ email, fromGoogle, googleSignupToken, googleDisplayName }) {
  const navigate = useNavigate();

  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState({
    nickname: '',
    gender: '',
    dob: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (fromGoogle && googleDisplayName) {
      setNickname(googleDisplayName);
    }
  }, [fromGoogle, googleDisplayName]);

  function clearError(field) {
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function validate() {
    const next = { nickname: '', gender: '', dob: '', password: '', confirmPassword: '' };
    let hasError = false;

    if (!nickname.trim()) {
      next.nickname = 'This field is required';
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      if (fromGoogle && googleSignupToken) {
        const data = await completeGoogleRegistration({
          googleSignupToken,
          displayName: nickname,
          gender,
          day: day || undefined,
          month: month || undefined,
          year: year || undefined,
        });
        toast.success(data.message || 'Account created successfully.');
      } else {
        const data = await completeRegistration({
          email,
          password,
          displayName: nickname,
          gender,
          day: day || undefined,
          month: month || undefined,
          year: year || undefined,
        });
        toast.success(data.message || 'Account created successfully.');
      }
      navigate('/login', { replace: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  const fields = {
    nickname, setNickname: (v) => { setNickname(v); clearError('nickname'); },
    gender, setGender: (v) => { setGender(v); clearError('gender'); },
    day, setDay: (v) => { setDay(v); clearError('dob'); },
    month, setMonth: (v) => { setMonth(v); clearError('dob'); },
    year, setYear: (v) => { setYear(v); clearError('dob'); },
    password, setPassword: (v) => { setPassword(v); clearError('password'); },
    confirmPassword, setConfirmPassword: (v) => { setConfirmPassword(v); clearError('confirmPassword'); },
  };

  const isSubmitDisabled = isLoading || (!fromGoogle && (password.length < 8 || password !== confirmPassword));

  return { fields, errors, isLoading, isSubmitDisabled, handleSubmit };
}
