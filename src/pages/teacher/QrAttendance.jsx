import React, { useState, useEffect } from "react";
import QRCode from "react-qr-code";
import { db } from "../../firebase/firebaseConfig";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const QrAttendance = ({ classCode, onBack }) => {
  const [qrActive, setQrActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const generateSessionId = () =>
    "SESSION_" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const startQrSession = async () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    await setDoc(
      doc(db, "classrooms", classCode, "sessions", newSessionId),
      {
        classCode,
        sessionId: newSessionId,
        type: "qr",
        status: "active",
        startedAt: serverTimestamp(),
      }
    );

    setQrActive(true);
  };

  const stopQrSession = async () => {
    await updateDoc(
      doc(db, "classrooms", classCode, "sessions", sessionId),
      {
        status: "closed",
        endedAt: serverTimestamp(),
      }
    );
    setQrActive(false);
  };

  useEffect(() => {
    startQrSession();
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-lg mt-6 text-center">
      <h2 className="text-xl font-semibold mb-3">QR Mode Active</h2>

      {qrActive && (
        <div className="w-full flex justify-center">
        <div className="flex flex-col item-center gap-3">
          <QRCode value={`${classCode}|${sessionId}`} size={200} bgColor="#1F2937"
            fgColor="#10B981" />
          <p className="mt-3 text-gray-300">Session: {sessionId}</p>
          <button
            onClick={stopQrSession}
            className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Stop Attendance
          </button>
        </div>
        </div>
      )}

      {!qrActive && sessionId && (
        <p className="text-red-400 font-semibold mt-3">
          QR Attendance Ended!
        </p>
      )}
    </div>
  );
};

export default QrAttendance;
