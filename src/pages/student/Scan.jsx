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
import { useAlert } from "../../context/AlertContext";

const MAX_DISTANCE = 300; // meters allowed 
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
  const [waitMsg, setWaitMsg] = useState(messages[0]);
  const qrRegionId = "qr-reader";
  const messages = [
    "Wait for teacher...",
    "Teacher is calculating attendance...",
    "Don't close this tab...",
    "Teacher is busy, please wait...",
    "Verifying your attendance...",
    "Almost done... stay here!",
  ];
//Random waiting messages 
  useEffect(() => {
    if (!waiting) return;

    const interval = setInterval(() => {
      setWaitMsg(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, [waiting]);
 //warn if student switches tab or tries to close
  useEffect(()=>{
    const handleVisibility = () => {
      if(document.hidden && waiting){
        showAlert("Don't switch tabs! Attendance may be cancelled!", "error");
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  },[waiting])
  //warn if student close the tab
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

  useEffect(() => {
    const html5QrCode = new Html5Qrcode(qrRegionId);

    Html5Qrcode.getCameras()
      .then((devices) => {
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
            },
          )
          .catch((err) => {
            console.error("CAMERA START FAILED:", err);
            showAlert(
              "Camera failed to start. Allow camera permissions & retry.",
            );
          });
      })
      .catch((err) => {
        console.error("CAMERA FETCH ERROR:", err);
        showAlert("No camera found on this device.");
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
    if(!user){
      showAlert("Login required!", "error");
      return navigate("/login");
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
          sessionId,
        );

        const snap = await getDoc(sessionRef);

        if (!snap.exists()){
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
        //student must be join check
        const studentRef = doc(
          db,
          "classrooms",
          classCode,
          "students",
          user.uid,
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
      () => showAlert("Location required!", "error")
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
        showAlert("Attendance Recorded!", "success");
        navigate(-1);
      }
    });
  };

  return (
    <div className="min-h-screen p-4 flex flex-col items-center var(--bg-secondary) rounded-lg">
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
          {waitMsg}
        </p>
      )}
    </div>
  );
}
