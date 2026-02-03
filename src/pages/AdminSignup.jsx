import { useState } from "react";
import "./css/AdminSignup.css";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { toast } from "sonner";

function AdminSignup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    agreeToTerms: false
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) newErrors.fullName = 'First name is required';
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.contact.trim()) {
        newErrors.contact = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.contact.replace(/[\s\-\(\)]/g, ''))) {
        newErrors.contact = 'Phone number is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const res = await axios.post(`${baseUrl}/auth/signup`, formData);
      const data = res.data;
      console.log(data);
      
      toast.success(data.message);
      if (data.status === 'success') {
        navigate('/admin-signin'); // Redirect to admin dashboard
      }
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ submit: error.message || 'Failed to create account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, label: '', color: '' };
    
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    const strengths = [
      { label: 'Very Weak', color: '#ff4d4f' },
      { label: 'Weak', color: '#ff7875' },
      { label: 'Fair', color: '#ffc53d' },
      { label: 'Good', color: '#73d13d' },
      { label: 'Strong', color: '#52c41a' },
      { label: 'Very Strong', color: '#389e0d' }
    ];
    
    return strengths[Math.min(strength, 5)];
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="admin-signup-container">
      <div className="admin-signup-card">
        <div className="signup-header">
          <div className="logo">
            <i className="fas fa-shield-alt"></i>
            <h1>HCA Portal</h1>
          </div>
          <h2>Create Admin Account</h2>
          <p>Setup your administrator account to manage the HCA portal</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {errors.submit && (
            <div className="error-message submit-error">
              <i className="fas fa-exclamation-circle"></i>
              {errors.submit}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={errors.fullName ? 'error' : ''}
                placeholder="Enter your full name"
              />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="Enter email address"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleChange}
                className={errors.contact ? 'error' : ''}
                placeholder="Enter phone number"
              />
              {errors.contact && <span className="error-text">{errors.contact}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <div className="password-input-container">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Create a strong password"
              />
              {formData.password && (
                <div className="password-strength">
                  <div 
                    className="strength-meter"
                    style={{ 
                      width: `${(passwordStrength.strength / 5) * 100}%`,
                      backgroundColor: passwordStrength.color
                    }}
                  ></div>
                  <span className="strength-label">{passwordStrength.label}</span>
                </div>
              )}
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}
            <div className="password-requirements">
              <p>Password must contain:</p>
              <ul>
                <li className={formData.password.length >= 8 ? 'met' : ''}>At least 8 characters</li>
                <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>One lowercase letter</li>
                <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>One uppercase letter</li>
                <li className={/[0-9]/.test(formData.password) ? 'met' : ''}>One number</li>
              </ul>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={errors.confirmPassword ? 'error' : ''}
              placeholder="Confirm your password"
            />
            {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
          </div>


          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={handleChange}
                className={errors.agreeToTerms ? 'error' : ''}
              />
              <span className="checkmark"></span>
              I agree to the <a href="#">Terms and Conditions</a> and <a href="#">Privacy Policy</a>
            </label>
            {errors.agreeToTerms && <span className="error-text">{errors.agreeToTerms}</span>}
          </div>

          <button 
            type="submit" 
            className="signup-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Creating Account...
              </>
            ) : (
              <>
                <i className="fas fa-user-plus"></i>
                Create Admin Account
              </>
            )}
          </button>

          <div className="login-link">
            Already have an account? <Link to="/admin-singin">Sign in here</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminSignup;