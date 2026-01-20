import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVUyl1xjfo3xuFSN_qizs6NCYuXjjmXio",
  authDomain: "attendance-app-72c87.firebaseapp.com",
  projectId: "attendance-app-72c87",
  storageBucket: "attendance-app-72c87.firebasestorage.app",
  messagingSenderId: "81403370854",
  appId: "1:81403370854:web:177cb02759e0c3b93c3ca7",
  measurementId: "G-K5MSR8ZJRT"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);