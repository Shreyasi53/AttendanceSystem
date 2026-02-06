import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAlert } from "../../context/AlertContext";

export default function AttendanceHistory() {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      const ref = collection(db, "attendance", classCode, "sessions");
      const snap = await getDocs(ref);

      let result = [];
      snap.forEach((d) => {
        result.push({
          sessionId: d.id,
          ...d.data(),
        });
      });

      // sort by time (latest first)
      result.sort((a, b) => (b.endedAt?.seconds || 0) - (a.endedAt?.seconds || 0));

      setSessions(result);
    };

    load();
  }, []);

  // Download Excel for one session
  const downloadExcel = async (sessionId) => {
    try {
      const studentsRef = collection(
        db,
        "attendance",
        classCode,
        "sessions",
        sessionId,
        "students"
      );

      const snap = await getDocs(studentsRef);

      let students = [];
      snap.forEach((doc) => students.push(doc.data()));

      if (students.length === 0) {
        showAlert("No students found in this session!", "info");
        return;
      }

      // sort by roll no
      students.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

      const formatted = students.map((s, index) => ({
        "S.No": index + 1,
        "Roll No": s.rollNo,
        Name: s.name,
        Status: s.status,
      }));

      const worksheet = XLSX.utils.json_to_sheet(formatted);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      saveAs(fileData, `${sessionId}_attendance.xlsx`);

      showAlert("Excel downloaded successfully!", "success");
    } catch (err) {
      console.log(err);
      showAlert("Failed to download excel!", "error");
    }
  };

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 bg-input rounded-lg border-theme hover:opacity-90 transition cursor-pointer"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <h1 className="text-xl text-center font-semibold mt-4 mb-6">
        Attendance Sessions
      </h1>

      {sessions.length === 0 && (
        <p className="text-muted text-center">No attendance records found.</p>
      )}

      {/* Session Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {sessions.map((s, i) => (
          <div
            key={i}
            className="bg-card border-theme rounded-xl p-4 flex justify-between items-center cursor-pointer hover:opacity-90 transition shadow-sm"
            onClick={() =>
              navigate(`/teacher/class/${classCode}/history/${s.sessionId}`)
            }
          >
            <div>
              <p className="font-semibold">{s.sessionId}</p>

              {s.endedAt && (
                <p className="text-sm text-muted mt-1">
                  {new Date(s.endedAt.seconds * 1000).toLocaleString()}
                </p>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadExcel(s.sessionId);
              }}
              className="p-2 rounded-lg hover:bg-input transition cursor-pointer"
            >
              <Download size={20} className="text-muted" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
