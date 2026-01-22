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
  <div className="bg-card border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow">

    {/* Title */}
    <h2 className="text-xl font-semibold">QR Mode Active</h2>

    {/* QR Active View */}
    {qrActive && (
      <div className="flex flex-col items-center space-y-4">
        
        {/* QR Code */}
        <QRCode
          value={`${classCode}|${sessionId}`}
          size={200}
          bgColor="var(--color-bg-card)"
          fgColor="var(--color-success)"
        />

        {/* Session ID */}
        <p className="text-muted text-sm">
          Session: <span className="text-white font-medium">{sessionId}</span>
        </p>

        {/* Stop Button */}
        <button
          onClick={stopQrSession}
          className="px-4 py-2 rounded-lg font-medium text-white bg-red-600 hover:brightness-90"
        >
          Stop Attendance
        </button>
      </div>
    )}

    {/* QR Ended State */}
    {!qrActive && sessionId && (
      <p className="text-red-400 font-medium">
        QR Attendance Ended!
      </p>
    )}

  </div>
);

};

export default QrAttendance;
