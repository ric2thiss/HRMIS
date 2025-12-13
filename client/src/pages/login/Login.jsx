import { Link, useNavigate } from 'react-router-dom'
import React, { useState, useEffect } from 'react'
import { Helmet } from "react-helmet";
import {Eye, EyeOff} from "lucide-react"

import { useAuth } from "../../hooks/useAuth";
import Header from "../../components/Header/Header"
import Footer from "../../components/Footer/Footer"
import Logo from "../../asset/DICT logo.svg"
import LoadingSpinner from "../../components/Loading/LoadingSpinner"
import api from "../../api/axios";

// Removed import "../../styles/auth.css"

function Login() {
    const navigate = useNavigate()
    const { login, user } = useAuth(); 
    const [email, setEmail] = useState('')
    const [showPassword, setShowPassword] = useState(false);
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("");

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            if (user.must_change_password) {
                navigate('/force-change-password', { replace: true });
            } else {
                navigate('/dashboard', { replace: true });
            }
        }
    }, [user, navigate]);

    // Minor fix: Changed etLoading to setLoading
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            // The login function in authStore already fetches user data
            // Check user from store after a brief delay to ensure state is updated
            setTimeout(() => {
                // This will be handled by the useEffect that watches the user state
            }, 100);
        } catch (err) {
            const status = err?.response?.status;
            const message = err?.response?.data?.message;

            if (status === 403 && message === 'Your account has been locked out! - HR') {
                setError(message);
                navigate('/locked-account');
            } else if (message) {
                setError(message);
            } else {
                setError("Invalid credentials. Please check your email and password.");
            }
        } finally {
            setLoading(false); 
        }
    };
    
    // Gradient Style for the Left Panel (consistent with Landing page)
    const gradientStyle = {
        background: 'linear-gradient(135deg, #1d4ed8 0%, #eab308 100%)',
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">

            <Helmet>
                <title>HRMIS - Login</title>
            </Helmet>
            {/* Header should not be necessary in a full-page auth layout, but kept for structure */}
            {/* You might want to pass user/logout props if you keep the header */}
            <Header /> 

            {/* Auth Section: Full Height Container */}
            <section className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
                
                {/* Auth Card: The main container for the split view */}
                <div className="flex w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
                    
                    {/* Auth Left: Gradient Side */}
                    <div 
                        className="hidden md:flex flex-col items-center justify-center w-1/2 p-10 text-white"
                        style={gradientStyle}
                    >
                        {/* Auth Left Inner */}
                        <div className="text-center">
                            {/* Logo */}
                            <img src={Logo} alt="DICT logo" className="w-24 h-24 mx-auto mb-4" /> 
                            
                            {/* Text Content */}
                            <div className="space-y-2">
                                <h2 className="text-3xl font-extrabold tracking-tight">
                                    HUMAN RESOURCE MANAGEMENT SYSTEM
                                </h2>
                                <p className="text-xl font-light opacity-80">
                                    DICT Region 13
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Auth Right: Form Side */}
                    <div className="w-full md:w-1/2 p-8 sm:p-12">
                        
                        {/* Title */}
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Login</h1>
                        <p className="text-gray-500 mb-8">Sign in to HRMIS.</p>

                        <form className="space-y-6" onSubmit={handleLogin}>
                            
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    id="email"
                                    type="email" // Changed from text for better mobile keyboard
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            
                            {/* Password Field */}
                            <div>
                                <label 
                                    htmlFor="password" 
                                    className="block text-sm font-medium text-gray-700 mb-1"
                                >
                                    Password
                                </label>

                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg 
                                                focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />

                                    {/* Icon button - only show when password has text */}
                                    {password && (
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 
                                                    text-gray-500 hover:text-gray-700"
                                        >
                                            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Checkbox */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <input 
                                        id="remember" 
                                        type="checkbox" 
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="remember" className="ml-2 block text-sm text-gray-900">
                                        Remember me
                                    </label>
                                </div>
                                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                                    Forgot Password?
                                </a>
                            </div>

                            {/* Actions and Error */}
                            <div className="flex flex-col items-center space-y-4 pt-4">
                                
                                {/* Submit Button */}
                                <button
                                    className={`w-full py-3 px-4 rounded-lg font-bold text-base transition-colors duration-200 ${
                                        loading
                                            ? 'bg-blue-400 cursor-not-allowed text-white' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg' 
                                    }`}
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <LoadingSpinner size="sm" inline={true} color="white" />
                                            <span className="ml-2">Signing in…</span>
                                        </span>
                                    ) : (
                                        'Sign in'
                                    )}
                                </button>

                                {/* Error Message */}
                                {error && (
                                    <div className="text-red-700 bg-red-50 p-3 rounded-lg w-full text-center text-sm border border-red-300">
                                        {error}
                                    </div>
                                )}

                                {/* Back to Landing Link */}
                                <div className="text-sm text-gray-500 pt-2">
                                    Back to <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">Landing Page</Link>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}

export default Login