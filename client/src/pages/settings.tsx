export default function SettingsPage() {
  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm max-w-xl">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Profile Information
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Update your personal information
          </p>

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value="email@gmail.com"
              disabled
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 focus:outline-none"
            />
          </div>

          {/* Full Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              defaultValue="Name"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Save Button */}
          <button
            className="inline-flex items-center justify-center rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
