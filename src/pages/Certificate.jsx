import { useState, useEffect } from "react";
import "./css/Certificate.css"; // Using the same CSS file
import Sidebar from "../components/Sidebar";

const sampleCertificates = [
  {
    id: "CERT-2024-001",
    date: "15-May-2024",
    number: "M2-0429/240000100775",
    category: "Food Safety Certification",
    status: "Active",
    site: "mainplant",
    standard: "ISO 22000:2018",
    expiryDate: "14-May-2025"
  },
  {
    id: "CERT-2024-002",
    date: "20-Apr-2024",
    number: "M2-0429/240000200891",
    category: "Quality Management System",
    status: "Active",
    site: "distribution",
    standard: "ISO 9001:2015",
    expiryDate: "19-Apr-2025"
  },
  {
    id: "CERT-2024-003",
    date: "10-Dec-2023",
    number: "M2-0429/230000300456",
    category: "Environmental Management",
    status: "Expiring Soon",
    site: "rashidnew",
    standard: "ISO 14001:2015",
    expiryDate: "09-Dec-2024"
  },
  {
    id: "CERT-2024-004",
    date: "05-Aug-2023",
    number: "M2-0429/230000400123",
    category: "Occupational Health & Safety",
    status: "Expired",
    site: "Mushtaq",
    standard: "ISO 45001:2018",
    expiryDate: "04-Aug-2024"
  },
  {
    id: "CERT-2024-005",
    date: "01-Mar-2024",
    number: "M2-0429/240000500567",
    category: "Food Safety Certification",
    status: "Suspended",
    site: "warehouse",
    standard: "HACCP",
    expiryDate: "28-Feb-2025"
  }
];

const certificateCategories = [
  "Food Safety Certification",
  "Quality Management System",
  "Environmental Management",
  "Occupational Health & Safety",
  "Halal Certification",
  "Organic Certification"
];

const sites = [
  "mainplant",
  "distribution",
  "rashidnew",
  "Mushtaq",
  "warehouse"
];

