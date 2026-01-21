import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthForm from "./pages/AuthForm";
import TeacherLayout from "./layouts/TeacherLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ClassroomDetail from "./pages/teacher/ClassroomDetails";
import Attendance from "./pages/teacher/Attendance";

function App() {
  return (
    <Router>
      <Routes>

        {/* Public / Auth Route */}
        <Route path="/" element={<AuthForm />} />

        {/* Student Route */}
        <Route path="/student/dashboard" element={<StudentDashboard />} />

        {/* Teacher Routes (wrapped with TeacherLayout) */}
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="class/:classCode" element={<ClassroomDetail />} />
          <Route path="class/:classCode/attendance" element={<Attendance />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
