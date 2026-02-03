import { createContext, useContext, useState } from "react";
import Alert from "../components/Alert";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    message: "",
    type: "success",
    open: false,
  });

  const [confirm, setConfirm] = useState(null); // ✅ FIX 1

  const showAlert = (message, type = "success") => {
    setAlert({
      message,
      type,
      open: true,
    });
  };

  const closeAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  // ✅ CONFIRM LOGIC
  const showConfirm = (message, onConfirm) => {
    setConfirm({ message, onConfirm });
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

      {/* Normal alert */}
      <Alert
        open={alert.open}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />

      {/* Confirm modal */}
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
