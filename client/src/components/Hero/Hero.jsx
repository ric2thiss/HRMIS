import React, { useState, useEffect } from 'react';
import './Hero.css';

function Hero({ user }) {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date) => {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    
    const dayName = days[date.getDay()];
    const monthName = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    return `${dayName}, ${monthName}, ${day}, ${year}`;
  };

  const formatTime = (date) => {
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const hoursStr = hours.toString().padStart(2, '0');
    
    return `${hoursStr}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="hr-dark-blue text-white p-4 sm:p-6 rounded-lg shadow-xl flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
        <div className="flex-shrink-0">
            <h2 className="text-base sm:text-lg lg:text-xl font-light">WELCOME</h2>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mt-1 break-words">{user.name?.toUpperCase() || ''}</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-stretch w-full lg:w-auto">
            {/* Leave Credits Container - Keep existing design */}
            <div className="bg-white/10 p-3 sm:p-4 rounded-lg lg:ml-6 w-full sm:min-w-[280px] lg:min-w-[300px] flex flex-col">
                <h3 className="text-xs sm:text-sm font-medium mb-2 sm:mb-3">LEAVE CREDITS AS OF 11/12/2004</h3>
                <div className="flex justify-between text-center text-xs sm:text-sm font-semibold gap-2 sm:gap-0">
                    <div className="flex-1">
                        <p className="text-base sm:text-lg font-extrabold">15.00</p>
                        <p className="text-[10px] sm:text-xs text-gray-300">SICK LEAVE</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-base sm:text-lg font-extrabold">15.00</p>
                        <p className="text-[10px] sm:text-xs text-gray-300">VACATION LEAVE</p>
                    </div>
                    <div className="flex-1">
                        <p className="text-base sm:text-lg font-extrabold">5.00</p>
                        <p className="text-[10px] sm:text-xs text-gray-300">SPECIAL LEAVE</p>
                    </div>
                </div>
            </div>
            
            {/* Date and Time Container - Same design as leave credits, fit to content width, same height */}
            <div className="bg-white/10 p-3 sm:p-4 rounded-lg flex flex-col justify-center items-start sm:items-end text-left sm:text-right w-full sm:w-auto">
                <p className="text-xs sm:text-sm font-medium mb-1 sm:mb-2 break-words">{formatDate(currentDateTime)}</p>
                <p className="text-base sm:text-lg font-bold">{formatTime(currentDateTime)}</p>
            </div>
        </div>
    </div>
  );
}

export default Hero