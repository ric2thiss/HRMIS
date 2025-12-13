import React, { useState, useCallback, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas'; // 1. Import html2canvas
import jsPDF from 'jspdf';           // 2. Import jspdf
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { getAttendance } from '../../api/attendance/attendance';
import { useNotificationStore } from '../../stores/notificationStore';
import LoadingSpinner from '../Loading/LoadingSpinner';


// --- Auxiliary Data ---
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => (CURRENT_YEAR - i).toString());
const MONTHS = [
    { value: '01', name: 'January' }, { value: '02', name: 'February' }, { value: '03', name: 'March' },
    { value: '04', name: 'April' }, { value: '05', name: 'May' }, { value: '06', name: 'June' },
    { value: '07', name: 'July' }, { value: '08', name: 'August' }, { value: '09', name: 'September' },
    { value: '10', name: 'October' }, { value: '11', name: 'November' }, { value: '12', name: 'December' }
];
const PERIODS = [
    { value: '1-15', name: '1st Half (Days 1-15)' },
    { value: '16-31', name: '2nd Half (Days 16-31)' },
    { value: 'whole-month', name: 'Whole Month' },
];

// Helper function to get last day of month
const getLastDayOfMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
};

// --- DTR Component ---

const DTR = () => {
    const { user } = useAuth();
    const showError = useNotificationStore((state) => state.showError);
    
    // State for user selections
    const [year, setYear] = useState(CURRENT_YEAR.toString());
    const [month, setMonth] = useState(MONTHS[new Date().getMonth()].value);
    const [period, setPeriod] = useState(PERIODS[0].value);
    
    // State to hold the DTR data object
    const [dtrContent, setDtrContent] = useState(null);
    const [loading, setLoading] = useState(false);
    const pdfRef = useRef(null); // Reference for the printable DTR area

    // --- Actions ---

    const processAttendanceData = (attendances, startDay, endDay, selectedMonth, selectedYear) => {
        // Group attendance by date
        const attendanceByDate = {};
        
        attendances.forEach(attendance => {
            const date = new Date(attendance.date);
            const day = date.getDate();
            
            if (day >= startDay && day <= endDay) {
                if (!attendanceByDate[day]) {
                    attendanceByDate[day] = [];
                }
                attendanceByDate[day].push(attendance);
            }
        });

        // Process each day
        const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => {
            const dayNum = startDay + i;
            const dayAttendances = attendanceByDate[dayNum] || [];
            
            // Sort by time
            dayAttendances.sort((a, b) => {
                const timeA = a.time || '00:00:00';
                const timeB = b.time || '00:00:00';
                return timeA.localeCompare(timeB);
            });

            // Determine AM IN, AM OUT, PM IN, PM OUT
            let am_in = '';
            let am_out = '';
            let pm_in = '';
            let pm_out = '';

            dayAttendances.forEach(attendance => {
                const time = attendance.time || '00:00:00';
                const timeHour = parseInt(time.split(':')[0]);
                const state = (attendance.state || '').toLowerCase();
                
                // AM period (before 12:00)
                if (timeHour < 12) {
                    if (state.includes('in') || state.includes('check in')) {
                        if (!am_in) am_in = time.substring(0, 5); // HH:MM format
                    } else if (state.includes('out') || state.includes('check out')) {
                        am_out = time.substring(0, 5);
                    }
                } 
                // PM period (12:00 and after)
                else {
                    if (state.includes('in') || state.includes('check in')) {
                        if (!pm_in) pm_in = time.substring(0, 5);
                    } else if (state.includes('out') || state.includes('check out')) {
                        pm_out = time.substring(0, 5);
                    }
                }
            });

            // Calculate total hours
            let totalHours = 0;
            if (am_in && am_out) {
                const amHours = calculateHours(am_in, am_out);
                totalHours += amHours;
            }
            if (pm_in && pm_out) {
                const pmHours = calculateHours(pm_in, pm_out);
                totalHours += pmHours;
            }

            return {
                day: dayNum,
                am_in: am_in || '',
                am_out: am_out || '',
                pm_in: pm_in || '',
                pm_out: pm_out || '',
                total_hours: totalHours > 0 ? totalHours.toFixed(1) : ''
            };
        });

        return days;
    };

    const calculateHours = (timeIn, timeOut) => {
        const [inHour, inMin] = timeIn.split(':').map(Number);
        const [outHour, outMin] = timeOut.split(':').map(Number);
        
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        
        const diffMinutes = outMinutes - inMinutes;
        return diffMinutes / 60; // Convert to hours
    };

    const handleSearch = useCallback(async () => {
        
        // 1. Robust Input Validation
        if (!year || !month || !period) {
            showError('Please select valid Year, Month, and Period.');
            return;
        }

        if (!user) {
            showError('User information not available.');
            return;
        }

        let startDay, endDay;
        
        if (period === 'whole-month') {
            startDay = 1;
            endDay = getLastDayOfMonth(parseInt(year), parseInt(month));
        } else {
            if (!period.includes('-')) {
                showError('Invalid period format. Please refresh.');
                return;
            }
            
            const parts = period.split('-');
            if (parts.length !== 2) {
                showError('Invalid period format. Please refresh.');
                return;
            }

            const [startDayStr, endDayStr] = parts;
            startDay = parseInt(startDayStr);
            endDay = parseInt(endDayStr);
            
            if (isNaN(startDay) || isNaN(endDay)) {
                showError('Error parsing period days. Please select a valid period.');
                return;
            }
        }

        // Calculate date range
        const startDate = `${year}-${month}-${String(startDay).padStart(2, '0')}`;
        const endDate = `${year}-${month}-${String(endDay).padStart(2, '0')}`;

        setLoading(true);
        try {
            // Fetch attendance data for the user
            const response = await getAttendance({
                user_id: user.id,
                start_date: startDate,
                end_date: endDate,
                per_page: 1000, // Get all records for the period
            });

            const attendances = response.attendances?.data || [];
            
            // Process attendance data
            const days = processAttendanceData(attendances, startDay, endDay, month, year);

            // Get employee name
            const employeeName = user.name || 
                (user.first_name && user.last_name 
                    ? `${user.first_name} ${user.last_name}`.toUpperCase()
                    : 'EMPLOYEE NAME');

            // Update state to display DTR
            setDtrContent({ 
                employeeName: employeeName,
                monthYear: `${MONTHS.find(m => m.value === month).name}, ${year}`,
                period: period === 'whole-month' ? 'Whole Month' : `${startDay} - ${endDay}`,
                days: days,
                dateGenerated: new Date().toLocaleDateString(),
            });

        } catch (error) {
            const message = error?.response?.data?.message || 'Failed to load attendance data';
            showError(message);
        } finally {
            setLoading(false);
        }

    }, [year, month, period, user, showError]);


    const handlePrint = useCallback(() => {
        if (!dtrContent) {
            alert('Please search for a DTR first before printing.');
            return;
        }
        
        // Use the browser's native print function targeting the DTR content area
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>DTR Print</title>');
        // Basic CSS for print formatting
        printWindow.document.write('<style>@media print { body { padding: 0 !important; margin: 0 !important; } .dtr-sheet { font-size: 10pt; width: 100%; box-shadow: none; border: 1px solid black; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 4px; text-align: center; } }</style>');
        printWindow.document.write('</head><body>');
        printWindow.document.write(pdfRef.current.outerHTML); // Use outerHTML to include the ref div
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();

    }, [dtrContent]);
    
    
    // --- CORRECTED: PDF Download Handler using html2canvas and jsPDF ---
    const handleDownload = useCallback(() => {
        if (!dtrContent || !pdfRef.current) {
            alert('Please search for a DTR first before downloading.');
            return;
        }

        const input = pdfRef.current;
        const filename = `DTR_${dtrContent.employeeName.replace(/ /g, '_')}_${year}-${month}.pdf`;

        // 1. Capture the HTML element using html2canvas
        html2canvas(input, { 
            scale: 2, // Use higher scale for better resolution
            logging: true,
            useCORS: true 
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            
            // 2. Initialize jsPDF
            const pdf = new jsPDF('p', 'mm', 'a4'); // A4 paper in portrait mode
            const pdfWidth = pdf.internal.pageSize.getWidth();
            
            // Calculate the height required for the image while maintaining aspect ratio
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // 3. Add the image to the PDF
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);

            // 4. Save the PDF (triggers the download)
            pdf.save(filename);
        }).catch(err => {
            console.error("PDF Generation Error:", err);
            alert("Failed to generate PDF. Check console for details.");
        });

    }, [dtrContent, year, month]);

    // --- Render Component ---

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Daily Time Record (DTR)</h1>
            
            {/* Filter and Action Bar */}
            <div className="flex flex-wrap items-end gap-4 p-4 border-b pb-4 bg-gray-50 rounded-lg">
                
                {/* Year Select */}
                <div>
                    <label htmlFor="dtr-year" className="block text-sm font-medium text-gray-700">Year</label>
                    <select id="dtr-year" value={year} onChange={(e) => setYear(e.target.value)} 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* Month Select */}
                <div>
                    <label htmlFor="dtr-month" className="block text-sm font-medium text-gray-700">Month</label>
                    <select id="dtr-month" value={month} onChange={(e) => setMonth(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
                    </select>
                </div>

                {/* Period Select */}
                <div>
                    <label htmlFor="dtr-period" className="block text-sm font-medium text-gray-700">Period</label>
                    <select id="dtr-period" value={period} onChange={(e) => setPeriod(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                        {PERIODS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
                    </select>
                </div>

                {/* Search Button */}
                <button 
                    onClick={handleSearch} 
                    className="ml-auto px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 transition duration-150"
                >
                    <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                        Search DTR
                    </span>
                </button>

                {/* Print Button */}
                <button 
                    onClick={handlePrint}
                    disabled={!dtrContent}
                    className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-md hover:bg-green-600 transition duration-150 disabled:opacity-50"
                >
                    <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h4a2 2 0 002-2v-1m0 0H7m4 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                        Print
                    </span>
                </button>
                
                {/* Download Button */}
                <button 
                    onClick={handleDownload}
                    disabled={!dtrContent}
                    className="px-4 py-2 bg-red-600 text-white font-semibold rounded-md shadow-md hover:bg-red-700 transition duration-150 disabled:opacity-50"
                >
                    <span className="flex items-center">
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                        Download PDF
                    </span>
                </button>
            </div>

            {/* DTR Display Area (PDF Simulation) */}
            <div className="pt-4">
                <h2 className="text-lg font-bold text-gray-800 mb-2">DTR Preview</h2>
                
                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <LoadingSpinner text="Loading attendance data..." />
                    </div>
                )}
                
                {!loading && !dtrContent && (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500">
                        Select filter options and click "Search DTR" to view the report here.
                    </div>
                )}

                {/* DTR Content Sheet (Visible only after search) */}
                {dtrContent && (
                    <div ref={pdfRef} className="dtr-sheet max-w-4xl mx-auto p-6 bg-white border border-gray-400 shadow-xl overflow-hidden">
                        {/* The memoized sheet component */}
                        <DTRSheet data={dtrContent} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DTR;

// --- DTR Sheet Sub-Component (Memoized for Performance) ---

const DTRSheet = React.memo(({ data }) => (
    <div className="text-xs space-y-3 font-serif">
        <div className="text-center">
            <h3 className="font-bold text-sm">DAILY TIME RECORD</h3>
            <p className="border-b border-black text-base mt-2 font-bold inline-block px-4">{data.employeeName}</p>
            <p className="mt-1">(Name)</p>
        </div>

        <p className="text-center font-bold">For the Period: {data.monthYear}, {data.period}</p>

        <table className="w-full text-center border border-black">
            <thead className="bg-gray-100">
                <tr>
                    <th rowSpan="2" className="w-1/12 p-1 border-r border-black">Day</th>
                    <th colSpan="2" className="p-1 border-r border-black">AM</th>
                    <th colSpan="2" className="p-1 border-r border-black">PM</th>
                    <th rowSpan="2" className="w-2/12 p-1">Total Hours</th>
                </tr>
                <tr>
                    <th className="w-2/12 p-1 border-r border-black">Arrival</th>
                    <th className="w-2/12 p-1 border-r border-black">Departure</th>
                    <th className="w-2/12 p-1 border-r border-black">Arrival</th>
                    <th className="w-2/12 p-1 border-r border-black">Departure</th>
                </tr>
            </thead>
            <tbody>
                {data.days.map((day, index) => (
                    <tr key={index}>
                        <td className="p-1 border border-black font-bold">{day.day}</td>
                        <td className="p-1 border border-black">{day.am_in}</td>
                        <td className="p-1 border border-black">{day.am_out}</td>
                        <td className="p-1 border border-black">{day.pm_in}</td>
                        <td className="p-1 border border-black">{day.pm_out}</td>
                        <td className="p-1 border border-black font-semibold">{day.total_hours}</td>
                    </tr>
                ))}
            </tbody>
        </table>

        <div className="flex justify-between items-end pt-4">
            <div className="w-5/12 text-center border-t border-black pt-1">
                <p>Verified by:</p>
                <p className="font-bold mt-4">SUPERVISOR'S SIGNATURE</p>
            </div>
            <div className="w-5/12 text-center border-t border-black pt-1">
                <p>I CERTIFY on my honor that the above is a true and correct report...</p>
                <p className="font-bold mt-4">EMPLOYEE'S SIGNATURE</p>
            </div>
        </div>
    </div>
));