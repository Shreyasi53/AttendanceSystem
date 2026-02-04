import React, { useState } from "react";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Eye, EyeOff } from "lucide-react";
import { useAlert } from "../context/AlertContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

const AuthForm = () => {
  const { showAlert } = useAlert();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();

    if (!formData.role) {
      showAlert("Please select a role", "error");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const user = userCredential.user;
      await updateProfile(user, {
        displayName: formData.name,
      });

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        uid: user.uid,
      });

      showAlert("Signup Successful!", "success");
      await auth.currentUser.reload();
      setIsLogin(true);
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );

      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      if (userData.role === "teacher") {
        window.location.href = "/teacher/dashboard";
      } else {
        window.location.href = "/student/dashboard";
      }
    } catch (error) {
      showAlert(error.message);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 border border-white/10"
        style={{ background: "var(--color-bg-card)" }}
      >
        <div
          className="flex mb-8 rounded-lg overflow-hidden gap-2"
          style={{ background: "var(--color-bg-input)" }}
        >
          <button
            className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
              isLogin ? "text-black" : "text-muted"
            }`}
            style={isLogin ? { background: "white" } : {}}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>

          <button
            className={`flex-1 py-2 text-sm font-semibold transition-all rounded-lg ${
              !isLogin ? "text-black" : "text-muted"
            }`}
            style={!isLogin ? { background: "white" } : {}}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* Forms */}
        {isLogin ? (
          // LOGIN FORM
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            <div>
              <label className="text-sm text-muted mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg outline-none border text-sm"
                style={{
                  background: "var(--color-bg-input)",
                  borderColor: "var(--color-text-muted)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full p-3 rounded-lg outline-none border text-sm pr-10"
                  style={{
                    background: "var(--color-bg-input)",
                    borderColor: "var(--color-text-muted)",
                    color: "var(--color-text)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "var(--color-text-muted)" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold rounded-lg btn-success"
              style={{ background: "var(--color-success)" }}
            >
              Login
            </button>

            <p className="text-sm mt-3 text-muted">
              Not a Member?{" "}
              <span
                className="underline cursor-pointer"
                style={{ color: "var(--color-primary)" }}
                onClick={() => setIsLogin(false)}
              >
                Signup now
              </span>
            </p>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleSignupSubmit}>
            <div>
              <label className="text-sm text-muted mb-1 block">Name</label>
              <input
                type="text"
                name="name"
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full p-3 rounded-lg outline-none border text-sm"
                style={{
                  background: "var(--color-bg-input)",
                  borderColor: "var(--color-text-muted)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg outline-none border text-sm"
                style={{
                  background: "var(--color-bg-input)",
                  borderColor: "var(--color-text-muted)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  onChange={handleChange}
                  placeholder="Create a password"
                  className="w-full p-3 rounded-lg outline-none border text-sm pr-10"
                  style={{
                    background: "var(--color-bg-input)",
                    borderColor: "var(--color-text-muted)",
                    color: "var(--color-text)",
                  }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ color: "var(--color-text-muted)" }}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Role</label>
              <select
                name="role"
                onChange={handleChange}
                className="w-full p-3 rounded-lg outline-none border text-sm"
                style={{
                  background: "var(--color-bg-input)",
                  borderColor: "var(--color-text-muted)",
                  color: "var(--color-text)",
                }}
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold rounded-lg btn-success"
              style={{ background: "var(--color-success)" }}
            >
              Sign Up
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
