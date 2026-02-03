import { useState, useEffect } from "react";
import "./css/Applications.css";
import Sidebar from "../components/Sidebar";

const sampleApplications = [
  {
    date: "27-Apr-2023",
    number: "M2-0429/1900000100775",
    category: "Annual Certification – Food and General processing",
    status: "Submitted",
    site: "rashidnew"
  },
  {
    date: "03-Nov-2021",
    number: "M2-0429/190000030653",
    category: "Annual Certification – Food and General processing",
    status: "In-Progress",
    site: "Mushtaq"
  },
  {
    date: "15-Dec-2022",
    number: "M2-0429/1900000201542",
    category: "Initial Certification",
    status: "Approved",
    site: "mainplant"
  },
  {
    date: "08-Mar-2023",
    number: "M2-0429/1900000100987",
    category: "Surveillance Audit",
    status: "Rejected",
    site: "distribution"
  }
];

// Application categories for the form
const applicationCategories = [
  "Initial Certification",
  "Annual Certification – Food and General processing",
  "Surveillance Audit",
  "Recertification",
  "Extension of Scope",
  "Renewal Application"
];

// Sites for the form
const sites = [
  "mainplant",
  "distribution",
  "rashidnew",
  "Mushtaq",
  "warehouse"
];

// Existing applications for renewal (would come from API in real app)
const existingApplications = [
  { number: "M2-0429/1900000100775", category: "Annual Certification", site: "rashidnew", expiryDate: "2024-04-27" },
  { number: "M2-0429/190000030653", category: "Food Processing", site: "Mushtaq", expiryDate: "2024-11-03" },
  { number: "M2-0429/1900000201542", category: "Initial Certification", site: "mainplant", expiryDate: "2024-12-15" }
];

