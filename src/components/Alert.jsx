const Alert = ({ message, type, open, onClose, onConfirm }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-(--color-bg-card) p-6 rounded-xl w-[90%] max-w-sm">
        <p className="text-(--color-text) mb-5">{message}</p>

        {type === "confirm" ? (
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-lg bg-input text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 h-11 rounded-lg bg-red-600 text-white"
            >
              Remove
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full h-11 rounded-lg bg-[var(--color-primary)] text-white"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;
