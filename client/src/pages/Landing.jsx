import React from 'react'
import { Helmet } from "react-helmet";
import { Link } from 'react-router-dom'
import dictLogo from '../asset/DICT logo.svg'
import Header from '../components/Header/Header';
import { useAuth } from "../hooks/useAuth";
import LoadingScreen from '../components/Loading/LoadingScreen'
// Component for feature icons
const FeatureIcon = ({ children }) => (
  <div className="text-4xl text-blue-600 mb-4">{children}</div>
);

export default function Landing() {
  const { user, logout, loading } = useAuth();

  if (loading) {
      return (
          <LoadingScreen />
      );
  }

  return (
    <div className="min-h-screen flex flex-col"> 
      <Helmet>
          <title>HRMIS - Home</title>
      </Helmet>
      <Header user={user} logout={logout} /> 

      <main className="bg-gray-50 flex-grow">
        
        {/* 🚀 Hero Section - HEIGHT REDUCED HERE */}
        <section 
          // Changed py-24 md:py-36 to py-16 md:py-24 (approximately 50% reduction)
          className="relative py-16 md:py-24 text-center text-white overflow-hidden" 
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #fbbf24 100%)',
            backgroundSize: '300% 300%',
            position: 'relative',
            overflow: 'hidden',
            animation: 'gradientAnimation 10s ease infinite',
          }}
        >
          {/* CSS for the subtle gradient animation */}
          <style>
            {`
            @keyframes gradientAnimation {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            `}
          </style>
          
          <div className="absolute inset-0 bg-black opacity-30"></div>
          <div className="relative z-10 max-w-4xl mx-auto px-6">
            
            {/* Kicker */}
            <p className="text-md font-medium mb-2 tracking-wider uppercase opacity-90">
              Human Resource Management System
            </p>
            
            {/* Hero Title - Reduced text size slightly to fit better */}
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4 tracking-tight">
              Modern HRMIS to streamline your <span className="text-yellow-300">workforce operations</span>
            </h1>
            
            {/* Hero Subtitle - Reduced text size slightly to fit better */}
            <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Centralize employee data, automate workflows, and gain insights with a fast, intuitive interface.
            </p>
            
            {/* Hero Actions */}
            <div className="mb-12">
              <Link 
                to="/login" 
                className="inline-block bg-white text-blue-700 px-8 py-3 rounded-full text-lg font-bold shadow-2xl hover:bg-gray-100 transition duration-300 transform hover:scale-105"
              >
                Launch App
              </Link>
            </div>
            
            {/* Badges */}
            {/* <div className="flex flex-wrap justify-center gap-4 text-gray-200 text-sm font-medium">
              <span className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <span className="mr-2 text-green-400">✔</span> No setup required
              </span>
              <span className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <span className="mr-2 text-green-400">✔</span> Fast & responsive
              </span>
              <span className="flex items-center bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/20">
                <span className="mr-2 text-green-400">✔</span> Secure by default
              </span>
            </div> */}

          </div>
        </section>

        {/* 🧩 Features Section (Unchanged) */}
        <section id="features" className="container mx-auto px-6 py-20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center my-10 text-gray-800 mb-16">
            Core Modules
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 my-10">
            
            <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 text-center border-t-4 border-blue-600">
              <FeatureIcon>👥</FeatureIcon>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Employee Directory</h3>
              <p className="text-gray-600">
                Searchable profiles with roles, departments, and contact details. Find anyone, instantly.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 text-center border-t-4 border-yellow-500">
              <FeatureIcon>🗓️</FeatureIcon>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Leave & Attendance</h3>
              <p className="text-gray-600">
                Track leave requests, approvals, and real-time attendance for full compliance.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-xl hover:shadow-2xl transition duration-300 transform hover:-translate-y-1 text-center border-t-4 border-green-500">
              <FeatureIcon>📈</FeatureIcon>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Analytics</h3>
              <p className="text-gray-600">
                Understand trends in headcount, attrition, and performance with actionable reports.
              </p>
            </div>
          </div>
        </section>

        {/* 📞 Call to Action (CTA) (Unchanged) */}
        <section id="get-started" className="container mx-auto px-6 py-16">
          <div className="bg-white p-10 md:p-12 rounded-2xl shadow-2xl flex flex-col md:flex-row items-center justify-between border border-gray-100">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h3 className="text-3xl font-extrabold text-gray-800">Ready to transform your HR?</h3>
              <p className="text-lg text-gray-600 mt-2">
                Jump into the app and see how HRMIS can simplify your workday.
              </p>
            </div>
            <div>
              <Link 
                to="/login" 
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition duration-300 shadow-lg"
              >
                Open Dashboard
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Unchanged) */}
      <footer className="bg-gray-800 text-gray-400 text-sm py-6 mt-10">
        <div className="container mx-auto px-6 flex flex-col sm:flex-row justify-between items-center">
          <p className="mb-3 sm:mb-0">&copy; {new Date().getFullYear()} HRMIS. All rights reserved.</p>
          <div className="flex space-x-4">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}