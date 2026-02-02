import { createContext, useContext, useState } from "react";
import Alert from "../components/Alert";

const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alert, setAlert] = useState({
    message: "",
    type: "success", // success | error | info
    open: false,
  });

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

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Alert
        open={alert.open}
        message={alert.message}
        type={alert.type}
        onClose={closeAlert}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
