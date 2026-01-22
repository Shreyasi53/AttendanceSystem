import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import ManualAttendance from "./ManualAttendance";
import QrAttendance from "./QrAttendance";

const Attendance = () => {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState("");
  return (
  <div className="space-y-8">

    <button
      onClick={() => navigate(-1)}
      className="text-primary hover:underline flex items-center gap-1"
    >
      ← Back
    </button>

    <div>
      <h1 className="text-2xl font-semibold">Take Attendance</h1>
      <p className="text-muted mt-1">Class Code: {classCode}</p>
    </div>

    {mode === "" && (
      <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-4 shadow-sm">
        <h2 className="text-xl font-medium">Choose Mode</h2>

        <div className="flex gap-3">

          <button
            onClick={() => setMode("manual")}
            className="bg-input border border-white/10 text-white px-4 py-2 rounded-lg hover:brightness-90"
          >
            Manual Attendance
          </button>

          <button
            onClick={() => setMode("qr")}
            className="btn-primary px-4 py-2 rounded-lg font-medium hover:brightness-90"
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
