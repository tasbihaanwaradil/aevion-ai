"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../configs/api";
import toast from "react-hot-toast";
import SideNavbar from "../components/SideNavbar";

const Settings: React.FC = () => {
  const { user, setUser } = useAuth();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // Sidebar state
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("settings");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
    }
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.put("/api/user/update", { name });

      setUser(data.user);
      toast.success(data.message || "Profile updated successfully");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1238]">

      {/* Sidebar */}
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="Settings"
      />

      {/* Main Content */}
      <div
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >

        {/* Card */}
        <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-2xl p-10">

          <h1 className="text-3xl font-bold text-[#2d5f6e] text-center mb-2">
            Profile Information
          </h1>

          <p className="text-gray-400 text-center mb-8">
            Update your personal information
          </p>

          <form onSubmit={handleUpdate} className="space-y-5">

            {/* Email */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-[#2d5f6e] text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-gray-700 bg-gray-100 border border-[#2d5f6e] outline-none focus:ring-2 focus:ring-[#2d5f6e]"
                required
              />
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2d5f6e] text-white py-3 rounded-xl font-bold hover:bg-[#244d5a] transition"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>

          </form>
        </div>

      </div>
    </div>
  );
};

export default Settings;


