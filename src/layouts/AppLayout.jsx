import { Outlet, useNavigate } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import { useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

const MENU = {
  teacher: [
    { name: "Home", path: "/teacher/dashboard" },
    { name: "Settings", path: "/settings" },
    { name: "Logout", action: "logout" }
  ],
  student: [
    { name: "Home", path: "/student/dashboard" },
    { name: "Logout", action: "logout" }
  ]
};

const AppLayout = ({ role = "teacher" }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const user = auth.currentUser;

  const Avatar = ({ name }) => {
    const letter = name?.charAt(0)?.toUpperCase() || "S";
    return (
      <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white font-semibold cursor-pointer">
        {letter}
      </div>
    );
  };

  const handleMenuClick = (item) => {
    if (item.action === "logout") {
      signOut(auth).then(() => navigate("/"));
    } else {
      navigate(item.path);
    }
    setDrawerOpen(false);
  };

  return (
  <div className="min-h-screen flex flex-col text-(--color-text)">
    
    {/* NAVBAR */}
    <header className="w-full h-16 flex items-center justify-between px-4 border-b border-white/10">
      <div className="flex items-center gap-4">
        <FiMenu size={22} className="cursor-pointer" onClick={() => setDrawerOpen(true)} />
        <h1 className="text-l font-semibold">
          {role === "teacher" ? "Teacher Portal" : "Student Portal"}
        </h1>
      </div>
      <Avatar name={user?.displayName || "User"} />
    </header>

    {/* OVERLAY */}
    {drawerOpen && (
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setDrawerOpen(false)} />
    )}

    {/* DRAWER */}
    <aside
      className={`fixed top-0 left-0 h-full w-64 bg-card p-5 z-50 transform transition-transform duration-200 ${
        drawerOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <h2 className="text-lg font-semibold mb-4">Menu</h2>
      <ul className="space-y-3">
        {MENU[role].map((item, idx) => (
          <li
            key={idx}
            className="cursor-pointer hover:text-(--color-primary) transition-colors"
            onClick={() => handleMenuClick(item)}
          >
            {item.name}
          </li>
        ))}
      </ul>
    </aside>
    <main className="flex-1 overflow-y-auto p-5">
      <Outlet />
    </main>
  </div>
);

};

export default AppLayout;
