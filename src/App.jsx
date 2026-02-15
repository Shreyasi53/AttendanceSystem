import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
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
import { auth } from "./firebase/firebaseConfig";

/* 🔒 PROTECTED ROUTE */
const ProtectedRoute = ({ children, role }) => {
  const loggedIn = localStorage.getItem("attendify_loggedin");
  const savedRole = localStorage.getItem("attendify_role");
  const user = auth.currentUser;

  if (!loggedIn) return <Navigate to="/" replace />;
  if (role && savedRole !== role) return <Navigate to="/" replace />;
  if (!user) return null;

  return children;
};

function App() {
  return (
    <AlertProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AuthForm />} />

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
        </Routes>
      </Router>
    </AlertProvider>
  );
}

export default App;
