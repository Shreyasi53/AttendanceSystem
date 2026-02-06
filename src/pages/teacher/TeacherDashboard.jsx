import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Trash2 } from "lucide-react";
import { auth, db } from "../../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useAlert } from "../../context/AlertContext";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";

const TeacherDashboard = () => {
  const { showAlert, showConfirm } = useAlert();
  const navigate = useNavigate();

  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [myClasses, setMyClasses] = useState([]);
  const [openMenu, setOpenMenu] = useState(null);

  const generateClassCode = () =>
    Math.random().toString(36).substring(2, 8).toUpperCase();

  const copyClassCode = (code) => {
    navigator.clipboard.writeText(code);
    showAlert("Class code copied!", "success");
  };

  const deleteClassroom = async (code) => {
    try {
      await deleteDoc(doc(db, "classrooms", code));
      showAlert("Classroom Deleted!", "success");
      fetchMyClasses();
    } catch {
      showAlert("Failed to delete classroom", "error");
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return showAlert("Not logged in!", "error");

    const classCode = generateClassCode();

    await setDoc(doc(db, "classrooms", classCode), {
      name: className,
      section,
      subject,
      classCode,
      teacherId: user.uid,
      createdAt: new Date(),
    });

    showAlert("Classroom Created!", "success");
    setClassName("");
    setSection("");
    setSubject("");
    fetchMyClasses();
  };

  const fetchMyClasses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "classrooms"),
      where("teacherId", "==", user.uid),
    );

    const snap = await getDocs(q);
    const list = [];
    snap.forEach((doc) => list.push(doc.data()));
    setMyClasses(list);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) fetchMyClasses();
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const close = () => setOpenMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT SIDE */}
        <div className="lg:col-span-1">
          <div className="rounded-2xl bg-card border-theme p-5 sm:p-6 shadow-sm">
            <h2 className="text-lg sm:text-xl font-medium mb-4">
              Create Classroom
            </h2>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <input
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Classroom Name"
                className="h-12 w-full px-4 bg-input border-theme rounded-lg outline-none"
                required
              />

              <input
                value={section}
                onChange={(e) => setSection(e.target.value)}
                placeholder="Section (e.g A)"
                className="h-12 w-full px-4 bg-input border-theme rounded-lg outline-none"
                required
              />

              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject Name"
                className="h-12 w-full px-4 bg-input border-theme rounded-lg outline-none"
                required
              />

              <button className="btn-primary w-full h-11 rounded-lg font-medium">
                Create Classroom
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          <h2 className="text-lg sm:text-xl font-medium">My Classrooms</h2>

          {myClasses.length === 0 ? (
            <p className="text-muted text-sm">No classrooms created yet.</p>
          ) : (
            <div
              className={`relative flex flex-col gap-4 max-h-135 overflow-y-auto no-scrollbar ${
                openMenu ? "" : "mask-fade-bottom"
              }`}
            >
              {myClasses.map((cls) => (
                <div
                  key={cls.classCode}
                  onClick={() => navigate(`/teacher/class/${cls.classCode}`)}
                  className={`relative rounded-xl bg-card border-theme p-4 cursor-pointer hover:opacity-90 transition shadow-sm ${
                    openMenu === cls.classCode ? "z-50" : "z-0"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{cls.name}</h3>
                      <p className="text-muted text-sm mt-1">{cls.subject}</p>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(
                          openMenu === cls.classCode ? null : cls.classCode,
                        );
                      }}
                      className="text-muted hover:opacity-70 px-2"
                    >
                      ⋮
                    </button>
                  </div>

                  {openMenu === cls.classCode && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-3 top-10 w-44 bg-manual border-theme rounded-xl shadow-xl z-50 overflow-hidden"
                    >
                      <button
                        onClick={() => {
                          copyClassCode(cls.classCode);
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm hover:bg-input transition"
                      >
                        <Copy size={16} className="text-muted" />
                        <span>Copy</span>
                      </button>

                      <div className="h-[1px] bg-[var(--color-border)]" />
                      <button
                        onClick={() => {
                          showConfirm(
                            "Are you sure you want to delete this classroom?",
                            async () => {
                              await deleteClassroom(cls.classCode);
                            },
                            "Delete",
                          );
                          setOpenMenu(null);
                        }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition"
                      >
                        <Trash2 size={16} className="text-red-500" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
