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
import { useAlert } from "../../context/AlertContext";

const ClassroomDetail = () => {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);

  // Fetch class info
  const fetchClassInfo = async () => {
    const classRef = doc(db, "classrooms", classCode);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      showAlert("Classroom not found!");
      return;
    }

    setClassInfo(classSnap.data());
  };

  // Fetch students in class
  const fetchStudents = async () => {
    const studentsRef = collection(db, "classrooms", classCode, "students");
    const snap = await getDocs(studentsRef);

    const studentList = [];
    snap.forEach((doc) => 
      studentList.push({uid: doc.id, ...doc.data()}));

    // Sort by roll number (ascending)
    studentList.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

    setStudents(studentList);
  };

 const removeStudent = (uid) => {
  console.log("REMOVE CLICKED", uid);

  showConfirm("Remove this student?", async () => {
    console.log("CONFIRM ACCEPTED");

    const ref = doc(db, "classrooms", classCode, "students", uid);
    await deleteDoc(ref);

    console.log("DELETED");
    fetchStudents();
    showAlert("Student removed", "success");
  });
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
  <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

      {/* LEFT SIDE */}
      <div className="lg:col-span-1 space-y-6">

        {/* Class Details */}
        <div className="bg-card border border-white/10 rounded-2xl p-6 space-y-2">
          <p>
            <span className="font-semibold">Class:</span>{" "}
            {classInfo.name} ({classInfo.section})
          </p>
          <p>
            <span className="font-semibold">Subject:</span>{" "}
            {classInfo.subject}
          </p>
          <p>
            <span className="font-semibold">Class Code:</span>{" "}
            {classCode}
          </p>
          <p>
            <span className="font-semibold">Total Students:</span>{" "}
            {students.length}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() =>
              navigate(`/teacher/class/${classCode}/attendance`)
            }
            className="btn-primary h-11 px-5 rounded-lg"
          >
            Take Attendance
          </button>

          <button
            onClick={() =>
              navigate(`/teacher/class/${classCode}/history`)
            }
            className="h-11 px-5 rounded-lg border border-white/10 hover:bg-white/5 transition"
          >
            View Attendance
          </button>
        </div>

      </div>

      {/* RIGHT SIDE */}
      <div className="lg:col-span-2 flex flex-col space-y-4">

        <h2 className="text-xl font-semibold">Students List</h2>

        {students.length === 0 ? (
          <p className="text-muted">No students have joined yet.</p>
        ) : (
          <div
            className="
              relative flex flex-col gap-3
              max-h-[520px]
              overflow-y-auto
              no-scrollbar
              mask-fade-bottom
              pb-6
            "
          >
            {students.map((std) => (
              <div
                key={std.uid}
                className="bg-card border border-white/10 rounded-xl p-4 flex justify-between items-center"
              >
                <p className="font-medium text-sm">
                  {std.rollNo} • {std.studentName}
                </p>

                <button
                  className="text-red-400 hover:text-red-500 text-sm"
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
  </div>
)};

export default ClassroomDetail;
