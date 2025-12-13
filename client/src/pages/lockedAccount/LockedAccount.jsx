import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';

function LockedAccount() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Helmet>
        <title>HRMIS - Account Locked</title>
      </Helmet>

      {/* Reuse global header without user props */}
      <Header />

      <main className="flex-grow flex items-center justify-center px-4 py-8">
        <div className="max-w-lg w-full bg-white shadow-xl rounded-2xl p-8 text-center">
          <h1 className="text-2xl font-extrabold text-red-600 mb-2">
            Your account has been locked out! - HR
          </h1>
          <p className="text-gray-700 mb-4">
            For security reasons, your account has been locked by the HR office.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            Please contact your HR administrator to review and unlock your account
            before attempting to sign in again.
          </p>

          <div className="space-y-3">
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Back to Login
            </Link>
            <div className="text-xs text-gray-500">
              or go back to{' '}
              <Link to="/" className="text-blue-600 hover:text-blue-800 font-medium">
                Home
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default LockedAccount;


