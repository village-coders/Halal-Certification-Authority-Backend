import "./css/LoginCard.css";
import { useAuth } from '../hooks/useAuth';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function LoginCard() {
  const { signin, signingIn } = useAuth();
  const navigate = useNavigate();

  const defaultData = {
    email: "",
    password: ""
  };

  const [formData, setFormData] = useState(defaultData);

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    signin(formData, navigate);
  };

  return (
    <div className="login-card">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label>Email</label>
        <input 
          name="email"
          value={formData.email}
          onChange={handleInput} 
          type="email" 
          placeholder="Enter your email" 
          required 
        />

        <label>Password</label>
        <input 
          name="password"
          value={formData.password}
          onChange={handleInput} 
          type="password" 
          placeholder="Enter your password" 
          required 
        />

        <div className="options">
          <label>
            <input type="checkbox" /> Keep me logged in
          </label>
        </div>

        <button disabled={signingIn} type="submit">
          {signingIn ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="links">
          <a href="#">Forgot password?</a>
          <a href="#">Resend Activation Email?</a>
        </div>
      </form>
    </div>
  );
}

export default LoginCard;
