import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebaseConfig";
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
  <div className="space-y-10 space-x-1">
    <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-2 shadow">
      <p>
        <span className="font-semibold">Class:</span> {classInfo.name} ({classInfo.section})
      </p>
      <p>
        <span className="font-semibold">Subject:</span> {classInfo.subject}
      </p>
      <p>
        <span className="font-semibold">Class Code:</span> {classCode}
      </p>
      <p>
        <span className="font-semibold">Total Students:</span> {students.length}
      </p>
    </div>

   
    <div className="flex gap-3">
      <button
        onClick={() => navigate(`/teacher/class/${classCode}/attendance`)}
        className="btn-primary px-4 py-2 rounded-lg font-medium hover:brightness-90"
      >
        Take Attendance
      </button>

      <button
        onClick={() => navigate(`/teacher/class/${classCode}/history`)}
        className="bg-input px-4 py-2 rounded-lg text-white hover:brightness-90 border border-white/10"
      >
        View Attendance
      </button>
    </div>

    {/* Students List */}
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Students List</h2>

      {students.length === 0 ? (
        <p className="text-muted">No students have joined yet.</p>
      ) : (
        <div className="space-y-3">
          {students.map((std, index) => (
            <div
              key={index}
              className="bg-card border border-white/10 rounded-xl p-4 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-medium">
                  {std.rollNo} • {std.studentName}
                </p>
              </div>
              <button
                className="text-red-400 hover:underline"
                onClick={() => removeStudent(std.uid)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>

  </div>
);

};

export default ClassroomDetail;
