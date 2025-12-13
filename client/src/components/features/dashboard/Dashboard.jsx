// Dashboard.js
import React, { useEffect, useState, useRef } from 'react';
import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, ResponsiveContainer
} from 'recharts';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import BackButton from '../../ui/BackButton/BackButton';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import api from '../../../api/axios';
import { getAllPds, getEmployeesWithoutPds } from '../../../api/pds/pds';
import { getDailyLoginActivity, getPositionsByOffice } from '../../../api/dashboard/dashboard';
import { getModuleUsage } from '../../../api/modules/moduleAccess';
import { getSystemVersion } from '../../../api/system/maintenance-mode';

// --- Main Dashboard Component ---

const Dashboard = () => {

    const [employeesNumber, setEmployeesNumber] = useState(0);
    const [plantillaNumber, setPlantillaNumber] = useState(0);
    const [joNumber, setJoNumber] = useState(0);
    const [loading, setLoading] = useState(true);
    const [plantillaLoading, setPlantillaLoading] = useState(true);
    const [joLoading, setJoLoading] = useState(true);
    
    // PDS Chart Data
    const [pdsChartData, setPdsChartData] = useState([
        { name: 'Draft', value: 0, color: '#9C27B0' },      // Purple
        { name: 'Approved', value: 0, color: '#FDD835' },    // Yellow
        { name: 'For Approval', value: 0, color: '#2196F3' }, // Blue
        { name: 'For Revision', value: 0, color: '#FF7043' }, // Orange
        { name: 'Declined', value: 0, color: '#E53935' },    // Red
        { name: 'No PDS', value: 0, color: '#4CAF50' },     // Green
    ]);
    const [pdsChartLoading, setPdsChartLoading] = useState(true);
    
    // Daily Login Activity Data
    const [loginData, setLoginData] = useState([]);
    const [loginLoading, setLoginLoading] = useState(true);
    
    // Module Usage Data
    const [moduleData, setModuleData] = useState([]);
    const [moduleLoading, setModuleLoading] = useState(true);
    
    // Positions by Office Data
    const [officesData, setOfficesData] = useState([]);
    const [officesLoading, setOfficesLoading] = useState(true);
    
    // System Version
    const [systemVersion, setSystemVersion] = useState('1.0.0');
    
    // Module chart container ref for width calculation
    const moduleChartRef = useRef(null);
    const [moduleChartWidth, setModuleChartWidth] = useState(800);
    
    const fetchPdsChartData = async () => {
        try {
            setPdsChartLoading(true);
            
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie", { withCredentials: true });
            
            // Fetch all PDS
            const pdsResponse = await getAllPds();
            const allPds = pdsResponse.pds || [];
            
            // Count PDS by status
            const draftCount = allPds.filter(pds => !pds.status || pds.status === 'draft').length;
            const approvedCount = allPds.filter(pds => pds.status === 'approved').length;
            const forApprovalCount = allPds.filter(pds => pds.status === 'pending').length;
            const forRevisionCount = allPds.filter(pds => pds.status === 'for-revision').length;
            const declinedCount = allPds.filter(pds => pds.status === 'declined').length;
            
            // Fetch employees without PDS
            let noPdsCount = 0;
            try {
                const noPdsResponse = await getEmployeesWithoutPds();
                noPdsCount = (noPdsResponse.employees || []).length;
            } catch (err) {
                console.error('Error fetching employees without PDS:', err);
            }
            
            // Update chart data
            setPdsChartData([
                { name: 'Draft', value: draftCount, color: '#9C27B0' },
                { name: 'Approved', value: approvedCount, color: '#FDD835' },
                { name: 'For Approval', value: forApprovalCount, color: '#2196F3' },
                { name: 'For Revision', value: forRevisionCount, color: '#FF7043' },
                { name: 'Declined', value: declinedCount, color: '#E53935' },
                { name: 'No PDS', value: noPdsCount, color: '#4CAF50' },
            ]);
        } catch (error) {
            console.error('Error fetching PDS chart data:', error);
            // Keep default values (0) on error
        } finally {
            setPdsChartLoading(false);
        }
    };
    
    const fetchDailyLoginActivity = async () => {
        try {
            setLoginLoading(true);
            
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie", { withCredentials: true });
            
            // Fetch daily login activity for current month
            const response = await getDailyLoginActivity();
            const dailyLogins = response.daily_logins || [];
            
            setLoginData(dailyLogins);
        } catch (error) {
            console.error('Error fetching daily login activity:', error);
            // Keep empty array on error
            setLoginData([]);
        } finally {
            setLoginLoading(false);
        }
    };
    
    const fetchModuleUsage = async () => {
        try {
            setModuleLoading(true);
            
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie", { withCredentials: true });
            
            // Fetch module usage for current month
            const response = await getModuleUsage();
            const modules = response.modules || [];
            
            setModuleData(modules);
        } catch (error) {
            console.error('Error fetching module usage:', error);
            // Keep empty array on error
            setModuleData([]);
        } finally {
            setModuleLoading(false);
        }
    };
    
    const fetchPositionsByOffice = async () => {
        try {
            setOfficesLoading(true);
            
            // Get CSRF cookie first
            await api.get("/sanctum/csrf-cookie", { withCredentials: true });
            
            // Fetch positions by office
            const response = await getPositionsByOffice();
            const offices = response.offices || [];
            
            // Add display label (use code if available, otherwise use name or "N/A")
            const officesWithDisplayLabel = offices.map(office => ({
                ...office,
                displayLabel: office.office_code || office.office || 'N/A'
            }));
            
            setOfficesData(officesWithDisplayLabel);
        } catch (error) {
            console.error('Error fetching positions by office:', error);
            // Keep empty array on error
            setOfficesData([]);
        } finally {
            setOfficesLoading(false);
        }
    };

    const fetchSystemVersion = async () => {
        try {
            const version = await getSystemVersion();
            setSystemVersion(version);
        } catch (error) {
            console.error('Error fetching system version:', error);
            // Keep default version on error
            setSystemVersion('1.0.0');
        }
    };

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                setPlantillaLoading(true);
                setJoLoading(true);
                // Get CSRF cookie first
                await api.get("/sanctum/csrf-cookie", { withCredentials: true });
                
                // Fetch employees count, plantilla count, and JO count
                const response = await api.get("/api/employees", { withCredentials: true });
                
                // Extract data from response
                if (response.data) {
                    if (response.data.total_employees !== undefined) {
                        setEmployeesNumber(response.data.total_employees);
                    } else {
                        console.warn('total_employees not found in response:', response.data);
                        setEmployeesNumber(0);
                    }
                    
                    if (response.data.total_plantilla !== undefined) {
                        setPlantillaNumber(response.data.total_plantilla);
                    } else {
                        console.warn('total_plantilla not found in response:', response.data);
                        setPlantillaNumber(0);
                    }
                    
                    if (response.data.total_jo !== undefined) {
                        setJoNumber(response.data.total_jo);
                    } else {
                        console.warn('total_jo not found in response:', response.data);
                        setJoNumber(0);
                    }
                } else {
                    console.warn('Unexpected response format:', response.data);
                    setEmployeesNumber(0);
                    setPlantillaNumber(0);
                    setJoNumber(0);
                }
            } catch (error) {
                console.error('Error fetching employees count:', error);
                setEmployeesNumber(0);
                setPlantillaNumber(0);
                setJoNumber(0);
            } finally {
                setLoading(false);
                setPlantillaLoading(false);
                setJoLoading(false);
            }
        };

        fetchEmployees();
        fetchPdsChartData();
        fetchDailyLoginActivity();
        fetchModuleUsage();
        fetchPositionsByOffice();
        fetchSystemVersion();
    }, []);
    
    // Separate effect for module chart width calculation
    useEffect(() => {
        const updateModuleChartWidth = () => {
            if (moduleChartRef.current) {
                setModuleChartWidth(moduleChartRef.current.offsetWidth || 800);
            }
        };
        
        // Initial calculation
        updateModuleChartWidth();
        
        // Use ResizeObserver for better responsiveness
        let resizeObserver;
        if (moduleChartRef.current && window.ResizeObserver) {
            resizeObserver = new ResizeObserver(() => {
                updateModuleChartWidth();
            });
            resizeObserver.observe(moduleChartRef.current);
        }
        
        // Fallback to window resize listener
        window.addEventListener('resize', updateModuleChartWidth);
        
        return () => {
            window.removeEventListener('resize', updateModuleChartWidth);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, [moduleData]); // Recalculate when module data changes

    // Get current month and year dynamically
    const getCurrentMonthYear = () => {
        const now = new Date();
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        const month = monthNames[now.getMonth()];
        const year = now.getFullYear();
        return `${month} ${year}`;
    };

    return (
        <div className="min-h-screen p-2 sm:p-4 bg-gray-100 font-sans">
            {/* <div className="mb-3">
                <BackButton to="/dashboard" label="Back" />
            </div> */}
            <BackButton to="/dashboard" label="Back" />

            <header className="bg-blue-700 text-white p-3 sm:p-4 font-bold flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 rounded-t-lg">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                    <span className="text-sm sm:text-base">DASHBOARD</span>
                    <span className="text-xs sm:text-sm font-normal opacity-80">{getCurrentMonthYear()}</span>
                </div>
                <span className="text-xs font-normal">Version: {systemVersion}</span>
            </header>

            {/* Top Row: Statistics Cards (Grid 4) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 mt-5">
                <StatCard 
                    title="EMPLOYEES" 
                    value={employeesNumber} 
                    icon="👥" 
                    bgColorClass="bg-blue-600" 
                    hoverClass="hover:bg-blue-700"
                    loading={loading}
                />
                <StatCard 
                    title="JOB APPLICATIONS" 
                    value="0" 
                    icon="🚨" 
                    bgColorClass="bg-blue-500" 
                    hoverClass="hover:bg-blue-600"
                />
                <StatCard 
                    title="REGULAR (PLANTILLA)" 
                    value={plantillaNumber} 
                    icon="🏛️" 
                    bgColorClass="bg-cyan-600" 
                    hoverClass="hover:bg-cyan-700"
                    loading={plantillaLoading}
                />
                <StatCard 
                    title="JOB ORDER (JO)" 
                    value={joNumber} 
                    icon="➖" 
                    bgColorClass="bg-yellow-500" 
                    hoverClass="hover:bg-yellow-600"
                    loading={joLoading}
                />
            </div>

            {/* Content Grid: Charts and Modules (Grid 2) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                
                {/* 1. Status Pie Chart */}
                <ChartCard title="PDS STATUS DISTRIBUTION">
                    {pdsChartLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <LoadingSpinner size="md" inline={false} />
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-4 lg:gap-8">
                            {/* Custom Legend */}
                            <div className="flex flex-row lg:flex-col flex-wrap justify-center lg:justify-start max-h-56 p-2 border border-gray-200 w-full lg:w-auto">
                                {pdsChartData.map((entry, index) => (
                                    <div key={`legend-${index}`} className="flex items-center text-xs m-1 whitespace-nowrap">
                                        <div 
                                            className="w-3 h-3 rounded mr-2" 
                                            style={{ backgroundColor: entry.color }}
                                        ></div>
                                        {entry.name} ({entry.value})
                                    </div>
                                ))}
                            </div>

                            {/* Pie Chart */}
                            <div className="w-full max-w-[300px] flex justify-center">
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={pdsChartData.filter(item => item.value > 0)}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius="80%"
                                            fill="#8884d8"
                                        >
                                            {pdsChartData.filter(item => item.value > 0).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* 2. Daily Login Activity Line Chart */}
                <ChartCard title="DAILY LOGIN ACTIVITY (THIS MONTH)">
                    {loginLoading ? (
                        <div className="flex items-center justify-center h-[250px]">
                            <LoadingSpinner size="md" inline={false} />
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <div style={{ minWidth: '550px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={loginData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="Daily Logins" stroke="#2196F3" strokeWidth={2} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* 3. Modules Usage Bar Chart */}
                <ChartCard title="MOST USED MODULES (THIS MONTH)">
                    {moduleLoading ? (
                        <div className="flex items-center justify-center h-[300px]">
                            <LoadingSpinner size="md" inline={false} />
                        </div>
                    ) : moduleData.length === 0 ? (
                        <div className="flex items-center justify-center h-[300px] text-gray-500">
                            <p>No module usage data available</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto" ref={moduleChartRef}>
                            <div style={{ minWidth: '100%', width: '100%' }}>
                                <ResponsiveContainer width="100%" height={Math.max(300, moduleData.length * 40)}>
                                    <BarChart 
                                        data={moduleData} 
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: Math.floor(moduleChartWidth * 0.25), bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis 
                                            dataKey="module" 
                                            type="category" 
                                            width={Math.floor(moduleChartWidth * 0.25)}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip 
                                            formatter={(value, name, props) => {
                                                if (name === 'total_accesses') {
                                                    return [
                                                        `${value} total accesses (${props.payload.total_users} unique users)`,
                                                        'Usage'
                                                    ];
                                                }
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) => `Module: ${label}`}
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                                        />
                                        <Bar 
                                            dataKey="total_accesses" 
                                            fill="#2196F3"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {moduleData.map((entry, index) => (
                                                <Cell 
                                                    key={`cell-${index}`} 
                                                    fill={
                                                        index === 0 ? '#4CAF50' : // Green for most used
                                                        index === 1 ? '#2196F3' : // Blue for second
                                                        index === 2 ? '#FF9800' : // Orange for third
                                                        '#9E9E9E' // Gray for others
                                                    } 
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </ChartCard>
                
                {/* 4. Positions by Office Bar Chart */}
                <ChartCard title="EMPLOYEE DISTRIBUTION BY OFFICE">
                    {officesLoading ? (
                        <div className="flex items-center justify-center h-[250px]">
                            <LoadingSpinner size="md" inline={false} />
                        </div>
                    ) : officesData.length === 0 ? (
                        <div className="flex items-center justify-center h-[250px] text-gray-500">
                            <p>No office data available</p>
                        </div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <div style={{ minWidth: '550px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height={Math.max(300, officesData.length * 50)}>
                                    <BarChart 
                                        data={officesData} 
                                        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="displayLabel" 
                                            angle={-45}
                                            textAnchor="end"
                                            height={100}
                                            tick={{ fontSize: 11 }}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value, name) => [value, name]}
                                            labelFormatter={(label) => {
                                                const office = officesData.find(o => o.displayLabel === label);
                                                return office ? `Office: ${office.office}` : label;
                                            }}
                                        />
                                        <Legend />
                                        <Bar 
                                            dataKey="plantilla" 
                                            name="Plantilla" 
                                            fill="#4CAF50"
                                            radius={[4, 4, 0, 0]}
                                        />
                                        <Bar 
                                            dataKey="job_order" 
                                            name="Job Order" 
                                            fill="#2196F3"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
};

export default Dashboard;