import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import { db } from "../../firebase/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

import * as XLSX from "xlsx";
import { useAlert } from "../../context/AlertContext";

export default function AttendanceHistory() {
  const { classCode } = useParams();
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const refData = collection(db, "attendance", classCode, "sessions");
        const snap = await getDocs(refData);

        let result = [];
        snap.forEach((d) => {
          result.push({
            sessionId: d.id,
            ...d.data(),
          });
        });

        result.sort(
          (a, b) => (b.endedAt?.seconds || 0) - (a.endedAt?.seconds || 0)
        );

        setSessions(result);
      } catch (err) {
        console.log(err);
        showAlert("Failed to load attendance sessions!", "error");
      }
    };

    load();
  }, [classCode]);

  const downloadExcel = async (sessionId) => {
    try {
      showAlert("Preparing Excel file...", "info");

      // 1) All class students
      const classStudentsRef = collection(
        db,
        "classrooms",
        classCode,
        "students"
      );

      const classSnap = await getDocs(classStudentsRef);

      let allStudents = [];
      classSnap.forEach((doc) => {
        allStudents.push(doc.data());
      });

      if (allStudents.length === 0) {
        showAlert("No students found in classroom!", "error");
        return;
      }

      // 2) Present students
      const presentRef = collection(
        db,
        "attendance",
        classCode,
        "sessions",
        sessionId,
        "students"
      );

      const presentSnap = await getDocs(presentRef);

      let presentMap = {};
      presentSnap.forEach((doc) => {
        const data = doc.data();
        presentMap[data.uid] = true;
      });

      // 3) Sort roll no
      allStudents.sort((a, b) => parseInt(a.rollNo) - parseInt(b.rollNo));

      // 4) Format Excel rows
      const formatted = allStudents.map((s, index) => ({
        "S.No": index + 1,
        "Roll No": s.rollNo,
        Name: s.studentName,
        Status: presentMap[s.uid] ? "Present" : "Absent",
      }));

      // 5) Create workbook
      const worksheet = XLSX.utils.json_to_sheet(formatted);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

      // 6) Convert to base64
      const base64Excel = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "base64",
      });

      const fileName = `${sessionId}_attendance.xlsx`;

      // ✅ If inside React Native WebView App
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(
          JSON.stringify({
            type: "downloadExcel",
            fileName: fileName,
            base64: base64Excel,
          })
        );

        showAlert("Downloading Excel file in app...", "success");
        return;
      }

      // ✅ Browser download (Normal Website)
      const fileUrl =
        "data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," +
        base64Excel;

      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showAlert("Attendance Excel downloaded!", "success");
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
