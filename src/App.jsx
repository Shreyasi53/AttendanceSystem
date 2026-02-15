import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import AuthForm from "./pages/AuthForm";
import AppLayout from "./layouts/AppLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ClassroomDetail from "./pages/teacher/ClassroomDetail";
import ManualAttendance from "./pages/teacher/ManualAttendance";
import QrAttendance from "./pages/teacher/QrAttendance";
import Scan from "./pages/student/Scan";
import AttendanceHistory from "./pages/teacher/AttendanceHistory";
import TeacherSessionStudents from "./pages/teacher/TeacherSessionStudents";

import { AlertProvider } from "./context/AlertContext";
import { auth, db } from "./firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/* ✅ LOADING SCREEN */
const LoadingScreen = () => {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000",
        color: "#fff",
        fontSize: "18px",
      }}
    >
      Loading Attendify...
    </div>
  );
};

/* ✅ PROTECTED ROUTE */
const ProtectedRoute = ({ children, role }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserRole(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const data = userDoc.data();

        setUserRole(data?.role || null);
      } catch (err) {
        console.log("Role fetch error:", err);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  if (loading) return <LoadingScreen />;

  if (!user) return <Navigate to="/" replace />;

  if (role && userRole !== role) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <AlertProvider>
      <Router>
        <Routes>
          {/* AUTH PAGE */}
          <Route path="/" element={<AuthForm />} />

          {/* TEACHER ROUTES */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute role="teacher">
                <AppLayout role="teacher" />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="class/:classCode" element={<ClassroomDetail />} />
            <Route path="class/:classCode/manual" element={<ManualAttendance />} />
            <Route path="class/:classCode/attendance" element={<QrAttendance />} />
            <Route path="class/:classCode/history" element={<AttendanceHistory />} />
            <Route
              path="class/:classCode/history/:sessionId"
              element={<TeacherSessionStudents />}
            />
          </Route>

          {/* STUDENT ROUTES */}
          <Route
            path="/student"
            element={
              <ProtectedRoute role="student">
                <AppLayout role="student" />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="scan" element={<Scan />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AlertProvider>
  );
}

export default App;
