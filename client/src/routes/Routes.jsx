import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../context/auth/ProtectedRoute";
import RoleProtectedRoute from "../context/auth/RoleProtectedRoute";
import GuestRoute from "../context/auth/GuestRoute";
import Landing from '../pages/Landing'
import Login from "../pages/login/Login";
import Dashboard from "../pages/dashboard/Dashboard";
import PDS from '../pages/pds/Pds'
import DTR from '../pages/dtr/Dtr'
import ManageEmployees from '../pages/employees/ManageEmployees'
import PageNotFound from '../pages/pageNotFound/404'
import ManageAccount from "../pages/manageAccount/ManageAccount";
import SystemSettingsPage from '../pages/systemSettings/SystemSettings'
import MaintenanceMode from '../pages/maintenance-mode/MaintenanceMode'
import Profile from '../pages/profile/Profile'
import MyLeave from '../pages/leave/MyLeave'
import ManageLeave from '../pages/leave/ManageLeave'
import MyApproval from '../pages/approval/MyApproval'
import ImportAttendance from '../pages/attendance/ImportAttendance'
import ManagePds from '../pages/pds/ManagePds'

export default function Routers() {
    return (
        <Routes>
          <Route path="/" element={<Landing />} />

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

          {/* Employee routes */}
          <Route path="/my-leave" element={
              <ProtectedRoute>
                  <MyLeave />
              </ProtectedRoute>
          } />

          <Route path="/profile" element={
              <ProtectedRoute>
                  <Profile />
              </ProtectedRoute>
          } />

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

          {/* HR/Admin routes */}
          <Route path="/manage-employees" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <ManageEmployees />
              </RoleProtectedRoute>
          } />

          <Route path="/manage-accounts" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <ManageAccount />
              </RoleProtectedRoute>
          } />

          <Route path="/system-settings" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <SystemSettingsPage />
              </RoleProtectedRoute>
          } />

          <Route path="/my-approval" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <MyApproval />
              </RoleProtectedRoute>
          } />

          <Route path="/manage-pds" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <ManagePds />
              </RoleProtectedRoute>
          } />

          <Route path="/manage-leave" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <ManageLeave />
              </RoleProtectedRoute>
          } />

          <Route path="/import-attendance" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <ImportAttendance />
              </RoleProtectedRoute>
          } />

          <Route path="/maintenance" element={<MaintenanceMode />} />

          <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
}
