import { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    message: "",
    type: "success",
    open: false,
  });

  const [confirm, setConfirm] = useState(null);

  const showAlert = (message, type = "success") => {
    setAlert({ message, type, open: true });

    setTimeout(() => {
      setAlert((prev) => ({ ...prev, open: false }));
    }, 2500);
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  const showConfirm = (message, onConfirm, confirmText = "Confirm") => {
    setConfirm({ message, onConfirm, confirmText });
  };

  const handleConfirm = async () => {
    if (confirm?.onConfirm) {
      await confirm.onConfirm();
    }
    setConfirm(null);
  };

  const handleCancel = () => setConfirm(null);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm }}>
      {children}

      {/* Toast Alert */}
      {alert.open && (
        <div className="fixed top-6 right-6 z-[999] animate-slideIn">
          <div
            className={`
              px-5 py-3 rounded-xl shadow-lg border flex items-start gap-3
              bg-black/70 backdrop-blur-md text-white min-w-[260px]
              ${alert.type === "success" ? "border-green-500/40" : ""}
              ${alert.type === "error" ? "border-red-500/40" : ""}
              ${alert.type === "info" ? "border-blue-500/40" : ""}
            `}
          >
            <p className="text-sm flex-1">{alert.message}</p>

            <button
              onClick={closeAlert}
              className="text-white/60 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-xl space-y-4 w-80">
            <p className="text-white">{confirm.message}</p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-1 border rounded"
                onClick={handleCancel}
              >
                Cancel
              </button>

              <button
                className="px-4 py-1 bg-red-500 text-white rounded"
                onClick={handleConfirm}
              >
                {confirm.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
