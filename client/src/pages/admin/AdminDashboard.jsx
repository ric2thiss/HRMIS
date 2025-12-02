import React from 'react';
import '../../styles/dashboard.css';

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <div className="text-sm text-gray-500">December 2025</div>
      </div>

      {/* Top summary boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-600 text-white rounded p-4 shadow">
          <div className="text-xs uppercase">Employees</div>
          <div className="text-3xl font-bold">96</div>
        </div>
        <div className="bg-red-600 text-white rounded p-4 shadow">
          <div className="text-xs uppercase">Job Applications</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        <div className="bg-green-600 text-white rounded p-4 shadow">
          <div className="text-xs uppercase">Positions(Plantilla)</div>
          <div className="text-3xl font-bold">978</div>
        </div>
        <div className="bg-yellow-500 text-white rounded p-4 shadow">
          <div className="text-xs uppercase">Separated</div>
          <div className="text-3xl font-bold">8</div>
        </div>
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold mb-2">Status Distribution</div>
          <div className="h-64 flex items-center justify-center text-gray-400">[Pie Chart Placeholder]</div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold mb-2">Daily Login Activity (This Month)</div>
          <div className="h-64 flex items-center justify-center text-gray-400">[Bar Chart Placeholder]</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold mb-2">Modules</div>
          <div className="h-48 flex items-center justify-center text-gray-400">[Modules Chart]</div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="text-sm font-semibold mb-2">Positions by Province</div>
          <div className="h-48 flex items-center justify-center text-gray-400">[Positions Chart]</div>
        </div>
      </div>
    </div>
  );
}
