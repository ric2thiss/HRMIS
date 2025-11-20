import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../context/auth/ProtectedRoute";
import GuestRoute from "../context/auth/GuestRoute";
import Landing from '../pages/Landing'
import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import PDS from '../pages/pds/Pds'
import DTR from '../pages/dtr/Dtr'
import ManageEmployees from '../pages/employees/ManageEmployees'

import PageNotFound from '../pages/pageNotFound/404'
import ManageAccount from "../pages/manageAccount/ManageAccount";

export default function Routers() {
    return (
        <Routes>
          <Route path="/" element={
            <Landing />
            } />

            <Route path="/login" element={
                <GuestRoute>
                    <Login />
                </GuestRoute>
            } />

            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            {/* <Route path="/profile" element={
                <ProtectedRoute>
                    <ProfileSettings />
                </ProtectedRoute>
            } /> */}

            <Route path="/my-pds" element={
                <ProtectedRoute>
                    <PDS />
                </ProtectedRoute>
            } />

            <Route path="/my-dtr" element={
                <ProtectedRoute>
                    <DTR />
                </ProtectedRoute>
            } />

            <Route path="/manage-employees" element={
                <ProtectedRoute>
                    <ManageEmployees />
                </ProtectedRoute>
            } />

            <Route path="/manage-accounts" element={
                <ProtectedRoute>
                    <ManageAccount />
                </ProtectedRoute>
            } />



            {/* <Route path="/admin/dashboard" element={
                <ProtectedRoute>
                    <AdminDashboard />
                </ProtectedRoute>
            } /> */}

            <Route path="*" element={
                <PageNotFound />
            } />
        </Routes>
    );
}