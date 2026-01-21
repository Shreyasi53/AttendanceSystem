import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ManualAttendance from "./ManualAttendance";
import QrAttendance from "./QrAttendance";

const Attendance = () => {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState(""); // "" | "manual" | "qr"

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <button
        onClick={() => navigate(-1)}
        className="text-blue-400 underline mb-4"
      >
        ← Back
      </button>

      <h1 className="text-2xl font-bold mb-6">Take Attendance</h1>
      <p className="mb-4 text-gray-300">Class Code: {classCode}</p>

      {/* Choose Mode UI */}
      {mode === "" && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">Choose Mode</h2>
          <div className="flex gap-3">
            <button
              onClick={() => setMode("manual")}
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
            >
              Manual Attendance
            </button>

            <button
              onClick={() => setMode("qr")}
              className="px-4 py-2 bg-yellow-600 rounded hover:bg-yellow-700"
            >
              QR Attendance
            </button>
          </div>
        </div>
      )}

      {/* Manual Attendance Component */}
      {mode === "manual" && (
        <ManualAttendance
          classCode={classCode}
          onBack={() => setMode("")}
        />
      )}

      {/* QR Attendance Component */}
      {mode === "qr" && (
        <QrAttendance
          classCode={classCode}
          onBack={() => setMode("")}
        />
      )}
    </div>
  );
};

export default Attendance;
