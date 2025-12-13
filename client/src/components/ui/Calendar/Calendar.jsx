import React from 'react';

/**
 * Calendar component for date selection
 * @param {Object} props
 * @param {Date} props.currentMonth - Current month to display
 * @param {Function} props.onMonthChange - Callback when month changes
 * @param {Array<Date>} props.selectedDates - Array of selected dates
 * @param {Function} props.onDateSelect - Callback when date is clicked
 * @param {Date} props.minDate - Minimum selectable date
 */
function Calendar({ currentMonth, onMonthChange, selectedDates = [], onDateSelect, minDate }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  // Get previous month
  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    onMonthChange(newDate);
  };

  // Get next month
  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    onMonthChange(newDate);
  };

  // Check if date is selected
  const isSelected = (date) => {
    if (!selectedDates || selectedDates.length === 0) return false;
    const dateStr = date.toISOString().split('T')[0];
    return selectedDates.some(selected => {
      const selectedStr = selected.toISOString().split('T')[0];
      return selectedStr === dateStr;
    });
  };

  // Check if date is in the past
  const isPastDate = (date) => {
    if (!minDate) return false;
    const today = new Date(minDate);
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  // Check if date is weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  // Get month name
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthName = monthNames[month];

  // Generate calendar days
  const days = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    days.push(date);
  }

  return (
    <div className="w-full">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-lg font-semibold text-gray-800">
          {monthName} {year}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          aria-label="Next month"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const selected = isSelected(date);
          const past = isPastDate(date);
          const weekend = isWeekend(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => !past && onDateSelect(date)}
              disabled={past}
              className={`
                aspect-square text-sm font-medium rounded transition-colors
                ${past 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : selected
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : weekend
                      ? 'text-gray-400 hover:bg-gray-100'
                      : 'text-gray-700 hover:bg-blue-50'
                }
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;

