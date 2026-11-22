import type { Gender, Id, ISODateString, User } from '../../../types';

/** Whatever is known about the profile being shown: the signed-in user, the fetched
 * profile, or just the preview (id/name/avatar) passed while it loads.
 */
export type DisplayedProfile = Partial<User> & { id?: Id };

export interface ProfileFormState {
  displayName: string;
  gender: Gender | '';
  dateOfBirth: string;
  bio: string;
  location: string;
}

export const GENDERS: Gender[] = ['Male', 'Female', 'Other'];
export const MAX_BIO_CHARACTERS = 280;
export const MAX_BIO_LINES = 4;
export function toDateInputValue(value: ISODateString | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export function formatDate(value: ISODateString | null | undefined): string {
  if (!value) return 'None';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'None';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function countBioLines(value: string | null | undefined): number {
  const normalized = value?.trim() || '';
  if (!normalized) return 0;
  return normalized.replace(/\r\n?/g, '\n').split('\n').length;
}

export function createFormState(user: DisplayedProfile | null | undefined): ProfileFormState {
  return {
    displayName: user?.displayName || '',
    gender: user?.gender || '',
    dateOfBirth: toDateInputValue(user?.dateOfBirth),
    bio: user?.bio || '',
    location: user?.location || '',
  };
}
