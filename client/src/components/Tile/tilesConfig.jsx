// tilesConfig.js
import ApprovalIcon from '../../asset/icons/Approval'
import ManageEmployeeIcon from '../../asset/icons/ManageEmployee'
import PDSIcon from '../../asset/icons/Pds'
import DTRIcon from '../../asset/icons/Dtr'
import ImportIcon from '../../asset/icons/ImportAttendance'
import LeaveIcon from '../../asset/icons/ManageLeave'
import MyLeaveIcon from '../../asset/icons/MyLeave'
import ManageAccountIcon from '../../asset/icons/ManageAccount'
import SettingsIcon from '../../asset/icons/SystemSettings'
import AnnouncementIcon from '../../asset/icons/Announcement'

export const tilesConfig = [
  {
    title: "My Approval",
    link: "/my-approval",
    icon: <ApprovalIcon />,
    roles: ["hr"]
  },
  {
    title: "Manage Employee",
    link: "/manage-employees",
    icon: <ManageEmployeeIcon />,
    roles: ["hr"]
  },
  {
    title: "My PDS",
    link: "/my-pds",
    icon: <PDSIcon />,
    roles: ["hr", "employee", "admin"]
  },
  {
    title: "Manage PDS",
    link: "/manage-pds",
    icon: <PDSIcon />,
    roles: ["hr"]
  },
  {
    title: "My DTR",
    link: "/my-dtr",
    icon: <DTRIcon />,
    roles: ["hr", "employee", "admin"]
  },
  {
    title: "Import Attendance",
    link: "/import-attendance",
    icon: <ImportIcon />,
    roles: ["hr"]
  },
  {
    title: "View Attendance",
    link: "/view-attendance",
    icon: <DTRIcon />,
    roles: ["hr", "admin"]
  },
  {
    title: "Manage Leave Application",
    link: "/manage-leave",
    icon: <LeaveIcon />,
    roles: ["hr"]
  },
  {
    title: "My Leave",
    link: "/my-leave",
    icon: <MyLeaveIcon />,
    roles: ["hr", "employee", "admin"]
  },
  {
    title: "Manage Account",
    link: "/manage-accounts",
    icon: <ManageAccountIcon />,
    roles: ["hr"]
  },
  {
    title: "System Settings",
    link: "/system-settings",
    icon: <SettingsIcon />,
    roles: ["admin"] // Admin only
  },
  {
    title: "Master Lists",
    link: "/master-lists",
    icon: <SettingsIcon />,
    roles: ["hr"] // HR only
  },
  {
    title: "Manage Announcements",
    link: "/manage-announcements",
    icon: <AnnouncementIcon />,
    roles: ["hr"] // HR only
  },
  {
    title: "My Announcements",
    link: "/my-announcements",
    icon: <AnnouncementIcon />,
    roles: ["hr", "employee", "admin"] // All users
  }
];
