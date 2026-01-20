import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

const ClassroomDetail = () => {
  const { classCode } = useParams();
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);

  // Fetch class info
  const fetchClassInfo = async () => {
    const classRef = doc(db, "classrooms", classCode);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      alert("Classroom not found!");
      return;
    }

    setClassInfo(classSnap.data());
  };

  // Fetch students in class
  const fetchStudents = async () => {
    const studentsRef = collection(db, "classrooms", classCode, "students");
    const snap = await getDocs(studentsRef);

    const studentList = [];
    snap.forEach((doc) => studentList.push(doc.data()));

    // Sort by roll number (ascending)
    studentList.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

    setStudents(studentList);
  };

  // Remove student from class
  const removeStudent = async (uid) => {
    if (!window.confirm("Remove this student?")) return;

    const ref = doc(db, "classrooms", classCode, "students", uid);
    await deleteDoc(ref);

    fetchStudents();
  };

  // Check auth + fetch
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/");
      } else {
        fetchClassInfo();
        fetchStudents();
      }
    });

    return () => unsub();
  }, []);

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p>Loading classroom...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-4">Classroom Details</h1>

      {/* Class Info */}
      <div className="bg-gray-800 p-4 rounded-lg mb-6">
        <p><span className="font-semibold">Class:</span> {classInfo.name} ({classInfo.section})</p>
        <p><span className="font-semibold">Subject:</span> {classInfo.subject}</p>
        <p><span className="font-semibold">Class Code:</span> {classCode}</p>
        <p><span className="font-semibold">Students:</span> {students.length}</p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        <button
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          onClick={() => navigate(`/teacher/class/${classCode}/attendance`)}
        >
          Take Attendance
        </button>

        <button
          className="px-4 py-2 bg-purple-600 rounded hover:bg-purple-700"
          onClick={() => alert("Attendance history coming soon!")}
        >
          View Attendance
        </button>
      </div>

      {/* Students List */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h2 className="text-xl mb-3 font-semibold">Students List</h2>

        {students.length === 0 ? (
          <p className="text-gray-400">No students have joined yet.</p>
        ) : (
          <ul className="space-y-2">
            {students.map((std, index) => (
              <li
                key={index}
                className="p-3 bg-gray-700 rounded flex justify-between items-center"
              >
                <span>
                  <span className="font-semibold">{std.rollNo}</span> — {std.studentName}
                </span>

                <button
                  className="text-red-400 hover:underline"
                  onClick={() => removeStudent(std.uid)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ClassroomDetail;
