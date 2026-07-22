export function ConfirmModal({ open, title, message, confirmLabel, onConfirm, onCancel }: {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-[#1A1A1A] border border-[#ffffff14] rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-white font-semibold text-sm mb-2">{title}</h3>
        <p className="text-gray-400 text-sm mb-5">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#ffffff33] text-gray-400 text-xs hover:text-white"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600"
          >
            {confirmLabel || "ELIMINAR"}
          </button>
        </div>
      </div>
    </div>
  )
}
