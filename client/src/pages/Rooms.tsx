
"use client";

import { useState } from "react";
import { PencilIcon } from "lucide-react";
import { useTeacherAuth } from "../context/TeacherAuthContext";
import TeacherNavbar from "../components/TeacherNavabar";

type Room = {
  id: string;
  name: string;
  isDefault: boolean;
  inMenu: boolean;
};

const Rooms = () => {
  const { teacher } = useTeacherAuth();

  const roomName =
    (teacher as { roomCode?: string })?.roomCode || teacher?.name || "Your Room";

  // Every teacher has a single default room. Rooms can't be added or deleted.
  const [rooms, setRooms] = useState<Room[]>([
    { id: "default", name: roomName, isDefault: true, inMenu: true },
  ]);

  const toggleInMenu = (id: string) => {
    setRooms((prev) =>
      prev.map((room) =>
        room.id === id ? { ...room, inMenu: !room.inMenu } : room
      )
    );
  };

  return (
    <div className="h-screen overflow-hidden bg-[#0A1238]">
      <TeacherNavbar />

      {/* Body */}
      <div className="pt-20 h-screen">
        <div className="h-[calc(100vh-5rem)] px-4 md:px-16 lg:px-24 xl:px-32 py-8 flex items-center justify-center">
          <div className="w-full max-w-7xl h-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-8 py-8">
              {/* Header row */}
              <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
              </div>

              {/* Table header */}
              <div className="grid grid-cols-[100px_90px_1fr] items-center gap-4 border-b border-gray-200 pb-3 text-xs font-semibold tracking-wide text-gray-400 uppercase">
                <span>In Menu</span>
                <span>Status</span>
                <span>Room Name</span>
              </div>

              {/* Rows */}
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="grid grid-cols-[100px_90px_1fr] items-center gap-4 border-b border-gray-100 py-4"
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rooms;