function Certificate() {
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 900);
      if (window.innerWidth >= 900) {
        setShowFilters(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredCertificates = sampleCertificates.filter(cert =>
    cert.number.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? cert.date.includes(searchDate) : true)
  );

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleViewCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateModal(true);
  };

  const handleDownloadCertificate = (certificate) => {
    alert(`Downloading certificate: ${certificate.number}`);
    // In real app, this would trigger file download
  };

  const handleRenewCertificate = (certificate) => {
    alert(`Initiating renewal for: ${certificate.number}`);
    // In real app, this would navigate to renewal form
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Active': 'approved',
      'Expiring Soon': 'in-progress',
      'Expired': 'rejected',
      'Suspended': 'submitted'
    };
    return statusMap[status] || 'submitted';
  };

  return (
    <div className="dash">
      <Sidebar activeCert='active' />
      <main style={{maxWidth: "920px"}} className="content">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Certificates</h2>
            <div className="header-actions">
              <button className="renew-btn" onClick={() => alert('Export all certificates')}>
                <i className="fas fa-file-export"></i> Export Certificates
              </button>
              <button className="new-btn" onClick={() => alert('Generate new certificate')}>
                <i className="fas fa-file-certificate"></i> Generate Certificate
              </button>
            </div>
          </div>

          {/* Mobile filter toggle */}
          {isMobile && (
            <button className="filter-toggle" onClick={toggleFilters}>
              <i className="fas fa-filter"></i> {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          )}

          <div className={`search-box ${showFilters ? 'mobile-visible' : ''}`}>
            <div className="field">
              <label>Certificate Number</label>
              <input
                type="text"
                placeholder="Enter certificate number..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Issue Date</label>
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </div>
            <button className="search-btn">Search</button>
            {isMobile && (
              <button className="close-filters" onClick={() => setShowFilters(false)}>
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>

          <div className="table-wrapper">
            <div className="table-header">
              <h3>Certificates List (Total: {filteredCertificates.length})</h3>
              {isMobile && (
                <div className="table-actions">
                  <button className="action-btn" title="Export">
                    <i className="fas fa-download"></i>
                  </button>
                  <button className="action-btn" title="Refresh">
                    <i className="fas fa-sync-alt"></i>
                  </button>
                </div>
              )}
            </div>
            
            {/* Desktop Table */}
            {!isMobile ? (
              <table className="desktop-table">
                <thead>
                  <tr>
                    <th>Issue Date</th>
                    <th>Certificate Number</th>
                    <th>Certificate Type</th>
                    <th>Standard</th>
                    <th>Status</th>
                    <th>Site</th>
                    <th>Expiry Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id}>
                      <td>{cert.date}</td>
                      <td>
                        <strong className="app-number">{cert.number}</strong>
                      </td>
                      <td>{cert.category}</td>
                      <td>
                        <span className="status submitted" style={{fontSize: '11px', padding: '3px 8px'}}>
                          {cert.standard}
                        </span>
                      </td>
                      <td>
                        <span className={`status ${getStatusClass(cert.status)}`}>
                          {cert.status}
                        </span>
                      </td>
                      <td>{cert.site}</td>
                      <td>{cert.expiryDate}</td>
                      <td>
                        <div style={{display: 'flex', gap: '8px'}}>
                          <button 
                            className="menu-btn"
                            onClick={() => handleViewCertificate(cert)}
                            title="View Certificate"
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="menu-btn"
                            onClick={() => handleDownloadCertificate(cert)}
                            title="Download Certificate"
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          {(cert.status === 'Active' || cert.status === 'Expiring Soon') && (
                            <button 
                              className="menu-btn"
                              onClick={() => handleRenewCertificate(cert)}
                              title="Renew Certificate"
                            >
                              <i className="fas fa-sync-alt"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredCertificates.length === 0 && (
                    <tr>
                      <td colSpan="8" className="no-data">No certificates found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Mobile Cards */
              <div className="mobile-cards">
                {filteredCertificates.length > 0 ? (
                  filteredCertificates.map((cert) => (
                    <div key={cert.id} className="application-card">
                      <div className="card-header">
                        <div className="app-number">{cert.number}</div>
                        <div style={{display: 'flex', gap: '5px'}}>
                          <button 
                            className="menu-btn"
                            onClick={() => handleViewCertificate(cert)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                          <button 
                            className="menu-btn"
                            onClick={() => handleDownloadCertificate(cert)}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                        </div>
                      </div>
                      <div className="card-details">
                        <div className="detail-item">
                          <span className="label">Issue Date:</span>
                          <span className="value">{cert.date}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Type:</span>
                          <span className="value">{cert.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Standard:</span>
                          <span className="value">{cert.standard}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className={`status ${getStatusClass(cert.status)}`}>
                            {cert.status}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Site:</span>
                          <span className="value">{cert.site}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Expiry Date:</span>
                          <span className="value">{cert.expiryDate}</span>
                        </div>
                        {(cert.status === 'Active' || cert.status === 'Expiring Soon') && (
                          <div className="detail-item">
                            <button 
                              className="new-btn"
                              style={{width: '100%', marginTop: '10px', padding: '8px'}}
                              onClick={() => handleRenewCertificate(cert)}
                            >
                              <i className="fas fa-sync-alt"></i> Renew Certificate
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No certificates found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Certificate Detail Modal */}
        {showCertificateModal && selectedCertificate && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Certificate Details</h3>
                <button className="close-btn" onClick={() => setShowCertificateModal(false)}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <div className="application-form">
                <div className="form-group">
                  <label>Certificate Number</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    {selectedCertificate.number}
                  </div>
                </div>

                <div className="form-group">
                  <label>Certificate Type</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    {selectedCertificate.category}
                  </div>
                </div>

                <div className="form-group">
                  <label>Standard</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    {selectedCertificate.standard}
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    <span className={`status ${getStatusClass(selectedCertificate.status)}`}>
                      {selectedCertificate.status}
                    </span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Site</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    {selectedCertificate.site}
                  </div>
                </div>

                <div className="form-group">
                  <label>Issue Date</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    {selectedCertificate.date}
                  </div>
                </div>

                <div className="form-group">
                  <label>Expiry Date</label>
                  <div style={{
                    padding: '10px 12px',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px',
                    background: '#f8f9fa',
                    fontSize: '14px'
                  }}>
                    {selectedCertificate.expiryDate}
                  </div>
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="cancel-btn" 
                    onClick={() => setShowCertificateModal(false)}
                  >
                    Close
                  </button>
                  <button 
                    type="button" 
                    className="submit-btn"
                    onClick={() => handleDownloadCertificate(selectedCertificate)}
                  >
                    <i className="fas fa-download"></i> Download Certificate
                  </button>
                  {(selectedCertificate.status === 'Active' || selectedCertificate.status === 'Expiring Soon') && (
                    <button 
                      type="button" 
                      className="renew-btn"
                      onClick={() => handleRenewCertificate(selectedCertificate)}
                    >
                      <i className="fas fa-sync-alt"></i> Renew Certificate
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Certificate;