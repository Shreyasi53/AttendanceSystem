import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthForm from "./pages/AuthForm";
import AppLayout from "./layouts/AppLayout";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import StudentDashboard from "./pages/student/StudentDashboard";
import ClassroomDetail from "./pages/teacher/ClassroomDetails";
import Attendance from "./pages/teacher/Attendance";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthForm />} />

        <Route path="/teacher" element={<AppLayout role="teacher" />}>
          <Route path="dashboard" element={<TeacherDashboard />} />
          <Route path="class/:classCode" element={<ClassroomDetail />} />
          <Route path="class/:classCode/attendance" element={<Attendance />} />
        </Route>

        <Route path="/student" element={<AppLayout role="student" />}>
          <Route path="dashboard" element={<StudentDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
