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
    const [layoutMode, setLayoutMode] = useState('single'); // 'single' or 'side-by-side'
    const pdfRef = useRef(null); // Reference for the printable DTR area

    // --- Actions ---

    // Helper function to convert time string to minutes for comparison
    const timeToMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const parts = timeStr.split(':');
        return parseInt(parts[0] || 0) * 60 + parseInt(parts[1] || 0);
    };

    const processAttendanceData = (attendances, startDay, endDay, selectedMonth, selectedYear) => {
        // Group attendance by date
        const attendanceByDate = {};
        
        // Convert selected month/year to numbers for comparison
        const selectedMonthNum = parseInt(selectedMonth);
        const selectedYearNum = parseInt(selectedYear);
        
        attendances.forEach(attendance => {
            // Handle both string and Date object formats
            let dateObj;
            if (typeof attendance.date === 'string') {
                dateObj = new Date(attendance.date);
            } else if (attendance.date instanceof Date) {
                dateObj = attendance.date;
            } else {
                // Try to parse if it's an object with date properties
                dateObj = new Date(attendance.date);
            }
            
            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                console.warn('Invalid date in attendance:', attendance);
                return;
            }
            
            const day = dateObj.getDate();
            const month = dateObj.getMonth() + 1; // getMonth() returns 0-11
            const year = dateObj.getFullYear();
            
            // Verify month and year match, and day is within range
            if (month === selectedMonthNum && year === selectedYearNum && day >= startDay && day <= endDay) {
                if (!attendanceByDate[day]) {
                    attendanceByDate[day] = [];
                }
                attendanceByDate[day].push(attendance);
            }
        });

        // Standard working hours (8 hours per day)
        const STANDARD_HOURS = 8;
        const STANDARD_AM_START = '08:00';
        const STANDARD_AM_END = '12:00';
        const STANDARD_PM_START = '13:00';
        const STANDARD_PM_END = '17:00';

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
            // Fill sequentially: AM IN → AM OUT → PM IN → PM OUT
            // Don't base on time of day, but on the sequence of records
            let am_in = '';
            let am_out = '';
            let pm_in = '';
            let pm_out = '';

            dayAttendances.forEach(attendance => {
                // Handle time format - could be "HH:MM:SS" or "HH:MM"
                let time = attendance.time || '00:00:00';
                // Normalize time format (remove seconds if present)
                if (time.includes(':')) {
                    const timeParts = time.split(':');
                    time = `${timeParts[0]}:${timeParts[1]}`;
                }
                
                const state = (attendance.state || '').toLowerCase().trim();
                
                // Debug: Log attendance record if state is unexpected
                if (!state || (!state.includes('in') && !state.includes('out'))) {
                    console.warn('Unexpected state value:', attendance.state, 'for attendance:', attendance);
                }
                
                const isIn = state.includes('in') || state === 'in' || state === 'check-in' || state === 'checkin';
                const isOut = state.includes('out') || state === 'out' || state === 'check-out' || state === 'checkout';
                
                if (!isIn && !isOut) {
                    return; // Skip if not a valid IN or OUT
                }
                
                // Sequential fill logic based on what's already filled:
                // 1. If AM IN is empty → fill AM IN (first IN of the day)
                if (!am_in && isIn) {
                    am_in = time;
                }
                // 2. If AM IN exists but AM OUT is empty → fill AM OUT (first OUT after AM IN)
                else if (am_in && !am_out && isOut) {
                    am_out = time;
                }
                // 3. If both AM IN and AM OUT exist, and PM IN is empty → fill PM IN (first IN after AM OUT)
                else if (am_in && am_out && !pm_in && isIn) {
                    pm_in = time;
                }
                // 4. If PM IN exists but PM OUT is empty → fill PM OUT (first OUT after PM IN)
                else if (pm_in && !pm_out && isOut) {
                    pm_out = time;
                }
                // 5. If all fields are filled, update PM OUT if this is a later OUT (for cases with multiple PM OUTs)
                else if (am_in && am_out && pm_in && pm_out && isOut) {
                    // Update PM OUT only if this is a later time (handle multiple check-outs)
                    const currentTime = timeToMinutes(time);
                    const existingTime = timeToMinutes(pm_out);
                    if (currentTime > existingTime) {
                        pm_out = time;
                    }
                }
            });

            // Calculate total hours worked
            let totalHours = 0;
            if (am_in && am_out) {
                const amHours = calculateHours(am_in, am_out);
                totalHours += amHours;
            }
            if (pm_in && pm_out) {
                const pmHours = calculateHours(pm_in, pm_out);
                totalHours += pmHours;
            }

            // Calculate undertime (if worked less than 8 hours)
            // Undertime = Standard Hours (8) - Hours Actually Worked
            let undertimeHours = 0;
            let undertimeMinutes = 0;
            
            // Only calculate undertime if there's actual attendance data
            // (If no attendance, it's an absent day, not undertime)
            const hasAnyAttendance = am_in || am_out || pm_in || pm_out;
            
            if (hasAnyAttendance && totalHours < STANDARD_HOURS) {
                const undertimeDecimal = STANDARD_HOURS - totalHours;
                undertimeHours = Math.floor(undertimeDecimal);
                // Calculate minutes from the decimal part
                const decimalMinutes = (undertimeDecimal - undertimeHours) * 60;
                undertimeMinutes = Math.round(decimalMinutes);
                
                // Handle edge case: if minutes round to 60, convert to hours
                if (undertimeMinutes >= 60) {
                    undertimeHours += Math.floor(undertimeMinutes / 60);
                    undertimeMinutes = undertimeMinutes % 60;
                }
            }

            return {
                day: dayNum,
                am_in: am_in || '',
                am_out: am_out || '',
                pm_in: pm_in || '',
                pm_out: pm_out || '',
                total_hours: totalHours > 0 ? totalHours.toFixed(1) : '',
                undertime_hours: undertimeHours > 0 ? undertimeHours.toString() : '',
                undertime_minutes: undertimeMinutes > 0 ? undertimeMinutes.toString() : ''
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
            // Try both user_id and employee_id since imported records might have null user_id
            const attendanceParams = {
                user_id: user.id,
                start_date: startDate,
                end_date: endDate,
                per_page: 1000, // Get all records for the period
            };
            
            // Also include employee_id if available (for records imported from CSV)
            if (user.employee_id) {
                attendanceParams.employee_id = user.employee_id;
            }
            
            const response = await getAttendance(attendanceParams);

            const attendances = response.attendances?.data || [];
            
            // Debug: Log attendance data to verify it's being fetched
            console.log('Fetched attendances:', attendances.length, 'records');
            console.log('Query params:', attendanceParams);
            if (attendances.length > 0) {
                console.log('Sample attendance record:', attendances[0]);
            } else {
                console.warn('No attendance records found. Check if:');
                console.warn('1. Date range matches attendance records:', startDate, 'to', endDate);
                console.warn('2. User ID matches:', user.id);
                console.warn('3. Employee ID matches:', user.employee_id);
            }
            
            // Process attendance data
            const days = processAttendanceData(attendances, startDay, endDay, month, year);
            
            // Debug: Log processed days to verify data is being processed
            console.log('Processed days:', days.length);
            const daysWithData = days.filter(d => d.am_in || d.am_out || d.pm_in || d.pm_out);
            console.log('Days with attendance data:', daysWithData.length);
            if (daysWithData.length > 0) {
                console.log('Sample day with data:', daysWithData[0]);
            }

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
                startDay: startDay,
                endDay: endDay,
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
        if (!dtrContent || !pdfRef.current) {
            alert('Please search for a DTR first before printing.');
            return;
        }

        // Verify that dtrContent has days data
        if (!dtrContent.days || dtrContent.days.length === 0) {
            alert('No attendance data available to print. Please ensure you have searched for a DTR with attendance records.');
            return;
        }
        
        // Use the browser's native print function targeting the DTR content area
        const printWindow = window.open('', '', 'height=600,width=1200');
        printWindow.document.write('<html><head><title>DTR Print - Civil Service Form No. 48</title>');
        // Enhanced CSS for print formatting - optimized for A4 paper
        const printStyle = `
            <style>
                @page {
                    size: ${layoutMode === 'side-by-side' ? 'A4 landscape' : 'A4 portrait'};
                    margin: ${layoutMode === 'side-by-side' ? '0.25in' : '0.5in'};
                }
                @media print {
                    body { 
                        padding: 0 !important; 
                        margin: 0 !important; 
                        font-family: Arial, sans-serif;
                        background: white;
                    } 
                    .dtr-sheet { 
                        font-size: ${layoutMode === 'side-by-side' ? '8pt' : '10pt'}; 
                        width: ${layoutMode === 'side-by-side' ? '49%' : '100%'}; 
                        box-shadow: none !important; 
                        border: none !important; 
                        page-break-inside: avoid;
                        padding: ${layoutMode === 'side-by-side' ? '0.25in' : '0.5in'} !important;
                        margin: 0 !important;
                        transform: none !important;
                    }
                    .dtr-container {
                        display: ${layoutMode === 'side-by-side' ? 'flex' : 'block'} !important;
                        justify-content: space-between !important;
                        gap: ${layoutMode === 'side-by-side' ? '2%' : '0'} !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                    } 
                    th, td { 
                        border: 1px solid black; 
                        padding: ${layoutMode === 'side-by-side' ? '2px' : '3px'}; 
                        text-align: center; 
                        font-size: ${layoutMode === 'side-by-side' ? '7pt' : '9pt'};
                    }
                    .civil-service-form-48 {
                        font-family: Arial, sans-serif !important;
                    }
                }
            </style>
        `;
        printWindow.document.write(printStyle);
        printWindow.document.write('</head><body style="background: white; padding: 0; margin: 0;">');
        printWindow.document.write(pdfRef.current.outerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();

    }, [dtrContent, layoutMode]);
    
    
    // --- CORRECTED: PDF Download Handler using html2canvas and jsPDF ---
    const handleDownload = useCallback(() => {
        if (!dtrContent || !pdfRef.current) {
            alert('Please search for a DTR first before downloading.');
            return;
        }

        // Verify that dtrContent has days data
        if (!dtrContent.days || dtrContent.days.length === 0) {
            alert('No attendance data available to generate PDF. Please search for a DTR first.');
            return;
        }

        const input = pdfRef.current;
        const filename = `DTR_CivilServiceForm48_${dtrContent.employeeName.replace(/ /g, '_')}_${year}-${month}.pdf`;

        // Temporarily adjust styles for PDF generation
        const originalContainerStyle = input.style.cssText;
        if (layoutMode === 'side-by-side') {
            input.style.padding = '0.25in';
            input.style.gap = '0.5%';
        }

        // Wait for React to finish rendering and DOM to be fully updated
        // Use requestAnimationFrame to ensure the DOM is painted before capture
        requestAnimationFrame(() => {
            setTimeout(() => {
                // Verify the element has content before capturing
                const tableCells = input.querySelectorAll('tbody td');
                const hasData = Array.from(tableCells).some(cell => cell.textContent.trim() !== '');
                
                if (!hasData) {
                    alert('No attendance data found in the DTR. Please ensure you have searched for a DTR with attendance records.');
                    input.style.cssText = originalContainerStyle;
                    return;
                }

                // 1. Capture the HTML element using html2canvas
                html2canvas(input, { 
                    scale: layoutMode === 'side-by-side' ? 1.5 : 2, // Lower scale for side-by-side to fit
                    logging: true, // Enable logging to debug
                    useCORS: true,
                    allowTaint: false,
                    backgroundColor: '#ffffff',
                    width: input.scrollWidth,
                    height: input.scrollHeight,
                    windowWidth: input.scrollWidth,
                    windowHeight: input.scrollHeight,
                    onclone: (clonedDoc) => {
                        // Ensure all styles are applied in the cloned document
                        const clonedElement = clonedDoc.querySelector('.dtr-container');
                        if (clonedElement) {
                            // Force visibility and ensure data is rendered
                            clonedElement.style.visibility = 'visible';
                            clonedElement.style.opacity = '1';
                            clonedElement.style.display = 'block';
                            
                            // Ensure all table cells are visible
                            const cells = clonedElement.querySelectorAll('td, th');
                            cells.forEach(cell => {
                                cell.style.visibility = 'visible';
                                cell.style.opacity = '1';
                            });
                        }
                    }
                }).then(canvas => {
                    // Restore original styles
                    input.style.cssText = originalContainerStyle;
                    
                    // Verify canvas has content
                    if (canvas.width === 0 || canvas.height === 0) {
                        alert('Failed to capture DTR content. Please try again.');
                        return;
                    }
                    
                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    
                    // 2. Initialize jsPDF - use landscape for side-by-side, portrait for single
                    const orientation = layoutMode === 'side-by-side' ? 'landscape' : 'portrait';
                    const pdf = new jsPDF(orientation, 'mm', 'a4');
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    
                    // Calculate the height required for the image while maintaining aspect ratio
                    const imgProps = pdf.getImageProperties(imgData);
                    const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
                    
                    // 3. Add the image to the PDF - ensure it fits on one page
                    if (imgHeight > pdfHeight) {
                        // Scale to fit height
                        const scale = pdfHeight / imgHeight;
                        const scaledWidth = pdfWidth * scale;
                        const xOffset = (pdfWidth - scaledWidth) / 2;
                        pdf.addImage(imgData, 'JPEG', xOffset, 0, scaledWidth, pdfHeight);
                    } else {
                        // Center horizontally if needed
                        const xOffset = 0;
                        pdf.addImage(imgData, 'JPEG', xOffset, 0, pdfWidth, imgHeight);
                    }

                    // 4. Save the PDF (triggers the download)
                    pdf.save(filename);
                }).catch(err => {
                    // Restore original styles on error
                    input.style.cssText = originalContainerStyle;
                    console.error("PDF Generation Error:", err);
                    alert("Failed to generate PDF. Check console for details.");
                });
            }, 100); // Small delay to ensure DOM is fully updated
        });

    }, [dtrContent, year, month, layoutMode]);

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

                {/* Layout Mode Toggle */}
                {dtrContent && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="layout-mode" className="text-sm font-medium text-gray-700">Layout:</label>
                        <select 
                            id="layout-mode" 
                            value={layoutMode} 
                            onChange={(e) => setLayoutMode(e.target.value)}
                            className="px-3 py-2 text-sm border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="single">Single Form</option>
                            <option value="side-by-side">Side-by-Side</option>
                        </select>
                    </div>
                )}
            </div>

            {/* DTR Display Area (PDF Viewer Style) */}
            <div className="pt-4">
                {loading && (
                    <div className="flex justify-center items-center py-10">
                        <LoadingSpinner text="Loading attendance data..." />
                    </div>
                )}
                
                {!loading && !dtrContent && (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg text-gray-500 bg-gray-50">
                        <div className="flex flex-col items-center gap-3">
                            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                            </svg>
                            <p className="text-gray-600">Select filter options and click "Search DTR" to view the report here.</p>
                        </div>
                    </div>
                )}

                {/* PDF Document Viewer - Shows whole document like PDF */}
                {dtrContent && (
                    <div className="bg-gray-100 flex items-center justify-center p-4" 
                         style={{ 
                             minHeight: 'calc(100vh - 400px)',
                             width: '100%',
                             overflow: 'auto'
                         }}>
                        <div className="bg-white shadow-2xl" 
                             style={{ 
                                 width: layoutMode === 'side-by-side' ? '11.69in' : '8.5in',
                                 maxWidth: '95%',
                                 boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
                                 margin: '0 auto'
                             }}>
                            <div ref={pdfRef} className={`dtr-container ${layoutMode === 'side-by-side' ? 'flex justify-between' : 'block'}`}
                                 style={{
                                     padding: layoutMode === 'side-by-side' ? '0.2in' : '0.5in',
                                     backgroundColor: '#ffffff',
                                     width: '100%',
                                     margin: '0'
                                 }}>
                                {/* First form */}
                                <div className={`dtr-sheet bg-white ${layoutMode === 'side-by-side' ? '' : ''}`}
                                     style={{ 
                                         width: layoutMode === 'side-by-side' ? 'calc(50% - 0.1in)' : '100%',
                                         padding: layoutMode === 'side-by-side' ? '0.25in' : '0.5in',
                                         margin: '0',
                                         border: layoutMode === 'side-by-side' ? '1px solid #e5e7eb' : 'none',
                                         fontSize: layoutMode === 'side-by-side' ? '0.75em' : '1em',
                                         boxSizing: 'border-box'
                                     }}>
                                    <DTRSheet data={dtrContent} />
                                </div>
                                {/* Second form (only for side-by-side) */}
                                {layoutMode === 'side-by-side' && (
                                    <div className="dtr-sheet bg-white"
                                         style={{ 
                                             width: 'calc(50% - 0.1in)',
                                             padding: '0.25in',
                                             margin: '0',
                                             border: '1px solid #e5e7eb',
                                             fontSize: '0.75em',
                                             boxSizing: 'border-box'
                                         }}>
                                        <DTRSheet data={dtrContent} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DTR;

// --- DTR Sheet Sub-Component (Memoized for Performance) ---
// Civil Service Form No. 48 - Daily Time Record

const DTRSheet = React.memo(({ data }) => {
    // Create a map of days for quick lookup
    const daysMap = {};
    data.days.forEach(day => {
        daysMap[day.day] = day;
    });

    // Get the range of days to display based on period
    const startDay = data.startDay || 1;
    const endDay = data.endDay || 31;
    const totalDays = endDay - startDay + 1;

    // Generate days only within the selected period
    const allDays = Array.from({ length: totalDays }, (_, i) => {
        const dayNum = startDay + i;
        const dayData = daysMap[dayNum] || {
            day: dayNum,
            am_in: '',
            am_out: '',
            pm_in: '',
            pm_out: '',
            undertime_hours: '',
            undertime_minutes: ''
        };
        return dayData;
    });

    // Calculate total undertime
    const totalUndertimeHours = allDays.reduce((sum, day) => {
        const hours = parseFloat(day.undertime_hours) || 0;
        return sum + hours;
    }, 0);
    
    const totalUndertimeMinutes = allDays.reduce((sum, day) => {
        const minutes = parseFloat(day.undertime_minutes) || 0;
        return sum + minutes;
    }, 0);

    // Convert excess minutes to hours
    const finalHours = totalUndertimeHours + Math.floor(totalUndertimeMinutes / 60);
    const finalMinutes = totalUndertimeMinutes % 60;

    return (
        <div className="civil-service-form-48" style={{ 
            fontFamily: 'Arial, sans-serif', 
            fontSize: 'inherit', 
            lineHeight: '1.2',
            width: '100%'
        }}>
            {/* Form Header */}
            <div style={{ position: 'relative', marginBottom: '0.8em' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, fontSize: '0.9em' }}>
                    Civil Service Form No. 48
                </div>
            </div>

            {/* Title Section */}
            <div style={{ textAlign: 'center', marginBottom: '1.2em' }}>
                <h2 style={{ 
                    fontSize: '1.4em', 
                    fontWeight: 'bold', 
                    margin: '0 0 0.4em 0',
                    letterSpacing: '0.05em'
                }}>
                    DAILY TIME RECORD
                </h2>
                <div style={{ fontSize: '1em', marginBottom: '0.8em', letterSpacing: '0.1em' }}>
                    ---o0o---
                </div>
            </div>

            {/* Name Field */}
            <div style={{ marginBottom: '1em', textAlign: 'center' }}>
                <div style={{ 
                    borderBottom: '1px solid black', 
                    display: 'inline-block', 
                    minWidth: '60%',
                    paddingBottom: '0.2em',
                    marginBottom: '0.2em'
                }}>
                    {data.employeeName || ''}
                </div>
                <div style={{ fontSize: '0.9em', marginTop: '0.2em' }}>(Name)</div>
            </div>

            {/* Month Field */}
            <div style={{ marginBottom: '1em', textAlign: 'center' }}>
                <span style={{ marginRight: '0.8em' }}>For the month of</span>
                <span style={{ 
                    borderBottom: '1px solid black', 
                    display: 'inline-block', 
                    minWidth: '30%',
                    paddingBottom: '0.2em'
                }}>
                    {data.monthYear || ''}
                </span>
            </div>

            {/* Official Hours Fields */}
            <div style={{ marginBottom: '1.2em', fontSize: '0.9em' }}>
                <div style={{ marginBottom: '0.6em' }}>
                    <span>Official hours for arrival and departure</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8em', flexWrap: 'wrap' }}>
                    <span>Regular days</span>
                    <span style={{ 
                        borderBottom: '1px solid black', 
                        display: 'inline-block', 
                        minWidth: '15%',
                        paddingBottom: '0.2em'
                    }}></span>
                    <span>/</span>
                    <span>Saturdays</span>
                    <span style={{ 
                        borderBottom: '1px solid black', 
                        display: 'inline-block', 
                        minWidth: '15%',
                        paddingBottom: '0.2em'
                    }}></span>
                </div>
            </div>

            {/* Main Table */}
            <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse', 
                border: '1px solid black',
                fontSize: '0.9em'
            }}>
                <thead>
                    <tr>
                        <th rowSpan="2" style={{ 
                            border: '1px solid black', 
                            padding: '0.3em',
                            width: '5%',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold'
                        }}>Day</th>
                        <th colSpan="2" style={{ 
                            border: '1px solid black', 
                            padding: '0.3em',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold'
                        }}>A.M.</th>
                        <th colSpan="2" style={{ 
                            border: '1px solid black', 
                            padding: '0.3em',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold'
                        }}>P.M.</th>
                        <th colSpan="2" style={{ 
                            border: '1px solid black', 
                            padding: '0.3em',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold'
                        }}>Undertime</th>
                    </tr>
                    <tr>
                        <th style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold',
                            fontSize: '0.8em'
                        }}>Arrival</th>
                        <th style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold',
                            fontSize: '0.8em'
                        }}>Departure</th>
                        <th style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold',
                            fontSize: '0.8em'
                        }}>Arrival</th>
                        <th style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold',
                            fontSize: '0.8em'
                        }}>Departure</th>
                        <th style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold',
                            fontSize: '0.8em'
                        }}>Hours</th>
                        <th style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            backgroundColor: '#f0f0f0',
                            fontWeight: 'bold',
                            fontSize: '0.8em'
                        }}>Minutes</th>
                    </tr>
                </thead>
                <tbody>
                    {allDays.map((day, index) => (
                        <tr key={index}>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '3px',
                                textAlign: 'center',
                                fontWeight: 'bold'
                            }}>{day.day}</td>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '0.25em',
                                textAlign: 'center'
                            }}>{day.am_in || ''}</td>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '0.25em',
                                textAlign: 'center'
                            }}>{day.am_out || ''}</td>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '0.25em',
                                textAlign: 'center'
                            }}>{day.pm_in || ''}</td>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '0.25em',
                                textAlign: 'center'
                            }}>{day.pm_out || ''}</td>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '0.25em',
                                textAlign: 'center'
                            }}>{day.undertime_hours || ''}</td>
                            <td style={{ 
                                border: '1px solid black', 
                                padding: '0.25em',
                                textAlign: 'center'
                            }}>{day.undertime_minutes || ''}</td>
                        </tr>
                    ))}
                    {/* Total Row */}
                    <tr>
                        <td colSpan="5" style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            textAlign: 'right',
                            fontWeight: 'bold'
                        }}>Total</td>
                        <td style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>{finalHours > 0 ? finalHours : ''}</td>
                        <td style={{ 
                            border: '1px solid black', 
                            padding: '4px',
                            textAlign: 'center',
                            fontWeight: 'bold'
                        }}>{finalMinutes > 0 ? finalMinutes : ''}</td>
                    </tr>
                </tbody>
            </table>

            {/* Certification Text */}
            <div style={{ marginTop: '1.6em', marginBottom: '1.2em', fontSize: '0.9em', lineHeight: '1.4' }}>
                <p style={{ margin: '0 0 0.8em 0', textAlign: 'justify' }}>
                    I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.
                </p>
            </div>

            {/* Signature Lines */}
            <div style={{ marginTop: '2em' }}>
                <div style={{ 
                    borderTop: '1px solid black', 
                    paddingTop: '0.4em',
                    marginBottom: '3em',
                    fontSize: '0.9em'
                }}>
                    <div style={{ marginBottom: '0.4em' }}>
                        VERIFIED as to the prescribed office hours:
                    </div>
                </div>
                <div style={{ 
                    borderTop: '1px solid black', 
                    paddingTop: '0.4em',
                    fontSize: '0.9em',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '0.4em' }}>In Charge</div>
                </div>
            </div>
        </div>
    );
});