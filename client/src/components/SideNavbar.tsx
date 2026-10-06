"use client";

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
  LayoutDashboardIcon,
  LinkedinIcon,
  MailIcon,
  PresentationIcon,
  SettingsIcon,
  LogOutIcon,
  MenuIcon,
} from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";

type Props = {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  activeSection: string;
  setActiveSection: (value: string) => void;
  title: string;
};

const SideNavbar = ({
  isOpen,
  setIsOpen,
  activeSection,
  setActiveSection,
  title,
}: Props) => {
  const navigate = useNavigate();
  const { teacher, logout } = useTeacherAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const menuItems = [
    {
      name: "Dashboard",
      key: "dashboard",
      route: "/Dashboard",
      icon: LayoutDashboardIcon,
    },
    {
      name: "LinkedIn History",
      key: "linkedin-history",
      route: "/LinkedInHistory",
      icon: LinkedinIcon,
    },
    {
      name: "Email History",
      key: "email-history",
      route: "/AcademicEmailHistory",
      icon: MailIcon,
    },
    {
      name: "Slide History",
      key: "slide-history",
      route: "/SlideHistory",
      icon: PresentationIcon,
    },
  ];

  const initials = (teacher?.name || "T")
    .split(" ")
    .map((word: string) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // On mobile the open sidebar is a drawer: close it with Escape and
  // stop the page behind it from scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);

    const previousOverflow = document.body.style.overflow;
    if (isMobile) document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, setIsOpen]);

  const handleNavigation = (key: string, route: string) => {
    setActiveSection(key);
    setIsOpen(false);
    navigate(route);
  };

  const handleLogoClick = () => {
    // Route the logo to the teacher's own dashboard, not the public "/"
    // root — navigating to "/" was landing on a different app entry point
    // that reset the teacher auth state, which looked like an unintended logout.
    setActiveSection("dashboard");
    setIsOpen(false);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    setIsOpen(false);

    await logout();
    navigate("/");
  };

  return (
    <>
      {/* --------------------------------------------------
          MOBILE: menu button (shown only when drawer is closed)
         -------------------------------------------------- */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="md:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-lg bg-sky-50 text-sky-900 border border-sky-200 shadow-md flex items-center justify-center active:bg-[#151d4b] active:text-white transition-colors"
          aria-label="Open menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
      )}

      {/* --------------------------------------------------
          MOBILE: backdrop behind the open drawer
         -------------------------------------------------- */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* --------------------------------------------------
          DESKTOP: collapsed icon rail (hidden on mobile)
         -------------------------------------------------- */}
      {!isOpen && (
        <div className="hidden md:flex fixed top-0 left-0 h-dvh w-16 bg-sky-50 text-sky-900 border-r border-sky-200 flex-col items-center py-4 z-50">
          {/* Expand Button */}
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hover:bg-[#151d4b] hover:text-white rounded-lg p-1.5 mb-6 transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpenIcon className="w-5 h-5" />
          </button>

          {/* Mini Navigation */}
          <div className="flex flex-col items-center gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setActiveSection(item.key);
                    navigate(item.route);
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    activeSection === item.key
                      ? "bg-[#151d4b] text-white"
                      : "hover:bg-[#151d4b] hover:text-white"
                  }`}
                  aria-label={item.name}
                  title={item.name}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* --------------------------------------------------
          EXPANDED SIDEBAR
          Mobile: slide-over drawer. Desktop: fixed sidebar.
          Always rendered so the mobile slide animation can play;
          on desktop it is removed while collapsed (md:hidden).
         -------------------------------------------------- */}
      <aside
        aria-hidden={!isOpen}
        className={`fixed top-0 left-0 h-dvh w-72 max-w-[85vw] bg-sky-50 text-sky-900 border-r border-sky-200 flex flex-col z-50 shadow-2xl md:shadow-none
          transition-[transform,visibility] duration-300 ease-out
          ${isOpen ? "translate-x-0 visible" : "-translate-x-full invisible md:hidden"}`}
      >
        {/* Header / Logo */}
        <div className="flex items-center justify-between px-4 py-4">
          <Link
            to="/Dashboard"
            onClick={handleLogoClick}
            className="flex items-center"
          >
            <img
              src="/assets/logo.svg"
              alt="logo"
              className="h-8 w-auto cursor-pointer"
            />
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white rounded-lg p-2 md:p-1.5 transition-colors"
            aria-label="Collapse sidebar"
          >
            <PanelLeftCloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Current Page */}
        <div className="px-4 mb-5">
          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              {title}
            </p>
          </div>
        </div>

        {/* Navigation (scrolls on very short screens, e.g. landscape phones) */}
        <nav className="px-3 flex flex-col gap-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavigation(item.key, item.route)}
                className={`w-full flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-lg text-sm font-medium text-left transition-colors ${
                  activeSection === item.key
                    ? "bg-[#151d4b] text-white"
                    : "hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />

                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Profile Section */}
        <div className="relative border-t border-sky-200 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setShowProfileMenu((value) => !value)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-[#151d4b] hover:text-white active:bg-[#151d4b] active:text-white transition-colors text-left group"
          >
            {/* Avatar */}
            <span className="w-8 h-8 rounded-full bg-[#151d4b]/10 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-white/20 group-hover:text-white">
              {initials}
            </span>

            {/* Teacher Information */}
            <span className="min-w-0 flex-1">
              <span className="block text-sm truncate group-hover:text-white">
                {teacher?.name || "Teacher"}
              </span>

              <span className="block text-xs truncate text-sky-700 group-hover:text-white/70">
                {teacher?.email || ""}
              </span>
            </span>
          </button>

          {/* Profile Menu */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-3 right-3 mb-2 z-50 bg-white border border-sky-200 rounded-lg shadow-2xl py-1 text-sky-900">
              {/* Settings */}
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setActiveSection("settings");
                  setIsOpen(false);
                  navigate("/Settings");
                }}
                className="w-full flex items-center gap-2 px-3 py-3 md:py-2 text-sm hover:bg-[#151d4b] hover:text-white text-left transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Settings</span>
              </button>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-3 md:py-2 text-sm text-red-600 hover:bg-[#151d4b] hover:text-white text-left transition-colors"
              >
                <LogOutIcon className="w-4 h-4" />
                <span>Log out</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default SideNavbar;
