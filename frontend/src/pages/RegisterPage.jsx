import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import AuthCard from '../components/auth-comp/AuthCard';
import FloatingInput from '../components/auth-comp/FloatingInput';
import PasswordInput from '../components/auth-comp/PasswordInput';
import { useRegisterForm } from '../hooks/useRegisterForm.js';

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 76 }, (_, i) => 2025 - i);
const GENDERS = ['Male', 'Female', 'Other'];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, fromGoogle, googleSignupToken, displayName: googleDisplayName } = location.state || {};

  useEffect(() => {
    if (!email) navigate('/signup', { replace: true });
  }, [email, navigate]);

  const { fields, errors, isLoading, isSubmitDisabled, handleSubmit } = useRegisterForm({
    email,
    fromGoogle,
    googleSignupToken,
    googleDisplayName,
  });

  if (!email) return null;

  const selectBase = 'border bg-white text-base outline-none transition-[border-color] duration-150 rounded-xl';
  const dobBorder = errors.dob
    ? 'border-red-500 focus:border-red-500'
    : 'border-[#dddfe2] focus:border-indigo-600';

  return (
    <AuthCard title="Create account">
      <form className="flex flex-col w-full gap-8" onSubmit={handleSubmit} noValidate>
        <FloatingInput type="email" value={email} readOnly label="Email" />

        <FloatingInput
          value={fields.displayName}
          onChange={fields.setDisplayName}
          label="Display name"
          error={errors.displayName || undefined}
        />

        <div className="flex flex-col gap-1.5">
          <select
            value={fields.gender}
            onChange={(e) => fields.setGender(e.target.value)}
            required
            className={`w-full px-4 py-3.5 ${selectBase} ${fields.gender ? 'text-[#1c1e21]' : 'text-[#90949c]'} ${
              errors.gender ? 'border-red-500 focus:border-red-500' : 'border-[#dddfe2] focus:border-indigo-600'
            }`}
          >
            <option value="">--Gender--</option>
            {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          {errors.gender && <span className="text-sm text-red-500">{errors.gender}</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex flex-col md:flex-row gap-2">
            {[
              { value: fields.day, setter: fields.setDay, placeholder: 'Day', options: DAYS },
              { value: fields.month, setter: fields.setMonth, placeholder: 'Month', options: MONTHS },
              { value: fields.year, setter: fields.setYear, placeholder: 'Year', options: YEARS },
            ].map(({ value, setter, placeholder, options }) => (
              <select
                key={placeholder}
                value={value}
                onChange={(e) => setter(e.target.value)}
                required
                className={`flex-1 px-2 py-3 ${selectBase} ${value ? 'text-[#1c1e21]' : 'text-[#90949c]'} ${dobBorder}`}
              >
                <option value="">{placeholder}</option>
                {options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ))}
          </div>
          {errors.dob && <span className="text-sm text-red-500">{errors.dob}</span>}
        </div>

        {!fromGoogle && (
          <>
            <PasswordInput
              value={fields.password}
              onChange={fields.setPassword}
              label="Password"
              autoComplete="new-password"
              minLength={8}
              error={errors.password || undefined}
            />
            <PasswordInput
              value={fields.confirmPassword}
              onChange={fields.setConfirmPassword}
              label="Confirm password"
              autoComplete="new-password"
              error={errors.confirmPassword || undefined}
            />
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="px-3 py-2.5 text-base font-semibold rounded-full border-none bg-indigo-600 text-white cursor-pointer transition-colors duration-150 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Create Account'}
        </button>
      </form>
    </AuthCard>
  );
}
