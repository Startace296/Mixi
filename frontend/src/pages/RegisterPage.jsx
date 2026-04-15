import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

import AuthCard from '../components/auth-comp/AuthCard';
import FloatingInput from '../components/auth-comp/FloatingInput';
import PasswordInput from '../components/auth-comp/PasswordInput';
import { completeRegistration, completeGoogleRegistration } from '../services/api.js';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 76 }, (_, i) => 2025 - i);
const GENDERS = ['Male', 'Female', 'Other'];

export default function RegisterPage() {
  const [nickname, setNickname] = useState('');
  const [gender, setGender] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [genderError, setGenderError] = useState('');
  const [dobError, setDobError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { email, fromGoogle, googleSignupToken, displayName: googleDisplayName } = location.state || {};

  useEffect(() => {
    if (!email) {
      navigate('/signup', { replace: true });
    }
  }, [email, navigate]);

  useEffect(() => {
    if (fromGoogle && googleDisplayName) {
      setNickname(googleDisplayName);
    }
  }, [fromGoogle, googleDisplayName]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setConfirmError('');
    setNicknameError('');
    setGenderError('');
    setDobError('');

    let hasError = false;
    if (!nickname.trim()) {
      setNicknameError('This field is required');
      hasError = true;
    }
    if (!gender) {
      setGenderError('Please select gender');
      hasError = true;
    }
    if (!day || !month || !year) {
      setDobError('Please select your full date of birth');
      hasError = true;
    } else {
      const birthDate = new Date(Number(year), Number(month) - 1, Number(day));
      const today = new Date();
      const eighteenYearsAgo = new Date(
        today.getFullYear() - 18,
        today.getMonth(),
        today.getDate()
      );
      if (birthDate > eighteenYearsAgo) {
        setDobError('You must be at least 18 years old');
        hasError = true;
      }
    }
    if (!fromGoogle && password && password.trim().length < 8) {
      setPasswordError('Password must be at least 8 characters');
      hasError = true;
    }
    if (!fromGoogle && (password !== confirmPassword || !password)) {
      if (!password) {
        setPasswordError('Password is required');
      } else if (password !== confirmPassword) {
        setConfirmError('Password not match');
      }
      hasError = true;
    }
    if (hasError) return;

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
        navigate('/login', { replace: true });
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
        navigate('/login', { replace: true });
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) return null;

  return (
    <AuthCard title="Create account">
      <form
        className="flex flex-col w-full gap-8"
        onSubmit={handleSubmit}
        noValidate
      >
        <FloatingInput type="email" value={email} readOnly label="Email" />
        <FloatingInput
          value={nickname}
          onChange={(val) => {
            setNickname(val);
            setNicknameError('');
          }}
          label="Nickname"
          error={nicknameError || undefined}
        />
        <div className="flex flex-col gap-1.5">
          <select
            value={gender}
            onChange={(e) => {
              setGender(e.target.value);
              setGenderError('');
            }}
            required
            className={`w-full px-4 py-3.5 rounded-xl border bg-white text-base outline-none transition-[border-color] duration-150 ${gender ? 'text-[#1c1e21]' : 'text-[#90949c]'} ${
              genderError ? 'border-red-500 focus:border-red-500' : 'border-[#dddfe2] focus:border-indigo-600'
            }`}
          >
            <option value="">Gender</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          {genderError && <span className="text-sm text-red-500">{genderError}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col md:flex-row gap-2">
            <select
              value={day}
              onChange={(e) => { setDay(e.target.value); setDobError(''); }}
              required
              className={`flex-1 px-2 py-3 rounded-xl border bg-white text-base outline-none transition-[border-color] duration-150 ${day ? 'text-[#1c1e21]' : 'text-[#90949c]'} ${dobError ? 'border-red-500 focus:border-red-500' : 'border-[#dddfe2] focus:border-indigo-600'}`}
            >
              <option value="">Day</option>
              {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={month}
              onChange={(e) => { setMonth(e.target.value); setDobError(''); }}
              required
              className={`flex-1 px-2 py-3 rounded-xl border bg-white text-base outline-none transition-[border-color] duration-150 ${month ? 'text-[#1c1e21]' : 'text-[#90949c]'} ${dobError ? 'border-red-500 focus:border-red-500' : 'border-[#dddfe2] focus:border-indigo-600'}`}
            >
              <option value="">Month</option>
              {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={year}
              onChange={(e) => { setYear(e.target.value); setDobError(''); }}
              required
              className={`flex-1 px-2 py-3 rounded-xl border bg-white text-base outline-none transition-[border-color] duration-150 ${year ? 'text-[#1c1e21]' : 'text-[#90949c]'} ${dobError ? 'border-red-500 focus:border-red-500' : 'border-[#dddfe2] focus:border-indigo-600'}`}
            >
              <option value="">Year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {dobError && <span className="text-sm text-red-500">{dobError}</span>}
        </div>
        {!fromGoogle && (
          <>
            <PasswordInput
              value={password}
              onChange={(v) => { setPassword(v); setPasswordError(''); }}
              label="Password"
              autoComplete="new-password"
              minLength={8}
              error={passwordError || undefined}
            />
            <PasswordInput
              value={confirmPassword}
              onChange={(v) => { setConfirmPassword(v); setConfirmError(''); }}
              label="Confirm password"
              autoComplete="new-password"
              error={confirmError || undefined}
            />
          </>
        )}
        <button
          type="submit"
          disabled={isLoading || (!fromGoogle && (password.length < 8 || password !== confirmPassword))}
          className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Create Account'}
        </button>
      </form>
    </AuthCard>
  );
}
