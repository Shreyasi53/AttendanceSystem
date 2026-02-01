import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

export default function AttendanceHistory() {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const ref = collection(db, "attendance", classCode, "sessions");
      const snap = await getDocs(ref);

      let result = [];
      snap.forEach((d) => {
        result.push({
          sessionId: d.id,
          ...d.data()
        });
      });

      // sort by time (latest first)
      result.sort((a, b) => b.endedAt?.seconds - a.endedAt?.seconds);

      setSessions(result);
    };

    load();
  }, []);

  return (
    <div className="p-4 text-white">
      <button onClick={() => navigate(-1)} className="underline mb-3">
        ← Back
      </button>

      <h1 className="text-xl font-semibold mb-4">Attendance Sessions</h1>

      {sessions.length === 0 && <p>No attendance records found.</p>}

      <div className="space-y-3">
        {sessions.map((s, i) => (
          <div
            key={i}
            className="border border-white/10 rounded-lg p-4 bg-card cursor-pointer"
            onClick={() =>
              navigate(`/teacher/class/${classCode}/history/${s.sessionId}`)
            }
          >
            <p className="font-semibold">{s.sessionId}</p>
            {s.endedAt && (
              <p className="text-sm text-gray-400">
                {new Date(s.endedAt.seconds * 1000).toLocaleString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
