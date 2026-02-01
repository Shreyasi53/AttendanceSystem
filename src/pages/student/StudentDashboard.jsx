import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import { doc, getDoc, setDoc, getDocs, collection } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Camera } from "lucide-react";

const StudentDashboard = () => {
  const [classCode, setClassCode] = useState("");
  const [classExists, setClassExists] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [rollNo, setRollNo] = useState("");
  const [joinedClasses, setJoinedClasses] = useState([]);
  const navigate = useNavigate();

  // Check if class exists
  const checkClassroom = async () => {
    const classRef = doc(db, "classrooms", classCode.toUpperCase());
    const docSnap = await getDoc(classRef);

    if (!docSnap.exists()) {
      alert("Invalid class code!");
      setClassExists(false);
    } else {
      setClassExists(true);
    }
  };

  //  Join classroom
  const joinClassroom = async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (!user) return alert("Not logged in!");

    const classId = classCode.toUpperCase();
    const studentRef = doc(db, "classrooms", classId, "students", user.uid);

    await setDoc(studentRef, {
      studentName,
      rollNo,
      uid: user.uid,
      joinedAt: new Date(),
    });

    alert("Joined Classroom Successfully!");

    // reset UI
    setClassExists(false);
    setClassCode("");
    setStudentName("");
    setRollNo("");

    fetchJoinedClasses(user.uid);
  };

  // Fetch classrooms student has joined
  const fetchJoinedClasses = async (uid) => {
    const classroomsRef = collection(db, "classrooms");
    const snapshot = await getDocs(classroomsRef);

    const classes = [];

    for (const classDoc of snapshot.docs) {
      const studentRef = doc(db, "classrooms", classDoc.id, "students", uid);
      const studentSnap = await getDoc(studentRef);

      if (studentSnap.exists()) {
        classes.push({ ...classDoc.data(), classCode: classDoc.id });
      }
    }

    setJoinedClasses(classes);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchJoinedClasses(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      {!classExists && (
        <div className="p-6 rounded-xl bg-card border border-white/10 shadow-lg shadow-black/30 backdrop-blur-sm space-y-4">
          <h2 className="text-xl font-semibold">Join a Classroom</h2>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={classCode}
              onChange={(e) => setClassCode(e.target.value)}
              placeholder="Enter class code"
              className="
      w-full
      sm:flex-1
      h-12
      px-4
      bg-input/90
      text-[var(--color-text)]
      border
      border-white/10
      rounded-lg
      shadow-inner
      placeholder-[var(--color-text-muted)]
      focus:border-[var(--color-primary)]
      focus:ring-1
      focus:ring-[var(--color-primary)]/40
      outline-none
    "
            />

            <button
              onClick={checkClassroom}
              className="
      w-full
      sm:w-auto
      px-5
      h-12
      rounded-lg
      bg-[var(--color-primary)]
      text-white
      font-medium
      transition-colors
      sm:hover:opacity-80
      active:scale-95
    "
            >
              Check
            </button>
          </div>
        </div>
      )}

      {classExists && (
        <div className="p-6 rounded-xl bg-card border border-white/10 shadow-lg shadow-black/30 backdrop-blur-sm space-y-4">
          <h2 className="text-xl font-semibold">Your Information</h2>

          <form onSubmit={joinClassroom} className="space-y-4">
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Your Name"
              className="w-full h-12 px-4 bg-input/90 border border-white/10 rounded-lg shadow-inner placeholder-(--color-text-muted) focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)/40 outline-none"
              required
            />
            <input
              value={rollNo}
              onChange={(e) => setRollNo(e.target.value)}
              placeholder="Roll Number"
              className="w-full h-12 px-4 bg-input/90 border border-white/10 rounded-lg shadow-inner placeholder-(--color-text-muted) focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)/40 outline-none"
              required
            />

            <button
              type="submit"
              className="w-full h-12 rounded-lg bg-(--color-primary) hover:bg-(--color-primary)/80 text-white font-medium transition-colors"
            >
              Join Classroom
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">My Classrooms</h2>

        {joinedClasses.length === 0 ? (
          <p className="text-muted text-sm">
            You haven't joined any classrooms yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinedClasses.map((cls, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-card border border-white/10 shadow-lg shadow-black/30 backdrop-blur-sm hover:-translate-y-1 hover:shadow-xl transition cursor-pointer"
              >
                <h3 className="text-lg font-medium">{cls.name}</h3>
                <p className="text-muted text-sm">{cls.section}</p>
                <p className="text-muted text-xs mt-2">{cls.subject}</p>
              </div>
            ))}
            <button
              onClick={() => navigate("/student/scan")}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 rounded-full bg-card border border-white/10 shadow-lg flex items-center justify-center hover:brightness-110 transition"
            >
              <Camera className="w-9 h-9 text-white" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
