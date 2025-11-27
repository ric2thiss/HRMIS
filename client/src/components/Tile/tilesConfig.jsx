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
    roles: ["admin"]
  },
  {
    title: "System Settings",
    link: "/system-settings",
    icon: <SettingsIcon />,
    roles: ["admin"]
  }
];
