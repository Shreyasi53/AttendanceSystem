import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthForm from "./pages/AuthForm";
import AppLayout from "./layouts/AppLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ClassroomDetail from "./pages/teacher/ClassroomDetails";
import Attendance from "./pages/teacher/Attendance";
import Scan from "./pages/student/scan";
import AttendanceHistory from "./pages/teacher/AttendanceHistory";
import TeacherSessionStudents from "./pages/teacher/TeacherSessionStudents";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />

        <Route path="/teacher" element={<AppLayout role="teacher" />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="class/:classCode" element={<ClassroomDetail />} />
          <Route path="class/:classCode/attendance" element={<Attendance />} />
          <Route
            path="/teacher/class/:classCode/history"
            element={<AttendanceHistory />}
          />
          <Route
            path="/teacher/class/:classCode/history/:sessionId"
            element={<TeacherSessionStudents />}
          />
        </Route>

        <Route path="/student" element={<AppLayout role="student" />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="/student/Scan" element={<Scan />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
