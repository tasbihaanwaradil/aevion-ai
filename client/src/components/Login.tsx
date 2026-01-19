"use client";

import React, { useState } from "react";

const Login = () => {
  const [state, setState] = useState<"login" | "register">("login");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    /* FIX: Added pt-20 (padding-top) to push the card below your Navbar 
       and changed items-center to flex-col with a top margin if needed.
    */
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#072146] px-4 pt-24 pb-12">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-2xl px-10 py-16 shadow-2xl relative z-10"
      >
        {/* Main Heading - Darker Teal */}
        <h1 className="text-4xl text-[#2d5f6e] font-bold text-center mb-2">
          {state === "login" ? "Login" : "Sign Up"}
        </h1>

        {/* Sub text - Lighter gray */}
        <p className="text-gray-400 text-sm text-center mb-10">
          {state === "login"
            ? "Please login to continue"
            : "Create your account to get started"}
        </p>

        <div className="space-y-5">
          {state === "register" && (
            <div className="bg-gray-100 rounded-xl">
              <input
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none border-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
                required
              />
            </div>
          )}

          <div className="bg-gray-100 rounded-xl">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none border-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>

          <div className="bg-gray-100 rounded-xl">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none border-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl"
              required
            />
          </div>
        </div>

        {/* Login Button - Matches image teal and shadow */}
        <button
          type="submit"
          className="mt-12 w-full h-14 rounded-2xl bg-[#2d5f6e] text-white font-bold text-xl hover:bg-[#244d5a] transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.5)]"
        >
          {state === "login" ? "Login" : "Sign Up"}
        </button>

        {/* Bottom Switcher */}
        <p className="mt-10 text-center text-sm text-gray-500">
          {state === "login" ? "Don't have an account?" : "Already have an account?"}
          <span 
            onClick={() => setState(state === "login" ? "register" : "login")}
            className="ml-1 font-bold text-[#2d5f6e] hover:underline cursor-pointer"
          >
            Click here
          </span>
        </p>
      </form>
    </div>
  );
};

export default Login;