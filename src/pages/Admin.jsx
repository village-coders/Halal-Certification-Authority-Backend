import { useState } from "react";
import "./css/Admin.css";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";


function Admin() {
  const [activeTab, setActiveTab] = useState("inProgress");

  const statsData = [
    { title: "CERTIFICATE", count: 3, icon: "fa-certificate", color: "#4caf50" },
    { title: "PRODUCTS", count: 7, icon: "fa-cube", color: "#2196f3" },
    { title: "APPLICATION", count: 8, icon: "fa-file-alt", color: "#ff9800" }
  ];

  const quickActions = [
    { title: "NEW APPLICATION", icon: "fa-plus-circle", color: "#4caf50" },
    { title: "RENEWAL APPLICATION", icon: "fa-sync-alt", color: "#2196f3" },
    { title: "SURVEILLANCE APPLICATION", icon: "fa-eye", color: "#ff9800" },
    { title: "ADD / REMOVE PRODUCT", icon: "fa-cubes", color: "#9c27b0" }
  ];

  const inProgressApps = [
    {
      date: "03-Nov-2021",
      number: "M2-0429/190000030653",
      category: "Annual Certification – UAE/GSO approved",
      site: "rashidnew"
    },
    {
      date: "15-Dec-2022",
      number: "M2-0429/1900000201542",
      category: "Initial Certification",
      site: "mainplant"
    }
  ];

  const certificates = [
    {
      siteName: "rashidnew",
      certRef: "LE-BU/QR230504014749",
      certType: "HCA Scheme",
      status: "Active"
    },
    {
      siteName: "mainplant",
      certRef: "LE-BU/QR230504014750",
      certType: "HCA Scheme",
      status: "Active"
    }
  ];

  return (
    <div className="dash">       
        <AdminSidebar activeD='active' /> 
        <main className="content">
            <div className="dashboard-container">
                {/* <div className="dashboard-header">
                    <h1>Dashboard</h1>
                    <div className="header-actions">
                    <button className="notification-btn">
                        <i className="fas fa-bell"></i>
                        <span className="notification-badge">3</span>
                    </button>
                    <button className="user-menu">
                        <i className="fas fa-user-circle"></i>
                    </button>
                    </div>
                </div> */}
                <AdminHeader /> 

                {/* Quick Actions */}
                <div className="quick-actions">
                    <h2>Quick Actions</h2>  
                    <div className="actions-grid">
                    {quickActions.map((action, index) => (
                        <div key={index} className="action-card" style={{ borderLeft: `4px solid ${action.color}` }}>
                        <div className="action-icon">
                            <i className={`fas ${action.icon}`} style={{ color: action.color }}></i>
                        </div>
                        <div className="action-content">
                            <h3>{action.title}</h3>
                            <button className="action-btn">Start</button>
                        </div>
                        </div>
                    ))}
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="stats-overview">
                    {statsData.map((stat, index) => (
                    <div key={index} className="stat-card">
                        <div className="stat-icon">
                        <i className={`fas ${stat.icon}`} style={{ color: stat.color }}></i>
                        </div>
                        <div className="stat-content">
                        <h3>{stat.title}</h3>
                        <p className="stat-count">{stat.count}</p>
                        </div>
                    </div>
                    ))}
                </div>

                {/* Applications Section */}
                <div className="applications-section">
                    <div className="section-header">
                    <h2>Applications</h2>
                    <div className="tabs">
                        <button 
                        className={`tab ${activeTab === "inProgress" ? "active" : ""}`}
                        onClick={() => setActiveTab("inProgress")}
                        >
                        IN-PROGRESS APPLICATIONS
                        </button>
                        <button 
                        className={`tab ${activeTab === "certificates" ? "active" : ""}`}
                        onClick={() => setActiveTab("certificates")}
                        >
                        CERTIFICATE LIST
                        </button>
                    </div>
                    </div>

                    <div className="section-content">
                    {activeTab === "inProgress" ? (
                        <div className="table-container">
                        <table>
                            <thead>
                            <tr>
                                <th>Date</th>
                                <th>Number</th>
                                <th>Category</th>
                                <th>Site</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {inProgressApps.map((app, index) => (
                                <tr key={index}>
                                <td>{app.date}</td>
                                <td>{app.number}</td>
                                <td>{app.category}</td>
                                <td>{app.site}</td>
                                <td>
                                    <button className="action-menu-btn">
                                    <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    ) : (
                        <div className="table-container">
                        <table>
                            <thead>
                            <tr>
                                <th>Site Name</th>
                                <th>Certificate Ref No</th>
                                <th>Certificate Type</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {certificates.map((cert, index) => (
                                <tr key={index}>
                                <td>{cert.siteName}</td>
                                <td>{cert.certRef}</td>
                                <td>{cert.certType}</td>
                                <td>
                                    <span className="status-badge active">{cert.status}</span>
                                </td>
                                <td>
                                    <button className="action-menu-btn">
                                    <i className="fas fa-ellipsis-v"></i>
                                    </button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                    </div>
                </div>
            </div>
        </main>
    </div>
  );
}

export default Admin;