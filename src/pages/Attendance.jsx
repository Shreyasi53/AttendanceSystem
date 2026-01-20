import React, { useState } from "react";
import { useParams } from "react-router-dom";
import QRCode from "react-qr-code";
import { db } from "../firebase/firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";

const Attendance = () => {
  const { classCode } = useParams();
  const [modeSelected, setModeSelected] = useState(false);
  const [qrActive, setQrActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);

  const generateSessionId = () => {
    return "SESSION_" + Math.random().toString(36).substring(2, 10).toUpperCase();
  };

  const startQrSession = async () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    const ref = doc(db, "classrooms", classCode, "sessions", newSessionId);

    await setDoc(ref, {
      classCode,
      sessionId: newSessionId,
      type: "qr",
      status: "active",
      startedAt: serverTimestamp(),
    });

    setQrActive(true);
  };

  const stopQrSession = async () => {
    const ref = doc(db, "classrooms", classCode, "sessions", sessionId);
    await updateDoc(ref, {
      status: "closed",
      endedAt: serverTimestamp(),
    });

    setQrActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-2xl font-bold mb-6">Take Attendance</h1>
      <p className="mb-4 text-gray-300">Class Code: {classCode}</p>

      {/* Choose Mode */}
      {!modeSelected && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Choose Mode</h2>
          <div className="flex gap-3">
            <button
              onClick={() => alert("Manual Attendance Coming Soon!")}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Manual Attendance
            </button>
            <button
              onClick={() => {
                setModeSelected(true);
                startQrSession();
              }}
              className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
            >
              QR Attendance
            </button>
          </div>
        </div>
      )}

      {/* QR Mode */}
      {modeSelected && qrActive && (
        <div className="bg-gray-800 p-4 rounded-lg mt-6 text-center">
          <h2 className="text-xl font-semibold mb-3">QR Mode Active</h2>

          <QRCode
            value={`${classCode}|${sessionId}`}
            size={200}
            bgColor="#1F2937"
            fgColor="#10B981"
          />

          <p className="mt-3 text-gray-300">Session: {sessionId}</p>

          <button
            onClick={stopQrSession}
            className="mt-4 px-4 py-2 bg-red-600 rounded hover:bg-red-700"
          >
            Stop Attendance
          </button>
        </div>
      )}

      {/* QR Stopped */}
      {modeSelected && !qrActive && sessionId && (
        <div className="bg-gray-800 p-4 rounded-lg mt-6 text-center">
          <p className="text-lg font-semibold text-red-400">QR Attendance Ended!</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;
