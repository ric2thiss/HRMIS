import React, { useState } from 'react';
import PositionsTable from './PositionsTable';
import RolesTable from './RolesTable';
import ProjectsTable from './ProjectsTable';
import SpecialCapabilitiesTable from './SpecialCapabilitiesTable';
import OfficesTable from './OfficesTable';
import ApprovalNamesTable from './ApprovalNamesTable';
import LeaveTypesTable from './LeaveTypesTable';

function MasterListsManager() {
  const [activeTab, setActiveTab] = useState('positions');

  const tabs = [
    { id: 'positions', label: 'Positions/Designations', component: PositionsTable },
    { id: 'roles', label: 'Organizational Roles', component: RolesTable },
    { id: 'projects', label: 'Project Affiliations', component: ProjectsTable },
    { id: 'offices', label: 'Offices', component: OfficesTable },
    { id: 'capabilities', label: 'Special Capabilities', component: SpecialCapabilitiesTable },
    { id: 'approval-names', label: 'Approval Names', component: ApprovalNamesTable },
    { id: 'leave-types', label: 'Leave Types', component: LeaveTypesTable },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || PositionsTable;

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <header className="mb-6 border-b pb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          Master Lists Management
        </h2>
        <p className="text-sm text-gray-600 mt-2">
          Manage organizational categories that must be defined before creating user accounts.
        </p>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Active Tab Content */}
      <div>
        <ActiveComponent />
      </div>
    </div>
  );
}

export default MasterListsManager;

