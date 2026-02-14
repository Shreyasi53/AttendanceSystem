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
import beepSound from "../../assets/beep.mp3";

const MAX_DISTANCE = 80; // meters
const MAX_ACCURACY = 200;

const LEAVE_LIMIT = 2; // seconds allowed outside tab/app
const HEARTBEAT_INTERVAL = 1000; // 1 sec heartbeat

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
  const leaveTimeoutRef = useRef(null);

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

  // ✅ Random waiting message changer
  useEffect(() => {
    if (!waiting) return;

    const interval = setInterval(() => {
      setWaitMsg(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    return () => clearInterval(interval);
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
          status: "waiting",
        });
      } catch (err) {
        console.log("Heartbeat failed:", err);
      }
    }, HEARTBEAT_INTERVAL);
  };

  // Stop Heartbeat
  const stopHeartbeat = () => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = null;
    }
  };

  // 🔥 STRICT TAB CLOSE / APP MINIMIZE DETECTION
  useEffect(() => {
    if (!waiting || !pendingPath) return;

    const markPaused = async () => {
      try {
        await updateDoc(pendingPath, {
          status: "paused",
          pausedAt: serverTimestamp(),
        });
      } catch {}
    };

    const markLeft = async () => {
      try {
        await updateDoc(pendingPath, {
          status: "left",
          leftAt: serverTimestamp(),
        });
      } catch {}
    };

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        await markPaused();

        // ✅ clear previous timer (important fix)
        if (leaveTimeoutRef.current) {
          clearTimeout(leaveTimeoutRef.current);
        }

        // Start strict timer (2 sec)
        leaveTimeoutRef.current = setTimeout(async () => {
          await markLeft();
        }, LEAVE_LIMIT * 1000);
      } else {
        // Cancel timer if student comes back fast
        if (leaveTimeoutRef.current) {
          clearTimeout(leaveTimeoutRef.current);
          leaveTimeoutRef.current = null;
        }

        try {
          await updateDoc(pendingPath, {
            status: "waiting",
            backAt: serverTimestamp(),
          });
        } catch {}
      }
    };

    // If tab is closed completely
    const handleBeforeUnload = async (e) => {
      await markLeft();
      e.preventDefault();
      e.returnValue = "";
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);

      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
    };
  }, [waiting, pendingPath]);

  // QR Scanner
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

        if (!backCam) backCam = devices[devices.length - 1];

        html5QrCode
          .start(
            backCam.id,
            {
              fps: 15,
              qrbox: { width: 280, height: 280 },
            },
            (decodedText) => {
              if (!scanned && !waiting) {
                setScanned(true);
                html5QrCode.stop();

                // ✅ Beep sound
                new Audio(beepSound).play().catch(() => {});

                handleScan(decodedText);
              }
            },
            (scanErr) => {
              console.warn("SCAN ERROR:", scanErr);
            }
          )
          .catch((err) => {
            console.error("CAMERA START FAILED:", err);
            showAlert("Camera permission required!", "error");
            navigate(-1);
          });
      })
      .catch((err) => {
        console.error("CAMERA FETCH ERROR:", err);
        showAlert("No camera found!", "error");
        navigate(-1);
      });

    return () => {
      try {
        html5QrCode.stop();
      } catch {}

      stopHeartbeat();
    };
  }, []);

  const handleScan = async (data) => {
    const parts = data.split("|");

    if (parts.length !== 2) {
      showAlert("Invalid QR!", "error");
      navigate(-1);
      return;
    }

    const [classCode, sessionId] = parts;
    verifyScan(classCode, sessionId);
  };

  const verifyScan = async (classCode, sessionId) => {
    if (!user) {
      showAlert("Login required!", "error");
      navigate(-1);
      return;
    }

    setWaiting(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const studentLoc = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };

        const accuracy = pos.coords.accuracy;

        if (accuracy > MAX_ACCURACY) {
          showAlert(
            "GPS accuracy too low! Enable High Accuracy Location.",
            "error"
          );
          navigate(-1);
          return;
        }

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
          navigate(-1);
          return;
        }

        const sessionData = snap.data();

        if (sessionData.status !== "active") {
          showAlert("Session Closed!", "error");
          navigate(-1);
          return;
        }

        // Teacher location must exist
        if (!sessionData.teacherLat || !sessionData.teacherLng) {
          showAlert("Teacher location missing. Attendance blocked!", "error");
          navigate(-1);
          return;
        }

        // Distance check
        const dist = getDistance(
          studentLoc.lat,
          studentLoc.lng,
          sessionData.teacherLat,
          sessionData.teacherLng
        );

        const allowedDistance = MAX_DISTANCE + accuracy;

        if (dist > allowedDistance) {
          showAlert("You are too far from classroom!", "error");
          navigate(-1);
          return;
        }

        // Student must be joined check
        const studentRef = doc(db, "classrooms", classCode, "students", user.uid);

        const studentSnap = await getDoc(studentRef);

        if (!studentSnap.exists()) {
          showAlert("You are not joined in this classroom!", "error");
          navigate(-1);
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

        // Create pending record
        await setDoc(pendingRef, {
          uid: user.uid,
          name: student?.studentName || "Unknown",
          rollNo: student?.rollNo || "N/A",
          location: studentLoc,
          accuracy: accuracy,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          status: "waiting",
        });

        setPendingPath(pendingRef);

        // Start heartbeat
        startHeartbeat(pendingRef);

        waitForTeacherStop(sessionRef, pendingRef);
      },
      () => {
        showAlert("Location required to mark attendance!", "error");
        navigate(-1);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
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
        className="border-theme rounded-xl overflow-hidden bg-card"
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