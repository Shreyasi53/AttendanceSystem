import { Outlet, useNavigate } from "react-router-dom";
import { useState } from "react";
import { FiMenu } from "react-icons/fi";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

const TeacherLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const user = auth.currentUser;

  const navigate = useNavigate(); 

  const Avatar = ({ name }) => {
    const letter = name?.charAt(0)?.toUpperCase() || "U";
    return (
      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold cursor-pointer">
        {letter}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col">
      {/* NAVBAR */}
      <header className="w-full h-16 flex items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <FiMenu size={22} className="cursor-pointer" onClick={() => setDrawerOpen(true)} />
          <h1 className="text-xl font-semibold">Attendance App</h1>
        </div>
        <Avatar name={user?.displayName || "Teacher"} />
      </header>

      {/* DRAWER */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#1E293B] p-5 z-50 transform transition-transform duration-200 ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <h2 className="text-lg font-semibold mb-4">Menu</h2>
        <ul className="space-y-3">

          <li
            className="cursor-pointer hover:text-blue-400"
            onClick={() => {
              navigate("/teacher/dashboard");
              setDrawerOpen(false);
            }}
          >
            Home
          </li>

          <li className="cursor-pointer hover:text-blue-400">Settings</li>

          <li
            className="cursor-pointer hover:text-blue-400"
            onClick={() => {
              signOut(auth).then(() => {
                navigate("/");
              });
            }}
          >
            Logout
          </li>
        </ul>
      </aside>

      {/* PAGE CONTENT */}
      <main className="flex-1 overflow-y-auto p-5">
        <Outlet />
      </main>
    </div>
  );
};

export default TeacherLayout;
