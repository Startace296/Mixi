import { useState } from 'react';
import toast from 'react-hot-toast';
import PasswordInput from '../auth-comp/PasswordInput';
import { HOME_SUB_SECTION } from '../../lib/homeSections';
import { changePassword } from '../../lib/api';

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isSubmitDisabled =
    isLoading ||
    !currentPassword.trim() ||
    !newPassword.trim() ||
    !confirmPassword.trim() ||
    newPassword.trim().length < 8 ||
    newPassword !== confirmPassword;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitDisabled) return;

    setIsLoading(true);
    try {
      const data = await changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(data.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="rounded-lg border border-[#e4e6eb] bg-white p-5 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="mb-4">
        <h2 className="text-base font-bold text-[#1c1e21]">Change password</h2>
        <p className="mt-1 text-sm text-[#65676b]">Update your account password.</p>
      </div>

      <div className="space-y-4">
        <PasswordInput
          label="Current password"
          value={currentPassword}
          onChange={setCurrentPassword}
          autoComplete="off"
          required
        />
        <PasswordInput
          label="New password"
          value={newPassword}
          onChange={setNewPassword}
          autoComplete="off"
          minLength={8}
          required
        />
        <PasswordInput
          label="Confirm new password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          autoComplete="off"
          minLength={8}
          required
          error={confirmPassword && newPassword !== confirmPassword ? 'Confirmation password does not match.' : undefined}
        />
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={isSubmitDisabled}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-[#cfd4da]"
        >
          {isLoading ? 'Saving...' : 'Save password'}
        </button>
      </div>
    </form>
  );
}

function FeedShell({ title, description, children }) {
  return (
    <div className="mx-auto w-full max-w-[900px] space-y-4 px-4 py-6">
      <div className="rounded-lg border border-[#e4e6eb] bg-white px-5 py-4 shadow-[0_2px_4px_rgba(0,0,0,0.08),0_8px_16px_rgba(0,0,0,0.06)]">
        <h1 className="text-xl font-bold text-[#1c1e21]">{title}</h1>
        {description && <p className="mt-1 text-sm text-[#65676b]">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsSectionView({ subSection }) {
  const sectionMetaBySubSection = {
    [HOME_SUB_SECTION.settings_change_password]: {
      title: 'Account',
      desc: 'Manage your account settings.',
    },
  };
  const sectionViewBySubSection = {
    [HOME_SUB_SECTION.settings_change_password]: <ChangePasswordCard />,
  };

  const activeSubSection = sectionMetaBySubSection[subSection]
    ? subSection
    : HOME_SUB_SECTION.settings_change_password;
  const { title, desc } = sectionMetaBySubSection[activeSubSection];

  return (
    <FeedShell title={title} description={desc}>
      {sectionViewBySubSection[activeSubSection]}
    </FeedShell>
  );
}
