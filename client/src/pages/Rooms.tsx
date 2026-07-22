"use client";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronDownIcon,
  MenuIcon,
  XIcon,
  PlusIcon,
  PencilIcon,
  Share2Icon,
  UserPlusIcon,
  Trash2Icon,
  UsersIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { label: "Launch", route: "/TeacherDashboard" },
  { label: "Library", route: "/Library" },
  { label: "Discover", route: "/Discover" },
  { label: "Rooms", route: "/Rooms" },
  { label: "Reports", route: "/Reports" },
  { label: "Live Results", route: "/LiveResults" },
];

const getInitials = (name?: string) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
};

type Room = {
  id: string;
  name: string;
  isDefault: boolean;
  inMenu: boolean;
};

const Rooms = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const roomName =
    (user as { roomCode?: string })?.roomCode || user?.name || "Your Room";

  const [rooms, setRooms] = useState<Room[]>([
    { id: "default", name: roomName, isDefault: true, inMenu: true },
  ]);

  const handleLogout = () => {
    logout();
    navigate("/Teacherlogin");
  };

  const toggleInMenu = (id: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === id ? { ...room, inMenu: !room.inMenu } : room
      )
    );
  };

  const handleDeleteRoom = (id: string) => {
    setRooms((prev) =>
      prev.filter((room) => room.id !== id || room.isDefault)
    );
  };

  const handleAddRoom = () => {
    // Wire this up to your create-room endpoint once it exists.
    console.log("Add Room clicked");
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
      {/* Navbar */}
      <nav
        className="
          fixed top-0 z-50 w-full
          h-20
          px-4 md:px-16 lg:px-24 xl:px-32
          bg-sky-50 backdrop-blur-lg
          border-b border-sky-100
        "
      >
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between">
          {/* Logo */}
          <Link to="/">
            <img src="/assets/logo.svg" alt="logo" className="h-16.5 w-auto" />
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex gap-8 h-full">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.route)}
                className={`h-full flex items-center text-sm font-semibold border-b-2 transition-colors ${
                  item.label === "Rooms"
                    ? "text-sky-900 border-[#007a8c]"
                    : "text-sky-900/70 border-transparent hover:text-sky-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              className="hidden sm:flex items-center gap-1 bg-white border border-sky-100 rounded-lg px-3 h-9 text-sm font-medium text-sky-900 hover:bg-sky-100 transition"
            >
              {roomName}
              <ChevronDownIcon className="w-4 h-4" />
            </button>

            <div className="relative group">
              <button className="rounded-full size-8 h-8 bg-[#007a8c] text-white font-semibold">
                {getInitials(user?.name)}
              </button>
              <div className="absolute hidden group-hover:block top-8 right-0 pt-4">
                <button
                  onClick={handleLogout}
                  className="bg-[#007a8c] text-white font-semibold hover:bg-[#005f6a] transition px-4 py-2 rounded whitespace-nowrap"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile */}
            <button
              onClick={() => setIsOpen(true)}
              className="md:hidden text-sky-900"
            >
              <MenuIcon />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-[60] bg-white transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <img src="/assets/logo.svg" alt="logo" className="h-8" />
          <XIcon onClick={() => setIsOpen(false)} className="cursor-pointer" />
        </div>

        <div className="flex flex-col gap-6 p-8">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                setIsOpen(false);
                navigate(item.route);
              }}
              className="text-lg font-medium text-sky-900 hover:text-sky-600 text-left"
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => {
              setIsOpen(false);
              handleLogout();
            }}
            className="text-lg font-medium text-sky-900 hover:text-sky-600 text-left"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-4 md:px-16 lg:px-24 xl:px-32 py-8 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
              {/* Header row */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="flex items-center gap-2 h-10 px-5 rounded-full bg-[#007a8c] text-white text-sm font-bold hover:bg-[#0c505a] transition"
                >
                  <PlusIcon className="w-4 h-4" />
                  ADD ROOM
                </button>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[100px_90px_1fr_70px_70px_70px] items-center gap-4 border-b border-gray-200 pb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                <span>In Menu</span>
                <span>Status</span>
                <span>Room Name</span>
                <span className="text-center">Share</span>
                <span className="text-center">Roster</span>
                <span className="text-center">Delete</span>
              </div>

              {/* Rows */}
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="grid grid-cols-[100px_90px_1fr_70px_70px_70px] items-center gap-4 border-b border-gray-100 py-4"
                >
                  <input
                    type="checkbox"
                    checked={room.inMenu}
                    onChange={() => toggleInMenu(room.id)}
                    className="h-4 w-4 rounded border-gray-300 text-[#007a8c] focus:ring-[#007a8c]"
                  />
                  <span className="w-4 h-4 rounded-full border border-gray-300" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">
                        {room.name}
                      </span>
                      <button
                        type="button"
                        className="text-[#007a8c] hover:text-[#005f6a] transition"
                        aria-label="Edit room name"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                    {room.isDefault && (
                      <p className="text-sm text-gray-400">Default Room</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-[#007a8c] transition flex justify-center"
                    aria-label="Share room"
                  >
                    <Share2Icon className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-[#007a8c] transition flex justify-center"
                    aria-label="Manage roster"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                  </button>
                  <div className="relative group flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      disabled={room.isDefault}
                      aria-label={
                        room.isDefault
                          ? "Delete room (not allowed for default room)"
                          : "Delete room"
                      }
                      className="text-gray-400 hover:text-red-500 disabled:hover:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>

                    {room.isDefault && (
                      <div className="pointer-events-none absolute bottom-full right-0 mb-3 w-64 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <div className="bg-white border-2 border-red-500 rounded-lg shadow-lg px-4 py-3 text-left">
                          <p className="flex items-center gap-2 text-red-600 font-bold text-sm">
                            <AlertTriangleIcon className="w-4 h-4 shrink-0" />
                            Not Allowed
                          </p>
                          <p className="text-red-600 text-sm mt-1">
                            The default room cannot be deleted.
                          </p>
                        </div>
                        <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r-2 border-b-2 border-red-500 rotate-45" />
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty-state prompt */}
              <div className="flex flex-col items-center text-center py-16">
                <UsersIcon className="w-16 h-16 text-gray-200 mb-6" strokeWidth={1} />
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Add a Room to Launch More Activities
                </h2>
                <p className="text-gray-500 mb-6">
                  Run multiple activities at once and group your students
                  with rosters.
                </p>
                <button
                  type="button"
                  onClick={handleAddRoom}
                  className="h-10 px-5 rounded-lg bg-sky-50 text-[#007a8c] text-sm font-semibold hover:bg-sky-100 transition"
                >
                  Add Room
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;