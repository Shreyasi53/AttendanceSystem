import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useAlert } from "../../context/AlertContext";

const ManualAttendance = () => {
  const navigate = useNavigate();
  const { classCode } = useParams();
  const { showAlert } = useAlert();
  const [students, setStudents] = useState([]);
  const [selected, setSelected] = useState({});

  const generateSessionId = () =>
    "SESSION_" + Math.random().toString(36).substring(2, 10).toUpperCase();

  const loadStudents = async () => {
    const ref = collection(db, "classrooms", classCode, "students");
    const snap = await getDocs(ref);

    const list = [];
    snap.forEach((doc) => list.push(doc.data()));

    list.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));
    setStudents(list);
  };

  const saveManualAttendance = async () => {
    const sessionId = generateSessionId();

    const historySessionRef = doc(
      db,
      "attendance",
      classCode,
      "sessions",
      sessionId,
    );

    // create session metadata
    await setDoc(historySessionRef, {
      sessionId,
      type: "manual",
      endedAt: serverTimestamp(),
    });

    const studentsColRef = collection(historySessionRef, "students");

    // save only present students
    for (const std of students) {
      if (selected[std.uid]) {
        await setDoc(doc(studentsColRef, std.uid), {
          uid: std.uid,
          name: std.studentName,
          rollNo: std.rollNo,
          time: serverTimestamp(),
          status: "present",
        });
      }
    }

    showAlert("Manual attendance saved!", "success");
    navigate(-1);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="bg-card border-theme rounded-2xl p-8">
      <h2 className="text-xl font-semibold mb-3">Manual Attendance</h2>

      {students.length === 0 ? (
        <p>No students found.</p>
      ) : (
        <ul className="space-y-2">
          {students.map((std) => (
            <li key={std.uid} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={!!selected[std.uid]}
                onChange={() =>
                  setSelected({ ...selected, [std.uid]: !selected[std.uid] })
                }
              />
              <span>
                {std.rollNo} — {std.studentName}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={saveManualAttendance}
        className="btn-primary px-4 py-2 rounded-lg hover:brightness-75"
      >
        Save Attendance
      </button>

      <button
        onClick={() => navigate(-1)}
        className="mt-4 ml-3 px-4 py-2 rounded-lg border-theme bg-input hover:brightness-90 transition"
      >
        Back
      </button>
    </div>
  );
};

export default ManualAttendance;
