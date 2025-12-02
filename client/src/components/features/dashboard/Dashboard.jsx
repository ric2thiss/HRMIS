// Dashboard.js
import React from 'react';
import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line
} from 'recharts';
import StatCard from './StatCard';
import ChartCard from './ChartCard';

// --- Dummy Data ---

const pieData = [
    { name: 'Draft', value: 25, color: '#9C27B0' },      // Purple
    { name: 'Approve', value: 15, color: '#FDD835' },    // Yellow
    { name: 'For Approval', value: 5, color: '#2196F3' }, // Blue
    { name: 'For Revision', value: 10, color: '#FF7043' }, // Orange
    { name: 'Decline', value: 40, color: '#E53935' },    // Red
    { name: 'No PDS', value: 50, color: '#4CAF50' },     // Green
];

const loginData = [
    { day: 1, 'Daily Logins': 450 }, { day: 2, 'Daily Logins': 550 },
    { day: 3, 'Daily Logins': 600 }, { day: 4, 'Daily Logins': 580 },
    { day: 5, 'Daily Logins': 500 }, { day: 6, 'Daily Logins': 520 },
    { day: 7, 'Daily Logins': 510 }, { day: 8, 'Daily Logins': 530 },
    { day: 9, 'Daily Logins': 540 }, { day: 10, 'Daily Logins': 560 },
    // ... remaining 21 days for full chart width
];

const moduleData = [
    { day: 1, Leave: 1, DTRAS: 0.5 }, { day: 5, Leave: 0.9, DTRAS: 0.7 },
    { day: 10, Leave: 0.8, DTRAS: 0.6 }, { day: 15, Leave: 0.95, DTRAS: 0.5 },
    { day: 20, Leave: 0.9, DTRAS: 0.4 }, { day: 25, Leave: 0.85, DTRAS: 0.3 },
    { day: 31, Leave: 0.8, DTRAS: 0.2 },
];

const positionsData = [
    { category: 'Occupied Plantilla', value: 750, color: '#4CAF50' },
    { category: 'Vacant Plantilla', value: 150, color: '#FF9800' },
    { category: 'Job Order Employee', value: 78, color: '#2196F3' },
];

// --- Main Dashboard Component ---

const Dashboard = () => {
    return (
        <div className="min-h-screen p-5 bg-gray-100 font-sans">
            <header className="bg-blue-700 text-white p-4 font-bold flex justify-between items-center rounded-t-lg">
                <div className="flex gap-4">
                    <span>DASHBOARD</span>
                    <span className="text-sm font-normal opacity-80">December 2025</span>
                </div>
                <span className="text-xs font-normal">Version: 1.27.4</span>
            </header>

            {/* Top Row: Statistics Cards (Grid 4) */}
            <div className="grid grid-cols-4 gap-4 mb-5 mt-5">
                <StatCard 
                    title="EMPLOYEES" 
                    value="96" 
                    icon="👥" 
                    bgColorClass="bg-blue-600" 
                    hoverClass="hover:bg-blue-700"
                />
                <StatCard 
                    title="JOB APPLICATIONS" 
                    value="0" 
                    icon="🚨" 
                    bgColorClass="bg-blue-500" 
                    hoverClass="hover:bg-blue-600"
                />
                <StatCard 
                    title="POSSITIONS(PLANTILLA)" 
                    value="978" 
                    icon="🏛️" 
                    bgColorClass="bg-cyan-600" 
                    hoverClass="hover:bg-cyan-700"
                />
                <StatCard 
                    title="SEPARATED" 
                    value="8" 
                    icon="➖" 
                    bgColorClass="bg-yellow-500" 
                    hoverClass="hover:bg-yellow-600"
                />
            </div>

            {/* Content Grid: Charts and Modules (Grid 2) */}
            <div className="grid grid-cols-2 gap-5">
                
                {/* 1. Status Pie Chart */}
                <ChartCard>
                    <div className="flex items-center justify-start gap-8">
                        {/* Custom Legend (Mimicking the image) */}
                        <div className="flex flex-col flex-wrap max-h-56 p-2 border border-gray-200">
                            {pieData.map((entry, index) => (
                                <div key={`legend-${index}`} className="flex items-center text-xs m-1 whitespace-nowrap">
                                    <div 
                                        className="w-3 h-3 rounded mr-2" 
                                        style={{ backgroundColor: entry.color }}
                                    ></div>
                                    {entry.name}
                                </div>
                            ))}
                        </div>

                        {/* Pie Chart */}
                        <PieChart width={300} height={300}>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                fill="#8884d8"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </div>
                </ChartCard>

                {/* 2. Daily Login Activity Line Chart */}
                <ChartCard title="DAILY LOGIN ACTIVITY (THIS MONTH)">
                    <LineChart width={550} height={250} data={loginData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Daily Logins" stroke="#2196F3" strokeWidth={2} />
                    </LineChart>
                </ChartCard>

                {/* 3. Modules Line Chart */}
                <ChartCard title="MODULES">
                    <LineChart width={550} height={250} data={moduleData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 1]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="Leave" stroke="#E53935" strokeWidth={2} dot={{ fill: '#E53935', r: 3 }} />
                        <Line type="monotone" dataKey="DTRAS" stroke="#00BCD4" strokeWidth={2} dot={{ fill: '#00BCD4', r: 3 }} />
                    </LineChart>
                </ChartCard>
                
                {/* 4. Positions by Province Bar Chart */}
                <ChartCard title="POSITIONS BY PROVINCE">
                    <div className="text-xs text-gray-600 mb-4">
                        Position & Employment Distribution (Overall $\rightarrow$ Regions $\rightarrow$ Center)
                    </div>
                    <BarChart width={550} height={250} data={positionsData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" hide={true}/>
                        <YAxis domain={[0, 700]} />
                        <Tooltip />
                        <Legend layout="horizontal" align="center" verticalAlign="top" payload={
                            positionsData.map((item) => ({
                                id: item.category,
                                value: item.category,
                                type: 'square',
                                color: item.color,
                            }))
                        } />
                        <Bar dataKey="value" name="Total Positions" >
                            {positionsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartCard>
            </div>
        </div>
    );
};

export default Dashboard;