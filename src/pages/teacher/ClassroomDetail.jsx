import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useAlert } from "../../context/AlertContext";

const ClassroomDetail = () => {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();

  const [classInfo, setClassInfo] = useState(null);
  const [students, setStudents] = useState([]);
  const [showAttendancePopup, setShowAttendancePopup] = useState(false);

  // Fetch class info
  const fetchClassInfo = async () => {
    const classRef = doc(db, "classrooms", classCode);
    const classSnap = await getDoc(classRef);

    if (!classSnap.exists()) {
      showAlert("Classroom not found!", "error");
      return;
    }

    setClassInfo(classSnap.data());
  };

  // Fetch students in class
  const fetchStudents = async () => {
    const studentsRef = collection(db, "classrooms", classCode, "students");
    const snap = await getDocs(studentsRef);

    const studentList = [];
    snap.forEach((doc) => studentList.push({ uid: doc.id, ...doc.data() }));

    // Sort by roll number (ascending)
    studentList.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

    setStudents(studentList);
  };

  // Remove student
  const removeStudent = (uid) => {
    showConfirm(
      "Are you sure you want to remove this student?",
      async () => {
        const ref = doc(db, "classrooms", classCode, "students", uid);
        await deleteDoc(ref);

        fetchStudents();
        showAlert("Student removed from class.", "success");
      },
      "Remove"
    );
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

  // Loading UI
  if (!classInfo) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
      >
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
          <div className="bg-card border-theme rounded-2xl p-6 space-y-2 shadow-sm">
            <p>
              <span className="font-semibold">Class:</span> {classInfo.name} (
              {classInfo.section})
            </p>

            <p>
              <span className="font-semibold">Subject:</span> {classInfo.subject}
            </p>

            <p>
              <span className="font-semibold">Class Code:</span> {classCode}
            </p>

            <p>
              <span className="font-semibold">Total Students:</span>{" "}
              {students.length}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowAttendancePopup(true)}
              className="btn-primary h-11 px-5 rounded-lg cursor-pointer"
            >
              Take Attendance
            </button>

            <button
              onClick={() => navigate(`/teacher/class/${classCode}/history`)}
              className="h-11 px-5 rounded-lg bg-card border-theme hover:opacity-80 transition cursor-pointer"
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
            <div className="relative flex flex-col gap-3 max-h-[520px] overflow-y-auto no-scrollbar mask-fade-bottom pb-6">
              {students.map((std) => (
                <div
                  key={std.uid}
                  className="bg-card border-theme rounded-xl p-4 flex justify-between items-center"
                >
                  <p className="font-medium text-sm">
                    {std.rollNo} • {std.studentName}
                  </p>

                  <button
                    className="text-red-500 hover:opacity-70 text-sm transition cursor-pointer"
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

      {/* POPUP MODAL */}
      {showAttendancePopup && (
        <div
          className="fixed inset-0 modal-overlay flex items-center justify-center z-50 px-4"
          onClick={() => setShowAttendancePopup(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border-theme rounded-2xl p-6 w-full max-w-sm shadow-lg space-y-4"
          >
            <h2 className="text-lg font-semibold text-center">
              Choose Attendance Mode
            </h2>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowAttendancePopup(false);
                  navigate(`/teacher/class/${classCode}/manual`);
                }}
                className="bg-input border-theme px-4 py-2 rounded-lg hover:opacity-80 transition cursor-pointer"
              >
                Manual Attendance
              </button>

              <button
                onClick={() => {
                  setShowAttendancePopup(false);
                  navigate(`/teacher/class/${classCode}/attendance`);
                }}
                className="btn-primary px-4 py-2 rounded-lg font-medium hover:brightness-90 transition cursor-pointer"
              >
                QR Attendance
              </button>
            </div>

            <button
              onClick={() => setShowAttendancePopup(false)}
              className="px-4 py-2 rounded-lg w-full bg-input border-theme text-sm text-muted hover:opacity-70 transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassroomDetail;
