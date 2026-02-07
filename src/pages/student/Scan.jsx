import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../../context/AlertContext";

const MAX_DISTANCE = 300;

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const toRad = (x) => (x * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function Scan() {
  const navigate = useNavigate();
  const user = auth.currentUser;
  const { showAlert } = useAlert();

  const [waiting, setWaiting] = useState(false);
  const [scanned, setScanned] = useState(false);

  const [pendingPath, setPendingPath] = useState(null);

  const heartbeatIntervalRef = useRef(null);

  const messages = [
    "Wait for teacher...",
    "Teacher is calculating attendance...",
    "Don't close this tab...",
    "Teacher is busy, please wait...",
    "Verifying your attendance...",
    "Almost done... stay here!",
  ];

  const [waitMsg, setWaitMsg] = useState(messages[0]);

  const qrRegionId = "qr-reader";

  // Random waiting message changer
  useEffect(() => {
    if (!waiting) return;

    const interval = setInterval(() => {
      setWaitMsg(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [waiting]);

  // Warn if student switches tab
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && waiting) {
        showAlert("Don't switch tabs! Attendance may be cancelled!", "error");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [waiting]);

  // Warn if student closes tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (waiting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [waiting]);

  // Start Heartbeat
  const startHeartbeat = (pendingRef) => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        await updateDoc(pendingRef, {
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        console.log("Heartbeat failed:", err);
      }
    }, 3000);
  };

  // Stop Heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrRegionId);

    Html5Qrcode.getCameras()
      .then((devices) => {
        let backCam = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear") ||
            d.label.toLowerCase().includes("environment")
        );

        if (!backCam) {
          backCam = devices.find(
            (d) =>
              !d.label.toLowerCase().includes("wide") &&
              !d.label.toLowerCase().includes("depth")
          );
        }

        if (!backCam) backCam = devices[devices.length - 1];

        const cameraId = backCam.id;

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
            }
          )
          .catch((err) => {
            console.error("CAMERA START FAILED:", err);
            showAlert(
              "Camera failed to start. Allow camera permissions & retry.",
              "error"
            );
          });
      })
      .catch((err) => {
        console.error("CAMERA FETCH ERROR:", err);
        showAlert("No camera found on this device.", "error");
      });

    return () => {
      try {
        html5QrCode.stop();
      } catch {}

      stopHeartbeat();
    };
  }, []);

  const handleScan = async (data) => {
    const [classCode, sessionId] = data.split("|");
    verifyScan(classCode, sessionId);
  };

  const verifyScan = async (classCode, sessionId) => {
    if (!user) {
      showAlert("Login required!", "error");
      return;
    }

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
          sessionId
        );

        const snap = await getDoc(sessionRef);

        if (!snap.exists()) {
          showAlert("Invalid Session!", "error");
          return;
        }

        const sessionData = snap.data();

        if (sessionData.status !== "active") {
          showAlert("Session Closed!", "error");
          return;
        }

        // Distance Check
        if (sessionData.teacherLat && sessionData.teacherLng) {
          const dist = getDistance(
            studentLoc.lat,
            studentLoc.lng,
            sessionData.teacherLat,
            sessionData.teacherLng
          );

          if (dist > MAX_DISTANCE) {
            showAlert("You are too far from classroom!", "error");
            return;
          }
        }

        // Student must be joined check
        const studentRef = doc(
          db,
          "classrooms",
          classCode,
          "students",
          user.uid
        );

        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          showAlert("You are not joined in this classroom!", "error");
          return;
        }

        const student = studentSnap.data();

        const pendingRef = doc(
          db,
          "classrooms",
          classCode,
          "sessions",
          sessionId,
          "pending",
          user.uid
        );

        await setDoc(pendingRef, {
          uid: user.uid,
          name: student?.studentName || "Unknown",
          rollNo: student?.rollNo || "N/A",
          location: studentLoc,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          status: "waiting",
        });

        setPendingPath(pendingRef);

        setWaiting(true);

        // Start heartbeat immediately
        startHeartbeat(pendingRef);

        waitForTeacherStop(sessionRef, pendingRef);
      },
      () => showAlert("Location required!", "error")
    );
  };

  const waitForTeacherStop = (sessionRef, pendingRef) => {
    return onSnapshot(sessionRef, async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      if (data.status === "closed") {
        stopHeartbeat();

        try {
          await deleteDoc(pendingRef);
        } catch {}

        showAlert("Attendance Recorded!", "success");
        navigate(-1);
      }
    });
  };

  return (
    <div
      className="min-h-screen p-4 flex flex-col items-center"
      style={{
        background: "var(--color-bg)",
        color: "var(--color-text)",
      }}
    >
      <h1 className="text-xl font-semibold mb-3">Scan QR Attendance</h1>

      <div
        id="qr-reader"
        className="border-theme rounded-xl overflow-hidden"
        style={{
          width: "100%",
          maxWidth: "400px",
          margin: "0 auto",
        }}
      ></div>

      {waiting && (
        <p
          className="mt-4 font-medium text-center px-4 py-2 rounded-lg border-theme bg-card"
          style={{ color: "var(--color-primary)" }}
        >
          {waitMsg}
        </p>
      )}
    </div>
  );
}
