import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/auth/ProtectedRoute";
import RoleProtectedRoute from "../components/auth/RoleProtectedRoute";
import GuestRoute from "../components/auth/GuestRoute";
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
import LeaveTracking from '../pages/leave/LeaveTracking'
import MyApproval from '../pages/approval/MyApproval'
import ImportAttendance from '../pages/attendance/ImportAttendance'
import ViewAttendance from '../pages/attendance/ViewAttendance'
import ManagePds from '../pages/pds/ManagePds'
import MasterLists from '../pages/masterLists/MasterLists'
import AdminDashboard from "../pages/adminDashboard/adminDashboard";
import HrDashboard from "../pages/hrDashboard/HrDashboard";
import LockedAccount from '../pages/lockedAccount/LockedAccount';
import ForceChangePassword from '../pages/forceChangePassword/ForceChangePassword';
import ManageAnnouncements from '../pages/announcement/ManageAnnouncements';
import AnnouncementArchive from '../pages/announcement/AnnouncementArchive';
import ViewAnnouncement from '../pages/announcement/ViewAnnouncement';
import MyAnnouncements from '../pages/announcement/MyAnnouncements';
import NotificationsList from '../pages/notifications/NotificationsList';
import NotificationDetail from '../pages/notifications/NotificationDetail';

export default function Routers() {
    return (
        <Routes>
          <Route path="/" element={<Landing />} />

          <Route path="/login" element={
              <GuestRoute>
                  <Login />
              </GuestRoute>
          } />

          {/* Locked account info page (public) */}
          <Route path="/locked-account" element={<LockedAccount />} />

          {/* Force change password page (protected, but accessible when password change required) */}
          <Route path="/force-change-password" element={
              <ProtectedRoute>
                  <ForceChangePassword />
              </ProtectedRoute>
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

          <Route path="/leave-application/:id/track" element={
              <ProtectedRoute>
                  <LeaveTracking />
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

          {/* HR only routes */}
          <Route path="/manage-employees" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <ManageEmployees />
              </RoleProtectedRoute>
          } />

          <Route path="/manage-accounts" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <ManageAccount />
              </RoleProtectedRoute>
          } />

          <Route path="/master-lists" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <MasterLists />
              </RoleProtectedRoute>
          } />

          <Route path="/my-approval" element={
              <ProtectedRoute>
                  <MyApproval />
              </ProtectedRoute>
          } />

          <Route path="/manage-pds" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <ManagePds />
              </RoleProtectedRoute>
          } />

          <Route path="/manage-leave" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <ManageLeave />
              </RoleProtectedRoute>
          } />

          <Route path="/import-attendance" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <ImportAttendance />
              </RoleProtectedRoute>
          } />

          <Route path="/view-attendance" element={
              <RoleProtectedRoute allowedRoles={['hr', 'admin']}>
                  <ViewAttendance />
              </RoleProtectedRoute>
          } />

          <Route path="/manage-announcements" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <ManageAnnouncements />
              </RoleProtectedRoute>
          } />

          <Route path="/announcements/archive" element={
              <RoleProtectedRoute allowedRoles={['hr']}>
                  <AnnouncementArchive />
              </RoleProtectedRoute>
          } />

          <Route path="/announcements/:id" element={
              <ProtectedRoute>
                  <ViewAnnouncement />
              </ProtectedRoute>
          } />

          <Route path="/my-announcements" element={
              <ProtectedRoute>
                  <MyAnnouncements />
              </ProtectedRoute>
          } />

          <Route path="/notifications" element={
              <ProtectedRoute>
                  <NotificationsList />
              </ProtectedRoute>
          } />

          <Route path="/notifications/:id" element={
              <ProtectedRoute>
                  <NotificationDetail />
              </ProtectedRoute>
          } />

          {/* Admin only routes */}
          <Route path="/system-settings" element={
              <RoleProtectedRoute allowedRoles={['admin']}>
                  <SystemSettingsPage />
              </RoleProtectedRoute>
          } />

          <Route path="/hr/dashboard" element={
            <RoleProtectedRoute allowedRoles={["hr"]}>
                <HrDashboard />
            </RoleProtectedRoute>
          }/>

          <Route path="/admin/dashboard" element={
            <RoleProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
            </RoleProtectedRoute>
          }/>

          <Route path="/maintenance" element={<MaintenanceMode />} />

          <Route path="*" element={<PageNotFound />} />
        </Routes>
    );
}
