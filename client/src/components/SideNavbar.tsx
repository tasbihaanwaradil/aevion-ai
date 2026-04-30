"use client";

import React from "react";
import { useNavigate, Link } from "react-router-dom";

type Props = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  activeSection: string;
  setActiveSection: (value: string) => void;
  title: string; // dynamic title
};

const SideNavbar = ({
  isOpen,
  setIsOpen,
  activeSection,
  setActiveSection,
  title,
}: Props) => {
  const navigate = useNavigate();

  const menuItems = [
    { name: "Dashboard", key: "dashboard" },
    { name: "AI Tools", key: "tools" },
    { name: "History", key: "history" },
    { name: "Settings", key: "settings" },
  ];

  return (
    <>
      {/* Sidebar*/}
      <div
        className={`fixed top-0 left-0 h-full bg-sky-50 text-sky-900 transition-all duration-300 z-50 ${
          isOpen ? "w-64" : "w-0"
        } overflow-hidden`}
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-3xl"
        >
          ×
        </button>

        {/* Logo */}
        <div className="mt-12 px-6 mb-8">
          <Link to="/">
            <img
              src="/assets/logo.svg"
              alt="logo"
              className="h-12 w-auto cursor-pointer"
            />
          </Link>
        </div>

        {/* Menu */}
        <nav className="flex flex-col gap-4 px-6 text-sm">
          {menuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                setActiveSection(item.key);
                setIsOpen(false);

                if (item.key === "dashboard") navigate("/dashboard");
                if (item.key === "tools") navigate("/dashboard");
                if (item.key === "history") navigate("/history");
                if (item.key === "settings") navigate("/settings");
              }}
              className={`text-left px-3 py-2 rounded-lg transition ${
                activeSection === item.key
                  ? "bg-[#151d4b] text-white"
                  : "hover:bg-[#111a4d] hover:text-white"
              }`}
            >
              {item.name}
            </button>
          ))}

          {/* Sign Out */}
          <button
            className="text-left text-red-600 mt-6 hover:text-red-800"
            onClick={() => navigate("/")}
          >
            Sign Out
          </button>
        </nav>
      </div>

      {/* Topbar */}
      <div
        className={`p-4 flex items-center gap-3 bg-sky-50 shadow-sm text-sky-900 transition-all duration-300 ${
          isOpen ? "ml-64" : "ml-0"
        }`}
      >
        <span
          className="text-3xl cursor-pointer font-bold"
          onClick={() => setIsOpen(true)}
        >
          ☰
        </span>

        {/*Dynamic Title */}
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
    </>
  );
};

export default SideNavbar;