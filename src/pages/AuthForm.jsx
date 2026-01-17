import React, { useState } from "react";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);

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

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    console.log("Signup data:", formData);
  };

 const handleLoginSubmit = (e) => {
  e.preventDefault();

  const savedRole = localStorage.getItem("role");

  if (savedRole === "teacher") {
    window.location.href = "/teacher/dashboard";
  } else {
    window.location.href = "/student/dashboard";
  }
};


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 px-4">
      <div className="w-full max-w-md bg-gray-800 text-white rounded-2xl shadow-xl p-8">
        {/* Tabs */}
        <div className="flex justify-between mb-8">
          <button
            className={`w-1/2 py-2 rounded-lg transition-all ${
              isLogin ? "bg-white text-gray-900 font-semibold" : "text-gray-300"
            }`}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>

          <button
            className={`w-1/2 py-2 rounded-lg transition-all ${
              !isLogin
                ? "bg-white text-gray-900 font-semibold"
                : "text-gray-300"
            }`}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
        </div>

        {/* FORMS */}
        {isLogin ? (
          <form className="space-y-5" onSubmit={handleLoginSubmit}>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="w-full p-3 rounded-lg bg-gray-700 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Enter your email"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full p-3 rounded-lg bg-gray-700 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Enter your password"
                onChange={handleChange}
              />
            </div>
            <a href="#">Forget Password?</a>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 rounded-lg font-semibold mt-2 hover:bg-green-700 transition-all"
            >
              Login
            </button>
            <p>
              {" "}
              Not a Member?{" "}
              <a href="#" onClick={() => setIsLogin(false)}>
                {" "}
                Signup now{" "}
              </a>{" "}
            </p>
          </form>
        ) : (
          <form className="space-y-5" onSubmit={handleSignupSubmit}>
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input
                type="text"
                name="name"
                className="w-full p-3 rounded-lg bg-gray-700 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Enter your name"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Email</label>
              <input
                type="email"
                name="email"
                className="w-full p-3 rounded-lg bg-gray-700 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Enter your email"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                className="w-full p-3 rounded-lg bg-gray-700 outline-none border border-gray-600 focus:border-blue-500"
                placeholder="Create a password"
                onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Role</label>
              <select
                name="role"
                className="w-full p-3 rounded-lg bg-gray-700 outline-none border border-gray-600 text-gray-300 focus:border-blue-500"
                onChange={handleChange}
              >
                <option value="">Select role</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-green-600 rounded-lg font-semibold mt-2 hover:bg-green-700 transition-all"
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