function Applications() {
  const [searchNumber, setSearchNumber] = useState("");
  const [searchDate, setSearchDate] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showFilters, setShowFilters] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showRenewalForm, setShowRenewalForm] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    site: "",
    description: ""
  });
  const [renewalData, setRenewalData] = useState({
    existingApplication: "",
    renewalDate: "",
    reason: "",
    attachments: []
  });

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

  const filtered = sampleApplications.filter(app =>
    app.number.toLowerCase().includes(searchNumber.toLowerCase()) &&
    (searchDate ? app.date.includes(searchDate) : true)
  );

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const handleNewApplication = () => {
    setShowApplicationForm(true);
    setShowRenewalForm(false);
  };

  const handleRenewApplication = () => {
    setShowRenewalForm(true);
    setShowApplicationForm(false);
  };

  const handleCloseForm = () => {
    setShowApplicationForm(false);
    setShowRenewalForm(false);
    setFormData({
      category: "",
      site: "",
      description: ""
    });
    setRenewalData({
      existingApplication: "",
      renewalDate: "",
      reason: "",
      attachments: []
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRenewalInputChange = (e) => {
    const { name, value } = e.target;
    setRenewalData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setRenewalData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index) => {
    setRenewalData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Application submitted:", formData);
    
    // For demo purposes, we'll just close the form and reset
    alert("Application submitted successfully!");
    handleCloseForm();
  };

  const handleRenewalSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the renewal data to your backend
    console.log("Renewal application submitted:", renewalData);
    
    // For demo purposes, we'll just close the form and reset
    alert("Renewal application submitted successfully!");
    handleCloseForm();
  };

  const getSelectedApplication = () => {
    return existingApplications.find(app => app.number === renewalData.existingApplication);
  };

  return (
    <div className="dash">
      <Sidebar activeApp='active' />
      <main className="content">
        <div className="manage-applications">
          <div className="header">
            <h2>Manage Applications</h2>
            <div className="header-actions">
              <button className="renew-btn" onClick={handleRenewApplication}>
                <i className="fas fa-sync-alt"></i> Renew Application
              </button>
              <button className="new-btn" onClick={handleNewApplication}>
                + New Application
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
              <label>Application Number</label>
              <input
                type="text"
                placeholder="Enter number..."
                value={searchNumber}
                onChange={(e) => setSearchNumber(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Application Date</label>
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
              <h3>Applications List (Total: {filtered.length})</h3>
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
                    <th>Date</th>
                    <th>Application Number</th>
                    <th>Application Category</th>
                    <th>Status</th>
                    <th>Site</th>
                    <th>Menu</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app, i) => (
                    <tr key={i}>
                      <td>{app.date}</td>
                      <td>{app.number}</td>
                      <td>{app.category}</td>
                      <td>
                        <span className={`status ${app.status.toLowerCase().replace(" ", "-")}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>{app.site}</td>
                      <td>
                        <button className="menu-btn">⋮</button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="6" className="no-data">No applications found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              /* Mobile Cards */
              <div className="mobile-cards">
                {filtered.length > 0 ? (
                  filtered.map((app, i) => (
                    <div key={i} className="application-card">
                      <div className="card-header">
                        <div className="app-number">{app.number}</div>
                        <button className="menu-btn">⋮</button>
                      </div>
                      <div className="card-details">
                        <div className="detail-item">
                          <span className="label">Date:</span>
                          <span className="value">{app.date}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Category:</span>
                          <span className="value">{app.category}</span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Status:</span>
                          <span className={`status ${app.status.toLowerCase().replace(" ", "-")}`}>
                            {app.status}
                          </span>
                        </div>
                        <div className="detail-item">
                          <span className="label">Site:</span>
                          <span className="value">{app.site}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">No applications found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* New Application Form Modal */}
        {showApplicationForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>New Application</h3>
                <button className="close-btn" onClick={handleCloseForm}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="application-form">
                <div className="form-group">
                  <label htmlFor="category">Application Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {applicationCategories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="site">Site *</label>
                  <select
                    id="site"
                    name="site"
                    value={formData.site}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Site</option>
                    {sites.map((site, index) => (
                      <option key={index} value={site}>
                        {site}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Enter any additional details about your application..."
                  ></textarea>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={handleCloseForm}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Renewal Application Form Modal */}
        {showRenewalForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Renew Application</h3>
                <button className="close-btn" onClick={handleCloseForm}>
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              <form onSubmit={handleRenewalSubmit} className="application-form">
                <div className="form-group">
                  <label htmlFor="existingApplication">Select Application to Renew *</label>
                  <select
                    id="existingApplication"
                    name="existingApplication"
                    value={renewalData.existingApplication}
                    onChange={handleRenewalInputChange}
                    required
                  >
                    <option value="">Select Application</option>
                    {existingApplications.map((app, index) => (
                      <option key={index} value={app.number}>
                        {app.number} - {app.category} ({app.site}) - Expires: {app.expiryDate}
                      </option>
                    ))}
                  </select>
                </div>

                {renewalData.existingApplication && (
                  <div className="application-info">
                    <h4>Application Details</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">Category:</span>
                        <span className="info-value">{getSelectedApplication()?.category}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Site:</span>
                        <span className="info-value">{getSelectedApplication()?.site}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Expiry Date:</span>
                        <span className="info-value">{getSelectedApplication()?.expiryDate}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="renewalDate">Requested Renewal Date *</label>
                  <input
                    type="date"
                    id="renewalDate"
                    name="renewalDate"
                    value={renewalData.renewalDate}
                    onChange={handleRenewalInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="reason">Reason for Renewal *</label>
                  <select
                    id="reason"
                    name="reason"
                    value={renewalData.reason}
                    onChange={handleRenewalInputChange}
                    required
                  >
                    <option value="">Select Reason</option>
                    <option value="continuing_operations">Continuing Operations</option>
                    <option value="contract_requirement">Contract Requirement</option>
                    <option value="regulatory_compliance">Regulatory Compliance</option>
                    <option value="business_expansion">Business Expansion</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {renewalData.reason === 'other' && (
                  <div className="form-group">
                    <label htmlFor="otherReason">Specify Other Reason *</label>
                    <textarea
                      id="otherReason"
                      name="otherReason"
                      rows="3"
                      placeholder="Please specify the reason for renewal..."
                    ></textarea>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="attachments">Supporting Documents</label>
                  <div className="file-upload">
                    <input
                      type="file"
                      id="attachments"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    <label htmlFor="attachments" className="file-upload-label">
                      <i className="fas fa-cloud-upload-alt"></i>
                      Choose Files
                    </label>
                    <small>Supported formats: PDF, DOC, JPG, PNG (Max 10MB each)</small>
                  </div>

                  {renewalData.attachments.length > 0 && (
                    <div className="attachments-list">
                      <h5>Selected Files:</h5>
                      {renewalData.attachments.map((file, index) => (
                        <div key={index} className="attachment-item">
                          <span className="file-name">
                            <i className="fas fa-file"></i> {file.name}
                          </span>
                          <button
                            type="button"
                            className="remove-file"
                            onClick={() => removeAttachment(index)}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="renewal-notice">
                  <i className="fas fa-info-circle"></i>
                  <p>
                    <strong>Important:</strong> Renewal applications should be submitted at least 
                    30 days before the expiry date. Late submissions may incur additional fees.
                  </p>
                </div>

                <div className="form-actions">
                  <button type="button" className="cancel-btn" onClick={handleCloseForm}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn">
                    <i className="fas fa-sync-alt"></i> Submit Renewal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Applications;