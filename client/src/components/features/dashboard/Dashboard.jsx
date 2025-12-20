// Dashboard.js
import React, { useEffect, useRef, useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
    LineChart, Line, ResponsiveContainer
} from 'recharts';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
    Filler
} from 'chart.js';
import { Line as ChartLine } from 'react-chartjs-2';
import StatCard from './StatCard';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    ChartTooltip,
    ChartLegend,
    Filler
);
import ChartCard from './ChartCard';
import BackButton from '../../ui/BackButton/BackButton';
import LoadingSpinner from '../../Loading/LoadingSpinner';
import {
  useEmployeesCount,
  usePdsChartData,
  useDailyLoginActivity,
  useModuleUsage,
  usePositionsByOffice,
  useSystemVersion,
  useInvalidateDashboardQueries,
  useAttendanceStatistics
} from '../../../hooks/useDashboardData';

// --- Main Dashboard Component ---

const Dashboard = () => {
    // Use React Query hooks for data fetching with caching
    const { data: employeesData, isLoading: employeesLoading } = useEmployeesCount();
    const { data: pdsChartData = [], isLoading: pdsChartLoading } = usePdsChartData();
    const { data: loginData = [], isLoading: loginLoading } = useDailyLoginActivity();
    const { data: moduleData = [], isLoading: moduleLoading } = useModuleUsage();
    const { data: officesData = [], isLoading: officesLoading } = usePositionsByOffice();
    const { data: systemVersion = '1.0.0', isLoading: systemVersionLoading } = useSystemVersion();
    const { invalidateDashboardQueries } = useInvalidateDashboardQueries();
    
    // Get current month for attendance statistics
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const { data: attendanceStats, isLoading: attendanceStatsLoading } = useAttendanceStatistics(currentMonthStart, currentMonthEnd);
    
    // Prepare Chart.js data
    const attendanceChartData = React.useMemo(() => {
        if (!attendanceStats || !attendanceStats.statistics || attendanceStats.statistics.length === 0) {
            return null;
        }
        
        const labels = attendanceStats.statistics.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        return {
            labels: labels,
            datasets: [
                {
                    label: 'On Time',
                    data: attendanceStats.statistics.map(item => item.on_time),
                    borderColor: '#10B981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointHoverBorderWidth: 2,
                    pointHoverBorderColor: '#10B981',
                    pointBackgroundColor: '#10B981',
                    pointBorderColor: '#ffffff',
                },
                {
                    label: 'Late',
                    data: attendanceStats.statistics.map(item => item.late),
                    borderColor: '#F59E0B',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointHoverBorderWidth: 2,
                    pointHoverBorderColor: '#F59E0B',
                    pointBackgroundColor: '#F59E0B',
                    pointBorderColor: '#ffffff',
                },
                {
                    label: 'Overtime',
                    data: attendanceStats.statistics.map(item => item.overtime),
                    borderColor: '#3B82F6',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    borderWidth: 2.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                    pointHoverBorderWidth: 2,
                    pointHoverBorderColor: '#3B82F6',
                    pointBackgroundColor: '#3B82F6',
                    pointBorderColor: '#ffffff',
                },
            ],
        };
    }, [attendanceStats]);
    
    const attendanceChartOptions = React.useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 15,
                    font: {
                        size: 12,
                        weight: '500',
                        family: "'Inter', 'Segoe UI', sans-serif",
                    },
                    color: '#374151',
                },
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: {
                    size: 13,
                    weight: '600',
                },
                bodyFont: {
                    size: 12,
                },
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title: function(context) {
                        if (!attendanceStats || !attendanceStats.statistics) return '';
                        const index = context[0].dataIndex;
                        const date = new Date(attendanceStats.statistics[index].date);
                        return `📅 ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`;
                    },
                    label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y} ${context.parsed.y === 1 ? 'employee' : 'employees'}`;
                    },
                },
            },
        },
        scales: {
            x: {
                display: true,
                grid: {
                    display: true,
                    drawBorder: false,
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    font: {
                        size: 11,
                        family: "'Inter', 'Segoe UI', sans-serif",
                    },
                    color: '#6B7280',
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                display: true,
                beginAtZero: true,
                grid: {
                    display: true,
                    drawBorder: false,
                    color: 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    font: {
                        size: 11,
                        family: "'Inter', 'Segoe UI', sans-serif",
                    },
                    color: '#6B7280',
                    stepSize: 1,
                },
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false,
        },
        elements: {
            point: {
                hoverRadius: 6,
                hoverBorderWidth: 2,
            },
            line: {
                tension: 0.4,
                borderWidth: 2.5,
            },
        },
    }), [attendanceStats]);
    
    // Extract employee counts
    const employeesNumber = employeesData?.total_employees || 0;
    const plantillaNumber = employeesData?.total_plantilla || 0;
    const joNumber = employeesData?.total_jo || 0;
    const loading = employeesLoading;
    const plantillaLoading = employeesLoading;
    const joLoading = employeesLoading;
    
    // Module chart container ref for width calculation
    const moduleChartRef = useRef(null);
    const [moduleChartWidth, setModuleChartWidth] = useState(800);
    
    // Listen for real-time updates via WebSocket events
    useEffect(() => {
        const handlePdsUpdate = (event) => {
            console.log('Dashboard: PDS update received, invalidating dashboard queries');
            // Invalidate PDS chart data when PDS is updated
            invalidateDashboardQueries();
        };

        const handleEmployeeUpdate = (event) => {
            console.log('Dashboard: Employee update received, invalidating dashboard queries');
            // Invalidate employee count when employees are updated
            invalidateDashboardQueries();
        };

        window.addEventListener('pds-updated', handlePdsUpdate);
        window.addEventListener('employee-updated', handleEmployeeUpdate);

        return () => {
            window.removeEventListener('pds-updated', handlePdsUpdate);
            window.removeEventListener('employee-updated', handleEmployeeUpdate);
        };
    }, [invalidateDashboardQueries]);
    
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
                        <div className="w-full overflow-x-auto flex-1 flex items-end">
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

            {/* Attendance Monitoring Chart - Full Width */}
            <div className="mt-4 sm:mt-5">
                <ChartCard title="ATTENDANCE MONITORING (THIS MONTH)">
                    {attendanceStatsLoading ? (
                        <div className="flex items-center justify-center h-[250px]">
                            <LoadingSpinner size="md" inline={false} />
                        </div>
                    ) : !attendanceChartData ? (
                        <div className="flex items-center justify-center h-[250px] text-gray-500">
                            <p>No attendance data available for this month</p>
                        </div>
                    ) : (
                        <div className="w-full bg-gradient-to-br from-gray-50 to-white rounded-lg p-4" style={{ height: '400px' }}>
                            <ChartLine data={attendanceChartData} options={attendanceChartOptions} />
                        </div>
                    )}
                    {attendanceStats && attendanceStats.totals && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <p className="text-xs text-gray-500">Total On Time</p>
                                    <p className="text-lg font-bold text-green-600">{attendanceStats.totals.on_time || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Late</p>
                                    <p className="text-lg font-bold text-orange-600">{attendanceStats.totals.late || 0}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Total Overtime</p>
                                    <p className="text-lg font-bold text-blue-600">{attendanceStats.totals.overtime || 0}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
};

export default Dashboard;