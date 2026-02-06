import { Outlet, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Home, LogOut, Sun, Moon } from "lucide-react";
import { auth } from "../firebase/firebaseConfig";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { useAlert } from "../context/AlertContext";

const MENU = {
  teacher: [
    { name: "Home", path: "/teacher/dashboard", icon: "home" },
    { name: "Theme", action: "theme", icon: "theme" },
    { name: "Logout", action: "logout", icon: "logout" },
  ],
  student: [
    { name: "Home", path: "/student/dashboard", icon: "home" },
    { name: "Theme", action: "theme", icon: "theme" },
    { name: "Logout", action: "logout", icon: "logout" },
  ],
};

const AppLayout = ({ role = "teacher" }) => {
  const [theme, setTheme] = useState("dark");
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();

  // IMPORTANT: user must be in state
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  //load theme on refresh
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);

    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);

    showAlert(
      `${newTheme === "light" ? "Light" : "Dark"} mode enabled`,
      "success",
    );
  };

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
      showConfirm(
        "Are you sure you want to logout?",
        () => {
          signOut(auth).then(() => navigate("/"));
          showAlert("Logged out successfully!", "success");
        },
        "Logout",
      );
    } else if (item.action === "theme") {
      toggleTheme();
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
    <div className="min-h-screen flex flex-col " style={{ background: "var(--color-bg)", color: "var(--color-text)" }}>
      {/* NAV */}
      <header className="h-16 flex items-center px-4 border-b" style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}>
        <div className="relative" ref={dropdownRef}>
          <Avatar name={user?.displayName || "User"} />

          {/* DROPDOWN */}
          {open && (
            <div className="absolute left-0 mt-3 w-48 bg-card border border-white/10 rounded-xl shadow-xl z-50 animate-fadeIn">
              <div className="px-4 py-3 border-b border-white/10">
                <p className="text-sm font-medium">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-muted truncate">{user?.email}</p>
              </div>

              <div className="py-2">
                {MENU[role].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMenuClick(item)}
                    className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-white/10 transition cursor-pointer"
                  >
                    {item.icon === "home" && <Home size={16} />}
                    {item.icon === "logout" && <LogOut size={16} />}
                    {item.icon === "theme" &&
                      (theme === "dark" ? (
                        <Sun size={16} />
                      ) : (
                        <Moon size={16} />
                      ))}

                    <span className="flex-1">
                      {item.action === "theme"
                        ? (theme === "dark" ? "Light Mode" : "Dark Mode")
                        : item.name}
                    </span>
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
