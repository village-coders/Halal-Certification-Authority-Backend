import "./css/Header.css";
import logo from '../assets/hcaLogo.webp';
import { Link } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="logo">
        <Link to="/"><img src={logo} alt="Logo" /></Link>
      </div>

      {/* Hamburger Icon */}
      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <FaTimes /> : <FaBars />}
      </div>

      {/* Navigation */}
      <nav className={`nav-container ${menuOpen ? "open" : ""}`}>
        <ul >
          <li><a href="#">About</a></li>
          <li><a href="#">Certification Application</a></li>
          <li><a href="#">Trainings</a></li>
          <li><a href="#">Blog</a></li>
          <li><a href="#">Gallery</a></li>
          <li><a href="#">Contact Us</a></li>
          {/* <li><a href="#">Login/Register</a></li> */}
        </ul>
      </nav>
    </header>
  );
}

export default Header;
