import React from 'react'
import './Hero.css'
function Hero({user}) {
  return (
    <div class="hr-dark-blue text-white p-6 rounded-lg shadow-xl flex justify-between items-start">
        <div>
            <h2 class="text-xl font-light">WELCOME</h2>
            <h1 class="text-3xl font-bold mt-1">{user.name}</h1>
        </div>
        
        <div class="bg-white/10 p-4 rounded-lg ml-6 min-w-[300px]">
            <h3 class="text-sm font-medium mb-3">LEAVE CREDITS AS OF 11/12/2004</h3>
            <div class="flex justify-between text-center text-sm font-semibold">
                <div>
                    <p class="text-lg font-extrabold">15.00</p>
                    <p class="text-xs text-gray-300">SICK LEAVE</p>
                </div>
                <div>
                    <p class="text-lg font-extrabold">15.00</p>
                    <p class="text-xs text-gray-300">VACATION LEAVE</p>
                </div>
                <div>
                    <p class="text-lg font-extrabold">5.00</p>
                    <p class="text-xs text-gray-300">SPECIAL LEAVE</p>
                </div>
            </div>
        </div>
    </div>
  )
}

export default Hero