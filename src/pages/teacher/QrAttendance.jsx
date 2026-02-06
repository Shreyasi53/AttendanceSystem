import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useAlert } from "../../context/AlertContext";
import QRCode from "qrcode"; // <-- use qrcode NOT react-qr-code
import { db } from "../../firebase/firebaseConfig";
import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

const QrAttendance = () => {
  const { classCode } = useParams();
  const [qrActive, setQrActive] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [qrUrl, setQrUrl] = useState(null); // <-- store PNG qr
  const { showConfirm } = useAlert();
  const navigate = useNavigate();

  const generateSessionId = () =>
    "SESSION_" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const startQrSession = async () => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;

        await setDoc(
          doc(db, "classrooms", classCode, "sessions", newSessionId),
          {
            classCode,
            sessionId: newSessionId,
            type: "qr",
            status: "active",
            startedAt: serverTimestamp(),
            teacherLat: latitude,
            teacherLng: longitude,
          },
        );

        generateQr(`${classCode}|${newSessionId}`);
        setQrActive(true);
      },
      async () => {
        await setDoc(
          doc(db, "classrooms", classCode, "sessions", newSessionId),
          {
            classCode,
            sessionId: newSessionId,
            type: "qr",
            status: "active",
            startedAt: serverTimestamp(),
            teacherLat: null,
            teacherLng: null,
          },
        );

        generateQr(`${classCode}|${newSessionId}`);
        setQrActive(true);
      },
    );
  };

  const generateQr = async (text) => {
    QRCode.toDataURL(
      text,
      {
        margin: 2, // quiet zone
        scale: 10, // sharp scaling
        errorCorrectionLevel: "H",
        color: {
          dark: "#000000", // QR
          light: "#FFFFFF", // background
        },
      },
      (err, url) => {
        if (!err) setQrUrl(url);
      },
    );
  };

  const stopQrSession = async () => {
    if (!sessionId) return;

    const sessionRef = doc(db, "classrooms", classCode, "sessions", sessionId);
    const pendingRef = collection(
      db,
      "classrooms",
      classCode,
      "sessions",
      sessionId,
      "pending",
    );

    const pendingSnap = await getDocs(pendingRef);

    const historySessionRef = doc(
      db,
      "attendance",
      classCode,
      "sessions",
      sessionId,
    );

    // update class session metadata
    await setDoc(
      doc(db, "attendance", classCode, "sessions", sessionId),
      {
        sessionId,
        endedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const studentsColRef = collection(historySessionRef, "students");

    // Move pending -> history/students
    for (const p of pendingSnap.docs) {
      const data = p.data();
      await setDoc(doc(studentsColRef, p.id), {
        uid: p.id,
        name: data?.name || "Unknown",
        rollNo: data?.rollNo || "N/A",
        time: data.joinedAt,
        status: "present",
      });
    }

    for (const p of pendingSnap.docs) {
      await deleteDoc(doc(pendingRef, p.id));
    }

    // Close session in classrooms
    await updateDoc(sessionRef, {
      status: "closed",
      endedAt: serverTimestamp(),
    });

    setQrActive(false);
  };

  useEffect(() => {
    startQrSession();
  }, []);

  return (
    <div className="flex justify-center mt-15">
      <button
        onClick={() => navigate(-1)}
        className="fixed top-24 left-15 text-primary flex items-center gap-1 px-4 py-2 bg-input rounded-lg hover:brightness-90 transition z-10"
      >
         <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <div className="bg-card border-theme rounded-2xl p-6 flex flex-col items-center text-center space-y-4 shadow w-full max-w-md lg:max-w-lg">
        <h2 className="text-xl font-semibold">QR Mode Active</h2>

        {qrActive && (
          <div className="flex flex-col items-center space-y-4">
            {/* Render PNG QR instead of SVG */}
            {qrUrl && (
              <img
                src={qrUrl}
                alt="qr"
                style={{
                  width: 200,
                  background: "white",
                  padding: 10,
                  borderRadius: 10,
                }}
              />
            )}

            <p className="text-muted text-sm">
              Session:{" "}
              <span className=" font-medium"
              style={{ color: "var(--color-primary)" }}>{sessionId}</span>
            </p>

            <button
              onClick={() =>
                showConfirm(
                  "Are you sure you want to stop attendance?",
                  () => stopQrSession(),
                  "Stop",
                )
              }
              className="px-4 py-2 rounded-lg font-medium text-white bg-purple-600 hover:brightness-90"
            >
              Stop Attendance
            </button>
          </div>
        )}

        {!qrActive && sessionId && (
          <p className="text-red-400 font-medium">QR Attendance Ended!</p>
        )}
      </div>
    </div>
  );
};

export default QrAttendance;
