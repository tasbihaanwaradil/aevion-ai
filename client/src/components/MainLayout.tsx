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

      {/* Main Content
          - Mobile: full width. The sidebar is an overlay drawer, so no left
            margin; pt-16 leaves room for the floating menu button.
          - md and up: shift right to make room for the sidebar/rail.
          - min-w-0 stops wide children from stretching the page sideways. */}
      <div
        className={`min-w-0 pt-16 md:pt-0 transition-[margin] duration-300 ${
          isOpen ? "md:ml-72" : "md:ml-16"
        }`}
      >
        {children}
      </div>
    </div>
  );
};

export default MainLayout;
