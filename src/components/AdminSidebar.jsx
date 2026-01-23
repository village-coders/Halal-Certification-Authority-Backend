import { useState, useEffect } from "react";
import "./css/Sidebar.css";
import logo from '../assets/hcaLogo.webp';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const AdminSidebar = ({activeD, activeApp, activeP}) => {
  const [openMenu, setOpenMenu] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const navigate = useNavigate();

  const {logout} = useAuth();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 900;
      setIsMobile(mobile);
      // Auto-collapse sidebar when switching to mobile
      if (mobile) {
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? "" : menu);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setOpenMenu("");
    }
  };


  return (
    <>
      {/* Mobile overlay when sidebar is expanded on mobile */}
      {isMobile && !isCollapsed && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}
      
      <aside className={`sidebar ${isCollapsed ? "collapsed" : ""} ${isMobile ? "mobile" : ""}`}>
        <div className="sidebar-header">
          <div className="side-logo">
            {(!isCollapsed || isMobile) && <img src={logo} alt="HCA Logo" />}
            {(!isCollapsed || isMobile) && <h2>HCA Portal</h2>}
          </div>
          <button className="hamburger-btn" onClick={toggleSidebar}>
            <i className={`fas ${isCollapsed ? "fa-bars" : "fa-times"}`}></i>
          </button>
        </div>

        <nav className={`sidebar-nav ${isMobile && !isCollapsed ? "mobile-expanded" : ""}`}>
          <ul>
            <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/dashboard')}} className={`dropdown-btn ${activeD}`} title="Dashboard">
                <i className="fas fa-home"></i>
                {!isCollapsed && <span>Dashboard</span>}
              </button>
            </li>

            <li className="has-submenu">
              <button
                className={`dropdown-btn ${openMenu === "applications" ? "active" : ""} ${activeApp}`}
                onClick={() => toggleMenu("applications")}
                title="Applications"
              >
                <i className="fas fa-file-alt"></i>
                {!isCollapsed && (
                  <>
                    <span>Applications</span>
                    <i className={`dropdown-arrow fas ${openMenu === "applications" ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  </>
                )}
              </button>
              {!isCollapsed && openMenu === "applications" && (
                <ul onClick={isMobile ? toggleSidebar : undefined} className="submenu">
                  <li><a href="#"><i className="fas fa-tasks"></i> <span>Manage Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-plus-circle"></i> <span>New Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-sync-alt"></i> <span>Renewal Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-eye"></i> <span>Surveillance Applications</span></a></li>
                  <li><a href="#"><i className="fas fa-exclamation-triangle"></i> <span>Rejected / On-Hold</span></a></li>
                </ul>
              )}
            </li>

            <li className="has-submenu">
              <button
                className={`dropdown-btn ${openMenu === "certificate" ? "active" : ""}`}
                onClick={() => toggleMenu("certificate")}
                title="Certificate"
              >
                <i className="fas fa-certificate"></i>
                {!isCollapsed && (
                  <>
                    <span>Certificate</span>
                    <i className={`dropdown-arrow fas ${openMenu === "certificate" ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  </>
                )}
              </button>
              {!isCollapsed && openMenu === "certificate" && (
                <ul onClick={isMobile ? toggleSidebar : undefined} className="submenu">
                  <li><a href="#"><i className="fas fa-search"></i> <span>View Certificates</span></a></li>
                  <li><a href="#"><i className="fas fa-download"></i> <span>Download</span></a></li>
                </ul>
              )}
            </li>

            <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/products')}} className={`dropdown-btn ${openMenu === "products" ? "active" : ""} ${activeP}`} title="Products">
                <i className="fas fa-cube"></i>
                {!isCollapsed && <span>Products</span>}
              </button>
            </li>
            <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/export')}} className="dropdown-btn" title="Export">
                <i className="fas fa-globe"></i>
                {!isCollapsed && <span>Export</span>}
              </button>
            </li>
            <li>
              <button onClick={isMobile ? toggleSidebar : undefined} className="dropdown-btn" title="Messages">
                <i className="fas fa-envelope"></i>
                {!isCollapsed && (
                  <>
                    <span>Messages</span>
                    <span className="badge">3</span>
                  </>
                )}
              </button>            
            </li>
            <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/manage-user')}} className="dropdown-btn" title="Manage Users">
                <i className="fas fa-users"></i>
                {!isCollapsed && <span>Manage Users</span>}
              </button>
            </li>
            <li>
              <button onClick={() =>{ if (isMobile) toggleSidebar();  navigate('/manage-site')}} className="dropdown-btn" title="Manage Sites">
                <i className="fas fa-building"></i>
                {!isCollapsed && <span>Manage Sites</span>}
              </button>
            </li>
          </ul>
        </nav>
        
        {!isMobile && (
          <div className="sidebar-footer">
            {!isCollapsed && (
              <button
                onClick={() =>{ if (isMobile) toggleSidebar();  logout()}}
                className="logout-btn dropdown-btn"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
                {!isCollapsed && <span>Logout</span>}
              </button>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

export default AdminSidebar;