import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

const MAX_DISTANCE = 300; // meters allowed (just adjust later)

export default function Scan() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const [waiting, setWaiting] = useState(false);
  const [scanned, setScanned] = useState(false);

  const qrRegionId = "qr-reader";

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrRegionId);

    Html5Qrcode.getCameras()
      .then((devices) => {
        console.log("CAMERAS FOUND:", devices);

        // Try to pick back camera
        let backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment"),
        );

        // Avoid ultra wide / depth
        if (!backCam) {
          backCam = devices.find(
            (d) =>
              !d.label.toLowerCase().includes("wide") &&
              !d.label.toLowerCase().includes("depth"),
          );
        }

        // Final fallback
        if (!backCam) backCam = devices[devices.length - 1];

        const cameraId = backCam.id;
        console.log("USING CAMERA:", cameraId, backCam.label);

        html5QrCode
          .start(
            cameraId,
            {
              fps: 15,
              qrbox: { width: 280, height: 280 },
              videoConstraints: {
                facingMode: { exact: "environment" },
                width: { ideal: 1280 },
                height: { ideal: 720 },
              },
            },
            (decodedText) => {
              if (!scanned && !waiting) {
                setScanned(true);
                html5QrCode.stop();
                handleScan(decodedText);
              }
            },
            (scanErr) => {
              console.warn("SCAN ERROR:", scanErr);
            },
          )
          .catch((err) => {
            console.error("CAMERA START FAILED:", err);
            alert("Camera failed to start. Allow camera permissions & retry.");
          });
      })
      .catch((err) => {
        console.error("CAMERA FETCH ERROR:", err);
        alert("No camera found on this device.");
      });

    return () => {
      try {
        html5QrCode.stop();
      } catch {}
    };
  }, []);

  const handleScan = async (data) => {
    const [classCode, sessionId] = data.split("|");
    verifyScan(classCode, sessionId);
  };

  const verifyScan = async (classCode, sessionId) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const studentLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        const sessionRef = doc(
          db,
          "classrooms",
          classCode,
          "sessions",
          sessionId,
        );

        const snap = await getDoc(sessionRef);
        if (!snap.exists()) return alert("Invalid Session!");
        if (snap.data().status !== "active") return alert("Session Closed!");

        // === fetch student info ===
        const studentRef = doc(
          db,
          "classrooms",
          classCode,
          "students",
          user.uid,
        );
        const studentSnap = await getDoc(studentRef);
        const student = studentSnap.data();

        const pendingRef = doc(
          db,
          "classrooms",
          classCode,
          "sessions",
          sessionId,
          "pending",
          user.uid,
        );

        await setDoc(pendingRef, {
          uid: user.uid,
          name: student?.studentName || "Unknown",
          rollNo: student?.rollNo || "N/A",
          location: studentLoc,
          joinedAt: serverTimestamp(),
          status: "waiting",
        });

        setWaiting(true);
        waitForTeacherStop(sessionRef, pendingRef);
      },
      () => alert("Location required!"),
    );
  };

  const waitForTeacherStop = (sessionRef, pendingRef) => {
    return onSnapshot(sessionRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.status === "closed") {
        try {
          await deleteDoc(pendingRef);
        } catch {}
        alert("Attendance Recorded!");
        navigate(-1);
      }
    });
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center bg-black text-white">
      <h1 className="text-xl font-semibold mb-3">Scan QR Attendance</h1>

      <div
        id="qr-reader"
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
          borderRadius: "8px",
        }}
      ></div>

      {waiting && (
        <p className="mt-3 text-yellow-400 font-medium text-center">
          Waiting for teacher...
        </p>
      )}
    </div>
  );
}
