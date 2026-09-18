"use client";

import React, { useState } from "react";
import SideNavbar from "./SideNavbar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("dashboard");

  return (
    <div className="min-h-screen bg-[#0A1238]">

      
      {/* Sidebar */}
      <SideNavbar
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      title="Dashboard"
      />

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isOpen ? "ml-72" : "ml-16"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default MainLayout;