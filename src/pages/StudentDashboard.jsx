import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  onSnapshot
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const StudentDashboard = () => {
  const [classCode, setClassCode] = useState("");
  const [classExists, setClassExists] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [joinedClasses, setJoinedClasses] = useState([]);

  // 🔹 Check if class exists
  const checkClassroom = async () => {
    const classRef = doc(db, "classrooms", classCode.toUpperCase());
    const docSnap = await getDoc(classRef);

    if (!docSnap.exists()) {
      alert("Invalid class code!");
      setClassExists(false);
    } else {
      setClassExists(true);
    }
  };

  // 🔹 Join classroom
  const joinClassroom = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Not logged in!");

    const classId = classCode.toUpperCase();
    const studentRef = doc(db, "classrooms", classId, "students", user.uid);

    await setDoc(studentRef, {
      studentName,
      rollNo,
      uid: user.uid,
      joinedAt: new Date(),
    });

    alert("Joined Classroom Successfully!");

    // reset UI
    setClassExists(false);
    setClassCode("");
    setStudentName("");
    setRollNo("");

    fetchJoinedClasses(user.uid);
  };

  // 🔹 Fetch classrooms student has joined
  const fetchJoinedClasses = async (uid) => {
    const classroomsRef = collection(db, "classrooms");
    const snapshot = await getDocs(classroomsRef);

    const classes = [];

    for (const classDoc of snapshot.docs) {
      const studentRef = doc(db, "classrooms", classDoc.id, "students", uid);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        classes.push(classDoc.data());
      }
    }

    setJoinedClasses(classes);
  };

  // 🔹 Load joined classrooms on auth state change
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchJoinedClasses(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">Student Dashboard</h1>

      {/* Step 1: Enter Code */}
      {!classExists && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl mb-3 font-semibold">Join Classroom</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              className="flex-1 p-2 bg-gray-700 rounded border border-gray-600"
              placeholder="Enter class code"
            />
            <button
              onClick={checkClassroom}
              className="px-4 bg-blue-600 rounded hover:bg-blue-700"
            >
              Check
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Show student form if class exists */}
      {classExists && (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl mb-3 font-semibold">Enter Your Details</h2>
          <form onSubmit={joinClassroom} className="space-y-3">
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
              placeholder="Your Name"
              required
            />
            <input
              type="text"
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              className="w-full p-2 bg-gray-700 rounded border border-gray-600"
              placeholder="Roll Number"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 p-2 rounded hover:bg-green-700"
            >
              Join Classroom
            </button>
          </form>
        </div>
      )}

      {/* Joined Classrooms List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl mb-3 font-semibold">My Classrooms</h2>

        {joinedClasses.length === 0 ? (
          <p className="text-gray-400">You haven't joined any classrooms yet.</p>
        ) : (
          <ul className="space-y-2">
            {joinedClasses.map((cls, index) => (
              <li key={index} className="p-3 bg-gray-700 rounded">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    {cls.name} ({cls.section})
                  </span>
                  <span className="text-sm bg-gray-600 px-2 py-1 rounded">
                    {cls.subject}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
};

export default StudentDashboard;
