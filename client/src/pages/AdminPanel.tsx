"use client";
import React, { useEffect, useRef, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  isActive: boolean;
  lastActive?: string;
  createdAt: string;
}

interface EditForm {
  name: string;
  email: string;
  isActive: boolean;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    isActive: true,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = async (query = "") => {
    setLoading(true);
    setError("");
    try {
      const qs = query ? `?search=${encodeURIComponent(query)}` : "";
      const res = await fetch(`http://localhost:3000/api/admin/users${qs}`, {
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setUsers(data.users);
      setTotalUsers(data.totalUsers);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (val: string) => {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 400);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-PK", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const formatLastActive = (iso?: string) => {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return formatDate(iso);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

  // ── Delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/admin/users/${deleteTarget._id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.filter((u) => u._id !== deleteTarget._id));
      setTotalUsers((prev) => prev - 1);
      showToast("User deleted successfully");
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditTarget(user);
    setEditForm({
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    });
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (!editForm.name.trim() || !editForm.email.trim()) {
      setEditError("Name and email are required.");
      return;
    }
    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(
        `http://localhost:3000/api/admin/users/${editTarget._id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(editForm),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editTarget._id ? { ...u, ...data.user } : u,
        ),
      );
      showToast("User updated successfully");
      setEditTarget(null);
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center bg-[#0A1238] px-4 pt-24 pb-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-lg transition-all
                    ${
                      toast.type === "success"
                        ? "bg-[#2d5f6e] text-white"
                        : "bg-red-500 text-white"
                    }`}
        >
          {toast.type === "success" ? "✓ " : "✕ "}
          {toast.msg}
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl px-10 py-8 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Delete User
            </h2>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-700">
                {deleteTarget.name}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 h-11 rounded-xl bg-red-500 text-white text-sm font-bold hover:bg-red-600 disabled:opacity-50 transition-all"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editTarget && (
        <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl px-10 py-10 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Edit User</h2>
            <p className="text-gray-400 text-sm mb-7">
              Update details for {editTarget.name}
            </p>

            {editError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2 text-sm">
                {editError}
              </div>
            )}

            <div className="space-y-4">
              {/* Name */}
              <div className="bg-gray-100 rounded-xl">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, name: e.target.value }))
                  }
                  className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl text-sm"
                />
              </div>
              {/* Email */}
              <div className="bg-gray-100 rounded-xl">
                <input
                  type="email"
                  placeholder="Email Address"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((p) => ({ ...p, email: e.target.value }))
                  }
                  className="w-full h-14 px-5 bg-transparent text-gray-700 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#2d5f6e] rounded-xl text-sm"
                />
              </div>
              {/* Status toggle */}
              <div className="flex items-center justify-between bg-gray-100 rounded-xl px-5 h-14">
                <span className="text-sm text-gray-600 font-medium">
                  Account Status
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setEditForm((p) => ({ ...p, isActive: !p.isActive }))
                  }
                  className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${editForm.isActive ? "bg-[#2d5f6e]" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${editForm.isActive ? "translate-x-7" : "translate-x-1"}`}
                  />
                </button>
                <span
                  className={`text-xs font-semibold w-12 text-right ${editForm.isActive ? "text-[#2d5f6e]" : "text-gray-400"}`}
                >
                  {editForm.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setEditTarget(null)}
                className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={editLoading}
                className="flex-1 h-12 rounded-2xl bg-[#2d5f6e] text-white text-sm font-bold hover:bg-[#244d5a] disabled:opacity-50 transition-all shadow-[0_10px_25px_-5px_rgba(45,95,110,0.4)]"
              >
                {editLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="w-full max-w-5xl mb-8 text-center">
        <h1 className="text-4xl text-white font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-400 text-sm">Manage your registered users</p>
      </div>

      {/* ── Stat card ── */}
      <div className="w-full max-w-5xl bg-white rounded-2xl px-10 py-6 shadow-2xl mb-5 flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-[#2d5f6e] flex items-center justify-center flex-shrink-0">
          <svg
            className="w-7 h-7 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4.13a4 4 0 11-8 0 4 4 0 018 0zm6 0a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <div>
          <p className="text-gray-400 text-sm font-medium">
            Total Registered Users
          </p>
          <p className="text-4xl font-bold text-[#2d5f6e] mt-0.5">
            {loading ? "—" : totalUsers}
          </p>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Search */}
        <div className="px-8 pt-7 pb-5">
          <p className="text-gray-700 text-sm text-center mb-5">
            Search and manage users
          </p>
          <div className="bg-gray-100 rounded-xl flex items-center px-5 gap-3 focus-within:ring-2 focus-within:ring-[#2d5f6e] transition-all">
            <svg
              className="w-4 h-4 text-gray-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"
              />
            </svg>
            <input
              className="w-full h-14 bg-transparent text-gray-700 placeholder-gray-400 outline-none text-sm"
              placeholder="Search by name…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  fetchUsers("");
                }}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-16 flex flex-col items-center gap-3">
            <svg
              className="animate-spin h-6 w-6 text-[#2d5f6e]"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
            <span className="text-sm text-gray-400">Loading users…</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="mx-8 mb-5 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && users.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">
            {search
              ? `No users found for "${search}"`
              : "No users registered yet"}
          </div>
        )}

        {/* Table */}
        {!loading && !error && users.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  {[
                    "#",
                    "User",
                    "Email",
                    "Status",
                    "Last Active",
                    "Joined",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-semibold text-[#2d5f6e] uppercase tracking-widest border-b border-gray-200"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <tr
                    key={user._id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {/* # */}
                    <td className="px-6 py-4 text-xs text-gray-400 w-8">
                      {i + 1}
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#2d5f6e] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-[0_4px_10px_-2px_rgba(45,95,110,0.4)]">
                          {initials(user.name)}
                        </div>
                        <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {user.name}
                        </span>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.email}
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
                                                ${
                                                  user.isActive
                                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                                    : "bg-gray-100 text-gray-400 border border-gray-200"
                                                }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-gray-400"}`}
                        />
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {formatLastActive(user.lastActive)}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                      {formatDate(user.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit */}
                        <button
                          onClick={() => openEdit(user)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#2d5f6e]/10 text-[#2d5f6e] text-xs font-semibold hover:bg-[#2d5f6e]/20 transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                          Edit
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(user)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-xs font-semibold hover:bg-red-100 transition-all"
                        >
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && users.length > 0 && (
          <div className="px-8 py-4 text-xs text-gray-400">
            Showing {users.length}{" "}
            {search
              ? `result${users.length !== 1 ? "s" : ""} for "${search}"`
              : `of ${totalUsers} user${totalUsers !== 1 ? "s" : ""}`}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
