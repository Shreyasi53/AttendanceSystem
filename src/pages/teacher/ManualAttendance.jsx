import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";

const ManualAttendance = ({ classCode, onBack }) => {

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
    const present = Object.keys(selected).filter(uid => selected[uid]);

    const ref = doc(db, "classrooms", classCode, "sessions", sessionId);
    await setDoc(ref, {
      sessionId,
      type: "manual",
      status: "closed",
      present,
      createdAt: serverTimestamp(),
    });

    alert("Attendance Saved!");
    onBack();
  };

  useEffect(() => {
    loadStudents();
  }, []);

  return (
    <div className="bg-card border border-white/10 rounded-2xl p-8">
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
              <span>{std.rollNo} — {std.studentName}</span>
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
        onClick={onBack}
        className="mt-4 ml-3 px-4 py-2 bg-gray-600 rounded-lg hover:bg-gray-700"
      >
        Back
      </button>
    </div>
  );
};

export default ManualAttendance;
