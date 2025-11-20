import React from "react";

export default function Drawer({ menuOpen, goToDashboard, goToProfileSettings }) {
  if (!menuOpen) return null;

  return (
    <aside className="hr-menu-drawer">
      <nav className="hr-sidebar-nav">
        <button className="hr-nav-item" type="button" onClick={goToDashboard}>
          DASHBOARD
        </button>

        <button className="hr-nav-item" type="button" onClick={goToProfileSettings}>
          MY APPLICATION
        </button>

        <div className="hr-nav-select" onClick={goToProfileSettings}>
          <span>Profile Settings</span>
          <span className="hr-nav-caret">▾</span>
        </div>
      </nav>
    </aside>
  );
}
