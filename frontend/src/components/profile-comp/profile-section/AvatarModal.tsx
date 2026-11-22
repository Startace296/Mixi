import { useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import toast from 'react-hot-toast';

import { useUploadAvatar } from '../../../hooks/profile';
import type { User } from '../../../types';

interface AvatarModalShellProps {
  title: string;
  onClose: () => void;
  children?: ReactNode;
  modalClassName?: string;
}

function AvatarModalShell({ title, onClose, children, modalClassName = 'max-w-sm' }: AvatarModalShellProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className={`w-full ${modalClassName} rounded-2xl bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#f0f2f5] px-6 py-4">
          <h2 className="text-lg font-bold text-[#1c1e21]">{title}</h2>
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
        {children}
      </div>
    </div>
  );
}

export default function AvatarModal({ onClose, onSaved }: { onClose: () => void; onSaved: (user: User) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { isLoading: loading, validateAvatarFile, handleUploadAvatar } = useUploadAvatar({ onSaved, onClose });

  function closeAll() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    onClose();
  }

  function resetFileInput() {
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const check = validateAvatarFile(file);
    if (!check.valid) {
      toast.error(check.message);
      resetFileInput();
      return;
    }

    setPendingFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    resetFileInput();
  }

  function handlePreviewCancel() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setPendingFile(null);
  }

  async function handleConfirm() {
    if (!pendingFile) return;
    const success = await handleUploadAvatar(pendingFile);
    if (success) {
      closeAll();
    }
  }

  if (previewUrl) {
    return (
      <AvatarModalShell title="Confirm profile picture" onClose={closeAll} modalClassName="max-w-md">
        <div className="flex flex-col items-center gap-5 px-8 py-8">
          <img src={previewUrl} alt="" className="h-48 w-48 rounded-full object-cover shadow-md" />
          <p className="text-center text-sm text-[#65676b]">Use this photo as your profile picture?</p>
        </div>
        <div className="flex gap-3 border-t border-[#f0f2f5] px-8 py-5">
          <button
            type="button"
            onClick={handlePreviewCancel}
            disabled={loading}
            className="flex-1 rounded-lg border border-[#e4e6eb] py-2 text-sm font-semibold text-[#65676b] transition-colors hover:bg-[#f0f2f5] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {loading ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </AvatarModalShell>
    );
  }

  return (
    <AvatarModalShell title="Choose profile picture" onClose={closeAll}>
      <div className="flex justify-center px-6 py-8">
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload photo
        </button>
      </div>
    </AvatarModalShell>
  );
}
