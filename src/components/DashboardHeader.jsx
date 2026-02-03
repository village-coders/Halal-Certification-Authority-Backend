import { useState, useEffect, useRef } from "react";
import './css/DashboardHeader.css'
import { useAuth } from "../hooks/useAuth";

const DashboardHeader = () => {
  const [openMenu, setOpenMenu] = useState(false);

  const toggleMenu = () => setOpenMenu((prev) => !prev);
  const menuRef = useRef(null);
  const {user, userLoading, logout} = useAuth();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="dashboard-header">
      <h1>Dashboard</h1>
      <div className="header-actions">
        <button className="notification-btn">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">3</span>
        </button>

        {/* User menu button */}
        <div className="user-menu-container" ref={menuRef}>
          <button className="user-menu" onClick={toggleMenu}>
            <i className="fas fa-user-circle"></i>
            <i className={`dropdown-arrow fas ${openMenu ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
          </button>

          {/* Dropdown */}
          {openMenu && (
            <div className="user-dropdown">
              <div className="user-info">
                <h3>{userLoading ?  "loading.." : user.companyName}</h3>
                <span className="status">Online</span>
                <button onClick={logout} className="logout-btn">Logout</button>
              </div>
              <hr />
              <div className="user-options">
                <p>PROFILE</p>
                <button className="profile-menu">Company Profile</button>
                <button className="profile-menu">Change Organization Name</button>
                <button className="profile-menu">Contact Details</button>
              </div>
              <hr />
              <button className="messages-btn">Messages</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
