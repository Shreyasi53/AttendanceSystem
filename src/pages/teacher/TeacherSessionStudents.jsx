import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function TeacherSessionStudents() {
  const { classCode, sessionId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);

  useEffect(() => {
    const load = async () => {
      const ref = collection(db,
        "attendance",
        classCode,
        "sessions",
        sessionId,
        "students"
      );

      const snap = await getDocs(ref);

      let arr = [];
      snap.forEach(doc => arr.push(doc.data()));

      // Sort by roll number if available
      arr.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

      setStudents(arr);
    };

    load();
  }, []);

  return (
    <div className="p-4 text-white">
      <button onClick={() => navigate(-1)} className="underline mb-3">
        ← Back
      </button>

      <h1 className="text-xl font-semibold mb-4">
        Session: {sessionId}
      </h1>

      {students.length === 0 && (
        <p>No students marked present.</p>
      )}

      <div className="space-y-3">
        {students.map((s, i) => (
          <div
            key={i}
            className="border border-white/10 rounded-lg p-4 bg-card"
          >
            <p className="font-medium">
              {s.rollNo} • {s.name}
            </p>
            <p className="text-sm text-gray-400">
              Time: {new Date(s.time.seconds * 1000).toLocaleTimeString()}
            </p>
            <p className="text-sm text-green-400 font-medium">
              {s.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
