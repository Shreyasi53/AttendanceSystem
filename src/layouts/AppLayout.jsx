import { Outlet, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { auth } from "../firebase/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";

const MENU = {
  teacher: [
    { name: "Home", path: "/teacher/dashboard" },
    { name: "Logout", action: "logout" },
  ],
  student: [
    { name: "Home", path: "/student/dashboard" },
    { name: "Logout", action: "logout" },
  ],
};

const AppLayout = ({ role = "teacher" }) => {
  const navigate = useNavigate();

  // IMPORTANT: user must be in state
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Listen to auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsub();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  const handleMenuClick = (item) => {
    if (item.action === "logout") {
      signOut(auth).then(() => navigate("/"));
    } else {
      navigate(item.path);
    }
    setOpen(false);
  };

  // Avatar component
  const Avatar = ({ name }) => {
    const letter = name?.charAt(0)?.toUpperCase() || "U";
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="w-9 h-9 rounded-full bg-purple-600
                   flex items-center justify-center
                   text-white font-semibold cursor-pointer select-none"
      >
        {letter}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* HEADER */}
      <header className="h-16 flex items-center px-4 border-b border-white/10">
        <div className="relative" ref={dropdownRef}>
          <Avatar name={user?.displayName || "User"} />

          {/* DROPDOWN */}
          {open && (
            <div
              className="absolute left-0 mt-3 w-48
                         bg-card border border-white/10
                         rounded-xl shadow-xl z-50
                         animate-fadeIn"
            >
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-muted truncate">
                  {user?.email}
                </p>
              </div>

              <div className="py-2">
                {MENU[role].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMenuClick(item)}
                    className="w-full text-left px-4 py-2 text-sm
                               hover:bg-white/10 transition"
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <h1 className="ml-4 text-base font-semibold">
          {role === "teacher" ? "Teacher Portal" : "Student Portal"}
        </h1>
      </header>

      {/* PAGE CONTENT */}
      <main className="flex-1 overflow-y-auto p-5">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
