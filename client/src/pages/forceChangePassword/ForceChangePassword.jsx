import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/axios';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import Logo from '../../asset/DICT logo.svg';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';

function ForceChangePassword() {
    const navigate = useNavigate();
    const { user, loading: authLoading, refreshUser } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Show loading while auth is initializing
    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner text="Loading..." />
            </div>
        );
    }

    // ProtectedRoute handles redirects, so we don't need to redirect here
    // Just show the form if user exists and needs to change password

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (newPassword.length < 6) {
            setError('New password must be at least 6 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('New password and confirm password do not match');
            return;
        }

        if (currentPassword === newPassword) {
            setError('New password must be different from current password');
            return;
        }

        setLoading(true);

        try {
            await api.get('/sanctum/csrf-cookie', { withCredentials: true });
            const response = await api.post(
                '/api/change-password',
                {
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: confirmPassword,
                },
                { withCredentials: true }
            );

            setSuccess(true);
            
            // Refresh user data to get updated must_change_password status
            await refreshUser();

            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } catch (err) {
            const message = err?.response?.data?.message || 'Failed to change password. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    // Gradient Style for the Left Panel
    const gradientStyle = {
        background: 'linear-gradient(135deg, #1d4ed8 0%, #eab308 100%)',
    };

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <Helmet>
                <title>HRMIS - Change Password</title>
            </Helmet>

            <Header />

            <section className="flex-grow flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="flex w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden">
                    {/* Left Panel - Gradient */}
                    <div
                        className="hidden md:flex flex-col items-center justify-center w-1/2 p-10 text-white"
                        style={gradientStyle}
                    >
                        <div className="text-center">
                            <img src={Logo} alt="DICT logo" className="w-24 h-24 mx-auto mb-4" />
                            <div className="space-y-2">
                                <h2 className="text-3xl font-extrabold tracking-tight">
                                    CHANGE PASSWORD REQUIRED
                                </h2>
                                <p className="text-xl font-light opacity-80">
                                    For security reasons, you must change your password before accessing the system.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form */}
                    <div className="w-full md:w-1/2 p-8 sm:p-12">
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Change Password</h1>
                        <p className="text-gray-500 mb-8">
                            For security reasons, you must change your password before accessing the system.
                        </p>

                        {success && (
                            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                                Password changed successfully! Redirecting to dashboard...
                            </div>
                        )}

                        {error && (
                            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {/* Current Password */}
                            <div>
                                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Current Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="currentPassword"
                                        type={showCurrentPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                        placeholder="Enter current password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        required
                                        disabled={loading || success}
                                    />
                                    {currentPassword && (
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showCurrentPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* New Password */}
                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="newPassword"
                                        type={showNewPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                        placeholder="Enter new password (min. 6 characters)"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading || success}
                                    />
                                    {newPassword && (
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm New Password <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150"
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading || success}
                                    />
                                    {confirmPassword && (
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={loading || success}
                                    className={`w-full py-3 px-4 rounded-lg font-bold text-base transition-colors duration-200 ${
                                        loading || success
                                            ? 'bg-blue-400 cursor-not-allowed text-white'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
                                    }`}
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center">
                                            <LoadingSpinner size="sm" inline={true} color="white" />
                                            <span className="ml-2">Changing password...</span>
                                        </span>
                                    ) : success ? (
                                        'Password Changed!'
                                    ) : (
                                        'Change Password'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}

export default ForceChangePassword;

