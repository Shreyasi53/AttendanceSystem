import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  doc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from "firebase/firestore";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [className, setClassName] = useState("");
  const [section, setSection] = useState("");
  const [subject, setSubject] = useState("");
  const [myClasses, setMyClasses] = useState([]);
  // Helper to generate Code
  const generateClassCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };
  // Function to Create Class (Firestore
  const handleCreateClass = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Not logged in!");

    const classCode = generateClassCode();

    const classData = {
      name: className,
      section: section,
      subject: subject,
      classCode: classCode,
      teacherId: user.uid,
      createdAt: new Date(),
    };

    try {
      await setDoc(doc(db, "classrooms", classCode), classData);
      alert("Classroom Created!");

      // Refresh list
      fetchMyClasses();

      setClassName("");
      setSection("");
      setSubject("");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };
  const fetchMyClasses = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const q = query(
      collection(db, "classrooms"),
      where("teacherId", "==", user.uid),
    );
    const querySnapshot = await getDocs(q);

    const classes = [];
    querySnapshot.forEach((doc) => {
      classes.push(doc.data());
    });

    setMyClasses(classes);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchMyClasses();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-10">
      {/* Create Classroom */}
      <div className="rounded-2xl bg-card border border-white/10 p-6 space-y-5 shadow-sm">
        <h2 className="text-xl font-medium">Create Classroom</h2>

        <form onSubmit={handleCreateClass} className="space-y-4">
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="Classroom Name"
            className="w-full h-12 px-4 bg-input border border-white/10 rounded-lg placeholder:text-muted focus:border-primary outline-none"
            required
          />

          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            placeholder="Section (e.g A)"
            className="w-full h-12 px-4 bg-input border border-white/10 rounded-lg placeholder:text-muted focus:border-primary outline-none"
            required
          />

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject Name"
            className="w-full h-12 px-4 bg-input border border-white/10 rounded-lg placeholder:text-muted focus:border-primary outline-none"
            required
          />

          <button
            type="submit"
            className="btn-primary w-full h-12 rounded-lg font-medium cursor-pointer"
          >
            Create
          </button>
        </form>
      </div>

      {/* My Classrooms */}
      <div className="space-y-4">
        <h2 className="text-xl font-medium">My Classrooms</h2>

        {myClasses.length === 0 ? (
          <p className="text-muted">No classrooms created yet.</p>
        ) : (
          <div className="space-y-3">
            {myClasses.map((cls, index) => (
              <div
                key={index}
                onClick={() => navigate(`/teacher/class/${cls.classCode}`)}
                className="rounded-xl bg-card border border-white/10 p-5 shadow-sm cursor-pointer hover:border-primary/40 hover:bg-card/90 transition"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium">{cls.name}</h3>
                    <p className="text-muted text-sm mt-1">{cls.subject}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-white/10">
                    Code: {cls.classCode}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
