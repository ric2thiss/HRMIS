import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { getAttendance } from '../../../api/attendance/attendance';
import { useNotificationStore } from '../../../stores/notificationStore';
import { useAuth } from '../../../hooks/useAuth';
import { getUserRole } from '../../../utils/userHelpers';
import { useUserAccountsStore } from '../../../stores/userAccountsStore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LoadingSpinner from '../../Loading/LoadingSpinner';

// DTR Constants
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

function ViewAttendanceTable() {
  const { user: currentUser } = useAuth();
  const isHR = getUserRole(currentUser) === 'hr' || getUserRole(currentUser) === 'admin';
  const showSuccess = useNotificationStore((state) => state.showSuccess);
  const showError = useNotificationStore((state) => state.showError);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getAccounts: fetchUsers, accounts: users } = useUserAccountsStore();
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    employee_id: '',
    user_id: '',
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    per_page: 50,
    total: 0,
    last_page: 1,
  });
  
  // DTR states
  const [dtrFilters, setDtrFilters] = useState({
    selected_user_id: '',
    year: CURRENT_YEAR.toString(),
    month: MONTHS[new Date().getMonth()].value,
    period: PERIODS[0].value,
  });
  const [dtrContent, setDtrContent] = useState(null);
  const [dtrLoading, setDtrLoading] = useState(false);
  const [showDtrModal, setShowDtrModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const dtrPdfRef = useRef(null);
  
  // Searchable dropdown states
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const employeeDropdownRef = useRef(null);

  // Memoize page numbers calculation
  const pageNumbers = useMemo(() => {
    const pages = [];
    const totalPages = pagination.last_page;
    const currentPage = pagination.current_page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [pagination.current_page, pagination.last_page]);

  // Memoize loadAttendances function
  const loadAttendances = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        per_page: pagination.per_page,
        page: pagination.current_page,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null) {
          delete params[key];
        }
      });

      const response = await getAttendance(params);
      
      if (response.attendances) {
        setAttendances(response.attendances.data || []);
        setPagination(prev => ({
          ...prev,
          current_page: response.attendances.current_page || 1,
          per_page: response.attendances.per_page || 50,
          total: response.attendances.total || 0,
          last_page: response.attendances.last_page || 1,
        }));
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load attendance data';
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.per_page, pagination.current_page, showError]);

  // Debounce filter changes to avoid too many API calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadAttendances();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [filters, pagination.current_page, pagination.per_page, loadAttendances]);

  // Load users list for HR from cache
  useEffect(() => {
    if (isHR) {
      fetchUsers(); // Load from cache or fetch if expired
    }
  }, [isHR, fetchUsers]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter users based on search query
  const filteredEmployees = useMemo(() => {
    if (!employeeSearch.trim()) {
      return users;
    }
    const searchLower = employeeSearch.toLowerCase();
    return users.filter(user => {
      const name = (user.name || `${user.first_name || ''} ${user.last_name || ''}`).toLowerCase();
      const employeeId = (user.employee_id || '').toLowerCase();
      return name.includes(searchLower) || employeeId.includes(searchLower);
    });
  }, [users, employeeSearch]);

  // Update search input when employee is selected via dropdown
  // Note: We don't auto-update when selected_user_id changes externally to avoid overriding user typing

  // Handle employee selection
  const handleEmployeeSelect = (userId) => {
    setDtrFilters(prev => ({ ...prev, selected_user_id: userId.toString() }));
    const selected = users.find(u => u.id.toString() === userId.toString());
    if (selected) {
      const displayName = selected.name || `${selected.first_name || ''} ${selected.last_name || ''}`.trim();
      setEmployeeSearch(displayName);
    }
    setShowEmployeeDropdown(false);
  };

  // Memoize DTR Processing Functions
  const processAttendanceData = useCallback((attendances, startDay, endDay) => {
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

    const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => {
      const dayNum = startDay + i;
      const dayAttendances = attendanceByDate[dayNum] || [];
      
      dayAttendances.sort((a, b) => {
        const timeA = a.time || '00:00:00';
        const timeB = b.time || '00:00:00';
        return timeA.localeCompare(timeB);
      });

      let am_in = '';
      let am_out = '';
      let pm_in = '';
      let pm_out = '';

      dayAttendances.forEach(attendance => {
        const time = attendance.time || '00:00:00';
        const timeHour = parseInt(time.split(':')[0]);
        const state = (attendance.state || '').toLowerCase();
        
        if (timeHour < 12) {
          if (state.includes('in') || state.includes('check in')) {
            if (!am_in) am_in = time.substring(0, 5);
          } else if (state.includes('out') || state.includes('check out')) {
            am_out = time.substring(0, 5);
          }
        } else {
          if (state.includes('in') || state.includes('check in')) {
            if (!pm_in) pm_in = time.substring(0, 5);
          } else if (state.includes('out') || state.includes('check out')) {
            pm_out = time.substring(0, 5);
          }
        }
      });

      let totalHours = 0;
      if (am_in && am_out) {
        const [inHour, inMin] = am_in.split(':').map(Number);
        const [outHour, outMin] = am_out.split(':').map(Number);
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        totalHours += (outMinutes - inMinutes) / 60;
      }
      if (pm_in && pm_out) {
        const [inHour, inMin] = pm_in.split(':').map(Number);
        const [outHour, outMin] = pm_out.split(':').map(Number);
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        totalHours += (outMinutes - inMinutes) / 60;
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
  }, []);

  const handleSearchDTR = useCallback(async () => {
    if (!dtrFilters.selected_user_id) {
      showError('Please select an employee');
      return;
    }

    if (!dtrFilters.year || !dtrFilters.month || !dtrFilters.period) {
      showError('Please select valid Year, Month, and Period.');
      return;
    }

    let startDay, endDay;
    
    if (dtrFilters.period === 'whole-month') {
      startDay = 1;
      endDay = getLastDayOfMonth(parseInt(dtrFilters.year), parseInt(dtrFilters.month));
    } else {
      if (!dtrFilters.period.includes('-')) {
        showError('Invalid period format.');
        return;
      }
      
      const parts = dtrFilters.period.split('-');
      if (parts.length !== 2) {
        showError('Invalid period format.');
        return;
      }

      const [startDayStr, endDayStr] = parts;
      startDay = parseInt(startDayStr);
      endDay = parseInt(endDayStr);
      
      if (isNaN(startDay) || isNaN(endDay)) {
        showError('Error parsing period days.');
        return;
      }
    }

    const startDate = `${dtrFilters.year}-${dtrFilters.month}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${dtrFilters.year}-${dtrFilters.month}-${String(endDay).padStart(2, '0')}`;

    setDtrLoading(true);
    try {
      const response = await getAttendance({
        user_id: dtrFilters.selected_user_id,
        start_date: startDate,
        end_date: endDate,
        per_page: 1000,
      });

      const attendances = response.attendances?.data || [];
      const days = processAttendanceData(attendances, startDay, endDay);

      const selectedUser = users.find(u => u.id.toString() === dtrFilters.selected_user_id.toString());
      const employeeName = selectedUser?.name || 
        (selectedUser?.first_name && selectedUser?.last_name 
          ? `${selectedUser.first_name} ${selectedUser.last_name}`.toUpperCase()
          : 'EMPLOYEE NAME');

      setDtrContent({ 
        employeeName: employeeName,
        monthYear: `${MONTHS.find(m => m.value === dtrFilters.month).name}, ${dtrFilters.year}`,
        period: dtrFilters.period === 'whole-month' ? 'Whole Month' : `${startDay} - ${endDay}`,
        days: days,
        dateGenerated: new Date().toLocaleDateString(),
      });

      setShowDtrModal(true);
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to load attendance data';
      showError(message);
    } finally {
      setDtrLoading(false);
    }
  }, [dtrFilters, users, showError]);

  const handlePrintDTR = useCallback(async () => {
    // Validate required fields
    if (!dtrFilters.selected_user_id) {
      showError('Please select an employee first.');
      return;
    }

    if (!dtrFilters.year || !dtrFilters.month || !dtrFilters.period) {
      showError('Please select valid Year, Month, and Period.');
      return;
    }

    // If DTR content doesn't exist, load it first
    if (!dtrContent || !dtrPdfRef.current) {
      // Auto-search for DTR
      let startDay, endDay;
      
      if (dtrFilters.period === 'whole-month') {
        startDay = 1;
        endDay = getLastDayOfMonth(parseInt(dtrFilters.year), parseInt(dtrFilters.month));
      } else {
        if (!dtrFilters.period.includes('-')) {
          showError('Invalid period format.');
          return;
        }
        
        const parts = dtrFilters.period.split('-');
        if (parts.length !== 2) {
          showError('Invalid period format.');
          return;
        }

        const [startDayStr, endDayStr] = parts;
        startDay = parseInt(startDayStr);
        endDay = parseInt(endDayStr);
        
        if (isNaN(startDay) || isNaN(endDay)) {
          showError('Error parsing period days.');
          return;
        }
      }

      const startDate = `${dtrFilters.year}-${dtrFilters.month}-${String(startDay).padStart(2, '0')}`;
      const endDate = `${dtrFilters.year}-${dtrFilters.month}-${String(endDay).padStart(2, '0')}`;

      setDtrLoading(true);
      try {
        const response = await getAttendance({
          user_id: dtrFilters.selected_user_id,
          start_date: startDate,
          end_date: endDate,
          per_page: 1000,
        });

        const attendances = response.attendances?.data || [];
        const days = processAttendanceData(attendances, startDay, endDay);

        const selectedUser = users.find(u => u.id.toString() === dtrFilters.selected_user_id.toString());
        const employeeName = selectedUser?.name || 
          (selectedUser?.first_name && selectedUser?.last_name 
            ? `${selectedUser.first_name} ${selectedUser.last_name}`.toUpperCase()
            : 'EMPLOYEE NAME');

        const newDtrContent = { 
          employeeName: employeeName,
          monthYear: `${MONTHS.find(m => m.value === dtrFilters.month).name}, ${dtrFilters.year}`,
          period: dtrFilters.period === 'whole-month' ? 'Whole Month' : `${startDay} - ${endDay}`,
          days: days,
          dateGenerated: new Date().toLocaleDateString(),
        };

        setDtrContent(newDtrContent);
        setShowDtrModal(true);
        
        // Wait a bit for DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        const message = error?.response?.data?.message || 'Failed to load attendance data';
        showError(message);
        setDtrLoading(false);
        return;
      } finally {
        setDtrLoading(false);
      }
    }
    
    // Wait for ref to be ready
    if (!dtrPdfRef.current) {
      // Wait a bit more if ref is not ready
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!dtrPdfRef.current) {
      showError('DTR content is not ready. Please try again.');
      return;
    }
    
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>DTR Print</title>');
    printWindow.document.write('<style>@media print { body { padding: 0 !important; margin: 0 !important; } .dtr-sheet { font-size: 10pt; width: 100%; box-shadow: none; border: 1px solid black; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid black; padding: 4px; text-align: center; } }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(dtrPdfRef.current.outerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  }, [dtrContent, dtrFilters, users, showError, processAttendanceData, getAttendance]);

  const handleDownloadDTR = useCallback(async () => {
    // Validate required fields
    if (!dtrFilters.selected_user_id) {
      showError('Please select an employee first.');
      return;
    }

    if (!dtrFilters.year || !dtrFilters.month || !dtrFilters.period) {
      showError('Please select valid Year, Month, and Period.');
      return;
    }

    // If DTR content doesn't exist, load it first
    if (!dtrContent || !dtrPdfRef.current) {
      // Auto-search for DTR
      let startDay, endDay;
      
      if (dtrFilters.period === 'whole-month') {
        startDay = 1;
        endDay = getLastDayOfMonth(parseInt(dtrFilters.year), parseInt(dtrFilters.month));
      } else {
        if (!dtrFilters.period.includes('-')) {
          showError('Invalid period format.');
          return;
        }
        
        const parts = dtrFilters.period.split('-');
        if (parts.length !== 2) {
          showError('Invalid period format.');
          return;
        }

        const [startDayStr, endDayStr] = parts;
        startDay = parseInt(startDayStr);
        endDay = parseInt(endDayStr);
        
        if (isNaN(startDay) || isNaN(endDay)) {
          showError('Error parsing period days.');
          return;
        }
      }

      const startDate = `${dtrFilters.year}-${dtrFilters.month}-${String(startDay).padStart(2, '0')}`;
      const endDate = `${dtrFilters.year}-${dtrFilters.month}-${String(endDay).padStart(2, '0')}`;

      setDtrLoading(true);
      try {
        const response = await getAttendance({
          user_id: dtrFilters.selected_user_id,
          start_date: startDate,
          end_date: endDate,
          per_page: 1000,
        });

        const attendances = response.attendances?.data || [];
        const days = processAttendanceData(attendances, startDay, endDay);

        const selectedUser = users.find(u => u.id.toString() === dtrFilters.selected_user_id.toString());
        const employeeName = selectedUser?.name || 
          (selectedUser?.first_name && selectedUser?.last_name 
            ? `${selectedUser.first_name} ${selectedUser.last_name}`.toUpperCase()
            : 'EMPLOYEE NAME');

        const newDtrContent = { 
          employeeName: employeeName,
          monthYear: `${MONTHS.find(m => m.value === dtrFilters.month).name}, ${dtrFilters.year}`,
          period: dtrFilters.period === 'whole-month' ? 'Whole Month' : `${startDay} - ${endDay}`,
          days: days,
          dateGenerated: new Date().toLocaleDateString(),
        };

        setDtrContent(newDtrContent);
        setShowDtrModal(true);
        
        // Wait a bit for DOM to update
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        const message = error?.response?.data?.message || 'Failed to load attendance data';
        showError(message);
        setDtrLoading(false);
        return;
      } finally {
        setDtrLoading(false);
      }
    }

    // Wait for ref to be ready
    if (!dtrPdfRef.current) {
      // Wait a bit more if ref is not ready
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    if (!dtrPdfRef.current) {
      showError('DTR content is not ready. Please try again.');
      return;
    }

    const input = dtrPdfRef.current;
    const currentDtrContent = dtrContent || {
      employeeName: users.find(u => u.id.toString() === dtrFilters.selected_user_id.toString())?.name || 'EMPLOYEE',
      monthYear: `${MONTHS.find(m => m.value === dtrFilters.month)?.name || ''}, ${dtrFilters.year}`,
    };
    const filename = `DTR_${currentDtrContent.employeeName.replace(/ /g, '_')}_${dtrFilters.year}-${dtrFilters.month}.pdf`;

    html2canvas(input, { 
      scale: 2,
      logging: true,
      useCORS: true 
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
      pdf.save(filename);
    }).catch(err => {
      console.error("PDF Generation Error:", err);
      showError("Failed to generate PDF.");
    });
  }, [dtrContent, dtrFilters, users, showError, processAttendanceData, getAttendance]);

  const handleBulkDTRGenerate = async (userIds, filters) => {
    let startDay, endDay;
    
    if (filters.period === 'whole-month') {
      startDay = 1;
      endDay = getLastDayOfMonth(parseInt(filters.year), parseInt(filters.month));
    } else {
      const parts = filters.period.split('-');
      const [startDayStr, endDayStr] = parts;
      startDay = parseInt(startDayStr);
      endDay = parseInt(endDayStr);
    }
    
    const startDate = `${filters.year}-${filters.month}-${String(startDay).padStart(2, '0')}`;
    const endDate = `${filters.year}-${filters.month}-${String(endDay).padStart(2, '0')}`;

    try {
      showSuccess(`Generating ${userIds.length} DTR(s). This may take a moment...`);

      // Process each user sequentially with proper delays
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        const user = users.find(u => u.id === userId);
        
        if (!user) continue;

        try {
          // Add delay between downloads to prevent browser blocking
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between downloads
          }

          const response = await getAttendance({
            user_id: userId,
            start_date: startDate,
            end_date: endDate,
            per_page: 1000,
          });

          const attendances = response.attendances?.data || [];
          const days = processAttendanceData(attendances, startDay, endDay);

          const employeeName = user.name || 
            (user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}`.toUpperCase()
              : 'EMPLOYEE NAME');

          const dtrData = { 
            employeeName: employeeName,
            monthYear: `${MONTHS.find(m => m.value === filters.month).name}, ${filters.year}`,
            period: filters.period === 'whole-month' ? 'Whole Month' : `${startDay} - ${endDay}`,
            days: days,
            dateGenerated: new Date().toLocaleDateString(),
          };

          // Create temporary element for PDF generation
          const tempDiv = document.createElement('div');
          tempDiv.className = 'dtr-sheet max-w-4xl mx-auto p-6 bg-white border border-gray-400 shadow-xl';
          tempDiv.style.position = 'absolute';
          tempDiv.style.left = '-9999px';
          tempDiv.style.top = '0';
          tempDiv.style.width = '800px';
          document.body.appendChild(tempDiv);

          // Render DTR content
          const dtrHTML = `
            <div class="text-xs space-y-3 font-serif">
              <div class="text-center">
                <h3 class="font-bold text-sm">DAILY TIME RECORD</h3>
                <p class="border-b border-black text-base mt-2 font-bold inline-block px-4">${dtrData.employeeName}</p>
                <p class="mt-1">(Name)</p>
              </div>
              <p class="text-center font-bold">For the Period: ${dtrData.monthYear}, ${dtrData.period}</p>
              <table class="w-full text-center border border-black">
                <thead class="bg-gray-100">
                  <tr>
                    <th rowspan="2" class="w-1/12 p-1 border-r border-black">Day</th>
                    <th colspan="2" class="p-1 border-r border-black">AM</th>
                    <th colspan="2" class="p-1 border-r border-black">PM</th>
                    <th rowspan="2" class="w-2/12 p-1">Total Hours</th>
                  </tr>
                  <tr>
                    <th class="w-2/12 p-1 border-r border-black">Arrival</th>
                    <th class="w-2/12 p-1 border-r border-black">Departure</th>
                    <th class="w-2/12 p-1 border-r border-black">Arrival</th>
                    <th class="w-2/12 p-1 border-r border-black">Departure</th>
                  </tr>
                </thead>
                <tbody>
                  ${dtrData.days.map(day => `
                    <tr>
                      <td class="p-1 border border-black font-bold">${day.day}</td>
                      <td class="p-1 border border-black">${day.am_in}</td>
                      <td class="p-1 border border-black">${day.am_out}</td>
                      <td class="p-1 border border-black">${day.pm_in}</td>
                      <td class="p-1 border border-black">${day.pm_out}</td>
                      <td class="p-1 border border-black font-semibold">${day.total_hours}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="flex justify-between items-end pt-4">
                <div class="w-5/12 text-center border-t border-black pt-1">
                  <p>Verified by:</p>
                  <p class="font-bold mt-4">SUPERVISOR'S SIGNATURE</p>
                </div>
                <div class="w-5/12 text-center border-t border-black pt-1">
                  <p>I CERTIFY on my honor that the above is a true and correct report...</p>
                  <p class="font-bold mt-4">EMPLOYEE'S SIGNATURE</p>
                </div>
              </div>
            </div>
          `;
          tempDiv.innerHTML = dtrHTML;

          // Wait for DOM to render
          await new Promise(resolve => setTimeout(resolve, 300));

          // Generate PDF
          try {
            const canvas = await html2canvas(tempDiv, { 
              scale: 2,
              logging: false,
              useCORS: true,
              backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeight);
            
            const filename = `DTR_${dtrData.employeeName.replace(/ /g, '_')}_${filters.year}-${filters.month}.pdf`;
            pdf.save(filename);
          } catch (pdfError) {
            console.error(`PDF Generation Error for ${employeeName}:`, pdfError);
            showError(`Failed to generate PDF for ${employeeName}`);
          } finally {
            // Always cleanup the DOM element
            if (tempDiv.parentNode) {
              document.body.removeChild(tempDiv);
            }
          }
        } catch (error) {
          console.error(`Error generating DTR for user ${userId}:`, error);
          showError(`Failed to generate DTR for user ${userId}`);
        }
      }

      showSuccess(`Successfully generated ${userIds.length} DTR(s)`);
    } catch (error) {
      showError('Failed to generate bulk DTRs');
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
    // Reset to first page when filters change
    setPagination(prev => ({
      ...prev,
      current_page: 1,
    }));
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.last_page) return;
    setPagination(prev => ({
      ...prev,
      current_page: page,
    }));
  };

  const handlePerPageChange = (e) => {
    const newPerPage = parseInt(e.target.value);
    setPagination(prev => ({
      ...prev,
      per_page: newPerPage,
      current_page: 1, // Reset to first page when changing per page
    }));
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      employee_id: '',
      user_id: '',
    });
    setPagination(prev => ({
      ...prev,
      current_page: 1,
    }));
  };

  // Memoize format functions
  const formatDateTime = useCallback((dateTime) => {
    if (!dateTime) return 'N/A';
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, []);

  const formatDate = useCallback((date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* DTR Section - Only for HR */}
      {isHR && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">DTR Operations</h4>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <div className="relative" ref={employeeDropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Employee
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={employeeSearch}
                  onChange={(e) => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                    if (!e.target.value) {
                      setDtrFilters(prev => ({ ...prev, selected_user_id: '' }));
                    }
                  }}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  placeholder="Search employee name or ID..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {employeeSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeSearch('');
                      setDtrFilters(prev => ({ ...prev, selected_user_id: '' }));
                      setShowEmployeeDropdown(false);
                    }}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {showEmployeeDropdown && filteredEmployees.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredEmployees.map((user) => {
                      const displayName = user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                      const isSelected = dtrFilters.selected_user_id === user.id.toString();
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleEmployeeSelect(user.id)}
                          className={`w-full text-left px-4 py-2 hover:bg-blue-50 ${
                            isSelected ? 'bg-blue-100' : ''
                          }`}
                        >
                          <div className="font-medium text-sm text-gray-900">{displayName}</div>
                          <div className="text-xs text-gray-500">{user.employee_id || 'N/A'}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {showEmployeeDropdown && employeeSearch.trim() && filteredEmployees.length === 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-sm text-gray-500 text-center">
                    No employees found
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <select
                value={dtrFilters.year}
                onChange={(e) => setDtrFilters(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Month
              </label>
              <select
                value={dtrFilters.month}
                onChange={(e) => setDtrFilters(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <select
                value={dtrFilters.period}
                onChange={(e) => setDtrFilters(prev => ({ ...prev, period: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={handleSearchDTR}
                disabled={dtrLoading || !dtrFilters.selected_user_id}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {dtrLoading ? (
                  <>
                    <LoadingSpinner size="sm" inline={true} color="white" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <span>Search DTR</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrintDTR}
              disabled={!dtrContent}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h4a2 2 0 002-2v-1m0 0H7m4 0a1 1 0 11-2 0 1 1 0 012 0z" />
              </svg>
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadDTR}
              disabled={!dtrContent}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download PDF</span>
            </button>
            <button
              onClick={() => setShowBulkModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Bulk DTR Operations</span>
            </button>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Attendance Records</h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: {pagination.total} records
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700">Per page:</label>
              <select
                value={pagination.per_page}
                onChange={handlePerPageChange}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 pb-4 border-b border-gray-200 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={filters.start_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={filters.end_date}
                onChange={handleFilterChange}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Employee ID
              </label>
              <input
                type="text"
                name="employee_id"
                value={filters.employee_id}
                onChange={handleFilterChange}
                placeholder="Enter employee ID"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors bg-white"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-10">
            <LoadingSpinner text="Loading attendance data..." />
          </div>
        ) : attendances.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No attendance records found
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      AC NO./EMPLOYEE ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      State
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Import File
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendances.map((attendance) => (
                    <AttendanceRow 
                      key={attendance.id} 
                      attendance={attendance}
                      formatDate={formatDate}
                      formatDateTime={formatDateTime}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} results
                </div>
                <div className="flex items-center gap-2">
                  {/* First Page Button */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.current_page === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="First page"
                  >
                    ««
                  </button>
                  
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={pagination.current_page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>

                  {/* Page Number Buttons */}
                  <div className="flex gap-1">
                    {pageNumbers.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 border rounded-lg transition-colors ${
                            pagination.current_page === page
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>

                  {/* Last Page Button */}
                  <button
                    onClick={() => handlePageChange(pagination.last_page)}
                    disabled={pagination.current_page >= pagination.last_page}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Last page"
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* DTR Preview Modal */}
      {showDtrModal && dtrContent && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-start p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl mt-8 mb-8">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">DTR Preview</h2>
                <div className="flex gap-2">
                  <button
                    onClick={handlePrintDTR}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m0 0v1a2 2 0 002 2h4a2 2 0 002-2v-1m0 0H7m4 0a1 1 0 11-2 0 1 1 0 012 0z" />
                    </svg>
                    <span>Print</span>
                  </button>
                  <button
                    onClick={handleDownloadDTR}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>Download PDF</span>
                  </button>
                  <button
                    onClick={() => setShowDtrModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="overflow-auto max-h-[70vh]">
                <div ref={dtrPdfRef} className="dtr-sheet max-w-4xl mx-auto p-6 bg-white border border-gray-400 shadow-xl">
                  <DTRSheetComponent data={dtrContent} />
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Bulk DTR Operations Modal */}
      {showBulkModal && createPortal(
        <BulkDTROperationsModal
          users={users}
          onClose={() => setShowBulkModal(false)}
          onGenerate={handleBulkDTRGenerate}
        />,
        document.body
      )}
    </div>
  );
}

// Memoized Attendance Row Component
const AttendanceRow = React.memo(({ attendance, formatDate, formatDateTime }) => {
  const acNo = attendance.ac_no || '';
  const employeeId = attendance.employee_id || '';
  // const combinedId = acNo && employeeId 
  //   ? `${acNo} / ${employeeId}`
  //   : acNo || employeeId || 'N/A';
  
  // Handle user name - check multiple sources
  let userName = 'N/A';
  if (attendance.user) {
    userName = attendance.user.name || 
      (attendance.user.first_name && attendance.user.last_name 
        ? `${attendance.user.first_name} ${attendance.user.last_name}`
        : null);
  }
  if (!userName || userName === 'N/A') {
    userName = attendance.name || 'N/A';
  }
  
  const stateClass = attendance.state?.toLowerCase().includes('in') 
    ? 'bg-green-100 text-green-800'
    : attendance.state?.toLowerCase().includes('out')
    ? 'bg-red-100 text-red-800'
    : 'bg-gray-100 text-gray-800';
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {employeeId}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {userName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDate(attendance.date)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {attendance.time || 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {formatDateTime(attendance.date_time)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${stateClass}`}>
          {attendance.state || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {attendance.import_filename || 'N/A'}
      </td>
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return prevProps.attendance.id === nextProps.attendance.id &&
         prevProps.attendance.date === nextProps.attendance.date &&
         prevProps.attendance.time === nextProps.attendance.time &&
         prevProps.attendance.state === nextProps.attendance.state;
});

// DTR Sheet Component
const DTRSheetComponent = React.memo(({ data }) => (
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

// Bulk DTR Operations Modal
function BulkDTROperationsModal({ users, onClose, onGenerate }) {
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [bulkDtrFilters, setBulkDtrFilters] = useState({
    year: CURRENT_YEAR.toString(),
    month: MONTHS[new Date().getMonth()].value,
    period: PERIODS[0].value,
  });
  const [processing, setProcessing] = useState(false);

  const handleSelectAll = () => {
    if (selectedUserIds.length === users.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(users.map(u => u.id));
    }
  };

  const handleUserToggle = (userId) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleBulkGenerate = async () => {
    if (selectedUserIds.length === 0) {
      alert('Please select at least one employee');
      return;
    }

    setProcessing(true);
    try {
      await onGenerate(selectedUserIds, bulkDtrFilters);
      onClose();
    } catch (error) {
      console.error('Bulk DTR generation error:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-600 bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Bulk DTR Operations</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* DTR Filters */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <select
                value={bulkDtrFilters.year}
                onChange={(e) => setBulkDtrFilters(prev => ({ ...prev, year: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <select
                value={bulkDtrFilters.month}
                onChange={(e) => setBulkDtrFilters(prev => ({ ...prev, month: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {MONTHS.map(m => <option key={m.value} value={m.value}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select
                value={bulkDtrFilters.period}
                onChange={(e) => setBulkDtrFilters(prev => ({ ...prev, period: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.name}</option>)}
              </select>
            </div>
          </div>

          {/* Employee Selection */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Select Employees ({selectedUserIds.length} selected)
              </h3>
              <button
                onClick={handleSelectAll}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {selectedUserIds.length === users.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.includes(user.id)}
                          onChange={() => handleUserToggle(user.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">{user.employee_id || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {user.name || `${user.first_name} ${user.last_name}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={processing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkGenerate}
              disabled={processing || selectedUserIds.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing ? (
                <>
                  <LoadingSpinner size="sm" inline={true} color="white" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download All Selected DTRs</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewAttendanceTable;

