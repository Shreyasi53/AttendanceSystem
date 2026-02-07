import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  const [mode, setMode] = useState("login"); 
  const sliderTransform =
    mode === "login" ? "translateX(0%)" : "translateX(100%)";

  const { showAlert } = useAlert();
  const navigate = useNavigate();

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

  // SIGNUP
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
        formData.password
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

      setMode("login");
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  // LOGIN
  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data();

      showAlert("Login Successful!", "success");

      setTimeout(() => {
        if (userData.role === "teacher") {
          navigate("/teacher/dashboard");
        } else {
          navigate("/student/dashboard");
        }
      }, 800);
    } catch (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-start mt-28 px-4"
      style={{ background: "var(--color-bg)", color: "var(--color-text)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-xl p-8 border-theme"
        style={{ background: "var(--color-bg-card)" }}
      >
        {/* Tabs */}
        <div className="relative flex border-theme rounded-full mb-6 bg-input overflow-hidden">
          {/* LOGIN LEFT */}
          <button
            className={`flex-1 py-3 text-center font-semibold focus:outline-none z-10 transition ${
              mode === "login" ? "text-white" : "text-muted"
            }`}
            onClick={() => setMode("login")}
            aria-pressed={mode === "login"}
          >
            Login
          </button>

          {/* SIGNUP RIGHT */}
          <button
            className={`flex-1 py-3 text-center font-semibold focus:outline-none z-10 transition ${
              mode === "signup" ? "text-white" : "text-muted"
            }`}
            onClick={() => setMode("signup")}
            aria-pressed={mode === "signup"}
          >
            Sign up
          </button>

          {/* Slider */}
          <div
            aria-hidden
            className="absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300"
            style={{
              transform: sliderTransform,
              background: "var(--color-primary)",
            }}
          />
        </div>

        {/* Forms */}
        {mode === "login" ? (
          // LOGIN FORM
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            <div>
              <label className="text-sm text-muted mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg outline-none border-theme text-sm bg-input"
                required
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
                  className="w-full p-3 rounded-lg outline-none border-theme text-sm pr-10 bg-input"
                  required
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold rounded-lg btn-primary"
            >
              Login
            </button>

            {/* Added P tag */}
            <p className="text-sm text-muted text-center">
              Don&apos;t have an account?{" "}
              <span
                className="cursor-pointer font-semibold"
                style={{ color: "var(--color-primary)" }}
                onClick={() => setMode("signup")}
              >
                Sign up now
              </span>
            </p>
          </form>
        ) : (
          // SIGNUP FORM
          <form className="space-y-5" onSubmit={handleSignupSubmit}>
            <div>
              <label className="text-sm text-muted mb-1 block">Name</label>
              <input
                type="text"
                name="name"
                onChange={handleChange}
                placeholder="Enter your name"
                className="w-full p-3 rounded-lg outline-none border-theme text-sm bg-input"
                required
              />
            </div>

            <div>
              <label className="text-sm text-muted mb-1 block">Email</label>
              <input
                type="email"
                name="email"
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full p-3 rounded-lg outline-none border-theme text-sm bg-input"
                required
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
                  className="w-full p-3 rounded-lg outline-none border-theme text-sm pr-10 bg-input"
                  required
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted"
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
                className="w-full p-3 rounded-lg outline-none border-theme text-sm bg-input"
                required
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 font-semibold rounded-lg btn-primary"
            >
              Sign Up
            </button>

            {/* Added P tag */}
            <p className="text-sm text-muted text-center">
              Already have an account?{" "}
              <span
                className="cursor-pointer font-semibold"
                style={{ color: "var(--color-primary)" }}
                onClick={() => setMode("login")}
              >
                Login
              </span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
