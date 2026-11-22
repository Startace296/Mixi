import { useEffect, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';

import {
  countBioLines,
  createFormState,
  GENDERS,
  MAX_BIO_CHARACTERS,
  MAX_BIO_LINES,
  type DisplayedProfile,
  type ProfileFormState,
} from './profileUtils';
import { useUpdateProfile } from '../../../hooks/profile';
import type { Gender, User } from '../../../types';

interface EditProfileModalProps {
  user: DisplayedProfile | null | undefined;
  onClose: () => void;
  onSaved: (user: User) => void;
}

export default function EditProfileModal({ user, onClose, onSaved }: EditProfileModalProps) {
  const [form, setForm] = useState(() => createFormState(user));
  const [bioError, setBioError] = useState('');
  const { isLoading: loading, handleUpdateProfile } = useUpdateProfile({ onSaved, onClose });

  useEffect(() => {
    setForm(createFormState(user));
    setBioError('');
  }, [user]);

  const updateField = <K extends keyof ProfileFormState>(field: K, value: ProfileFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleBioChange = (value: string) => {
    if (countBioLines(value) > MAX_BIO_LINES) {
      setBioError(`Bio must be at most ${MAX_BIO_LINES} lines long.`);
      return;
    }

    setBioError('');
    updateField('bio', value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (bioError) {
      toast.error(bioError);
      return;
    }
    await handleUpdateProfile(form);
  };

  const canSubmit =
    !loading &&
    form.displayName.trim() &&
    form.gender &&
    form.dateOfBirth &&
    !bioError;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#f0f2f5] px-6 py-4">
          <h2 className="text-lg font-bold text-[#1c1e21]">Edit profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#65676b] transition-colors hover:bg-[#f0f2f5]"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="space-y-4 px-6 py-5" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">
              Display name
            </label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              className="rounded-lg border border-[#dddfe2] px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">
              Bio
            </label>
            <textarea
              rows={MAX_BIO_LINES}
              maxLength={MAX_BIO_CHARACTERS}
              value={form.bio}
              onChange={(e) => handleBioChange(e.target.value)}
              placeholder="Write something about yourself..."
              className="resize-none rounded-lg border border-[#dddfe2] px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
            />
            <div className="flex items-center justify-between gap-3 text-xs text-[#8a8d91]">
              <span className={bioError ? 'text-red-600' : ''}>
                {bioError || `${form.bio.length}/${MAX_BIO_CHARACTERS} characters · ${countBioLines(form.bio)}/${MAX_BIO_LINES} lines`}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="Your city or country"
              className="rounded-lg border border-[#dddfe2] px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">
              Date of birth
            </label>
            <input
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              className="rounded-lg border border-[#dddfe2] px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-[#65676b]">
              Gender
            </label>
            <select
              value={form.gender}
              onChange={(e) => updateField('gender', e.target.value as Gender | '')}
              className="rounded-lg border border-[#dddfe2] bg-white px-4 py-2.5 text-sm text-[#1c1e21] outline-none transition-colors focus:border-indigo-500"
            >
              <option value="">Select gender</option>
              {GENDERS.map((gender) => (
                <option key={gender} value={gender}>
                  {gender}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#f0f2f5] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
