"use client";

import React, { useState } from "react";
import SideNavbar from "../components/SideNavbar";
import { Plus } from "lucide-react";

const TimetableReminder: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("tools");

  return (
    <div className="min-h-screen bg-[#0A1238]">

      {/* Sidebar */}
      <SideNavbar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        title="AI Tools"
      />

      {/* Main Content */}
      <div
        className={`px-6 pt-28 pb-16 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >

        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white">
            Reminder
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your tasks and deadlines easily
          </p>
        </div>

        {/* Input Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 shadow-2xl text-gray-800">

          {/* Task Title */}
          <label className="block font-semibold mb-2">
            Task Title
          </label>
          <input
            type="text"
            placeholder="Task title..."
            className="w-full mb-4 px-4 py-3 rounded-xl bg-gray-100 border border-[#2d5f6e] outline-none focus:ring-2 focus:ring-[#2d5f6e] focus:border-[#2d5f6e]"
          />

          {/* Description */}
          <label className="block font-semibold mb-2">
            Description
          </label>
          <textarea
            placeholder="Description (optional)"
            className="w-full mb-4 px-4 py-3 rounded-xl bg-gray-100 border border-[#2d5f6e] outline-none focus:ring-2 focus:ring-[#2d5f6e] focus:border-[#2d5f6e]"
          />

          {/* Grid for Date & Priority */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">

            {/* Due Date */}
            <div>
              <label className="block font-semibold mb-2">
                Due Date & Time
              </label>
              <input
              /*Date time set to local*/
                type="datetime-local"
                className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-[#2d5f6e] outline-none focus:ring-2 focus:ring-[#2d5f6e] focus:border-[#2d5f6e]"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block font-semibold mb-2">
                Priority
              </label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-100 border border-[#2d5f6e] outline-none focus:ring-2 focus:ring-[#2d5f6e] focus:border-[#2d5f6e]">
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </div>

          </div>

          {/* Button */}
          <button
            className="w-full bg-[#2d5f6e] text-white py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-[#244d5a] transition"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>

        </div>

      </div>
    </div>
  );
};

export default TimetableReminder;