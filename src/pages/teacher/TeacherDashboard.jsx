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

  // 🔹 Load classrooms when dashboard opens
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchMyClasses();
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Teacher Dashboard</h1>

      {/* Create Classroom */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-xl mb-3 font-semibold">Create Classroom</h2>
        <form onSubmit={handleCreateClass} className="space-y-3">
          <input
            type="text"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            placeholder="Enter classroom name"
            required
          />

          <input
            type="text"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            placeholder="Enter section (e.g A)"
            required
          />

          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 bg-gray-700 rounded border border-gray-600"
            placeholder="Enter subject"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 p-2 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </form>
      </div>

      {/* View Classrooms */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl mb-3 font-semibold">My Classrooms</h2>

        {myClasses.length === 0 ? (
          <p className="text-gray-400">No classrooms created yet.</p>
        ) : (
          <ul className="space-y-2">
            {myClasses.map((cls, index) => (
              <li key={index} className="p-3 bg-gray-700 rounded">
                <li
                  key={index}
                  className="p-3 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 transition"
                  onClick={() => navigate(`/teacher/class/${cls.classCode}`)}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{cls.name}</span>
                    <span className="text-sm bg-gray-600 px-2 py-1 rounded">
                      Code: {cls.classCode}
                    </span>
                  </div>
                </li>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
