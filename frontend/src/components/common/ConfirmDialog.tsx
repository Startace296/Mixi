export interface ConfirmDialogProps {
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmClassName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/* ─── Confirm Dialog ─────────────────────────────────────── */
export default function ConfirmDialog({ title, description, confirmLabel = "Confirm", confirmClassName, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4" onClick={onCancel}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2">
          <h3 className="text-base font-bold text-[#1c1e21]">{title}</h3>
          {description && <p className="mt-1.5 text-sm text-[#65676b]">{description}</p>}
        </div>
        <div className="flex gap-2 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-[#e4e6eb] py-2 text-sm font-semibold text-[#65676b] transition hover:bg-[#f0f2f5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmClassName ?? "flex-1 rounded-full bg-red-600 py-2 text-sm font-semibold text-white transition hover:bg-red-700"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
