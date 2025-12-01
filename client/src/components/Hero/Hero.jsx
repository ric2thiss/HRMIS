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
    <div className="hr-dark-blue text-white p-6 rounded-lg shadow-xl flex justify-between items-start">
        <div>
            <h2 className="text-xl font-light">WELCOME</h2>
            <h1 className="text-3xl font-bold mt-1">{user.name?.toUpperCase() || ''}</h1>
        </div>
        
        <div className="flex gap-4 items-stretch">
            {/* Leave Credits Container - Keep existing design */}
            <div className="bg-white/10 p-4 rounded-lg ml-6 min-w-[300px] flex flex-col">
                <h3 className="text-sm font-medium mb-3">LEAVE CREDITS AS OF 11/12/2004</h3>
                <div className="flex justify-between text-center text-sm font-semibold">
                    <div>
                        <p className="text-lg font-extrabold">15.00</p>
                        <p className="text-xs text-gray-300">SICK LEAVE</p>
                    </div>
                    <div>
                        <p className="text-lg font-extrabold">15.00</p>
                        <p className="text-xs text-gray-300">VACATION LEAVE</p>
                    </div>
                    <div>
                        <p className="text-lg font-extrabold">5.00</p>
                        <p className="text-xs text-gray-300">SPECIAL LEAVE</p>
                    </div>
                </div>
            </div>
            
            {/* Date and Time Container - Same design as leave credits, fit to content width, same height */}
            <div className="bg-white/10 p-4 rounded-lg flex flex-col justify-center items-end text-right">
                <p className="text-sm font-medium mb-2">{formatDate(currentDateTime)}</p>
                <p className="text-lg font-bold">{formatTime(currentDateTime)}</p>
            </div>
        </div>
    </div>
  );
}

export default Hero