import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import './VerticalNav.css'
const VerticalNav = ({ isCollapsed, toggleNavbar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <nav className={`vertical-navbar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Logo Section */}
      <div className="logo-section">
        <div className={`logo ${isCollapsed ? "logo-collapsed" : "logo-expanded"}`}>
          <span className="logo-text">SE</span>
        </div>
      </div>

      {/* Navbar Links */}
      <ul className="nav-links">
        <li>
          <NavLink to="/home/homeComp" end className={({ isActive }) => (isActive ? "active-link" : "")}>
            <button className="nav-btn">
              <i className="fas fa-home"></i>
              {!isCollapsed && <span className="nav-text">Home</span>}
            </button>
          </NavLink>
        </li>
        <li>
          <NavLink to="/home/add-gestures" className={({ isActive }) => (isActive ? "active-link" : "")}>
            <button className="nav-btn">
              <i className="fas fa-hand-paper"></i>
              {!isCollapsed && <span className="nav-text">Add Gestures</span>}
            </button>
          </NavLink>
        </li>
        <li>
          <NavLink to="/home/video-calling" className={({ isActive }) => (isActive ? "active-link" : "")}>
            <button className="nav-btn">
              <i className="fas fa-video"></i>
              {!isCollapsed && <span className="nav-text">Video Calling</span>}
            </button>
          </NavLink>
        </li>
        <li>
          <NavLink to="/home/video-recording" className={({ isActive }) => (isActive ? "active-link" : "")}>
            <button className="nav-btn">
              <i className="fas fa-record-vinyl"></i>
              {!isCollapsed && <span className="nav-text">Video Recording</span>}
            </button>
          </NavLink>
        </li>
        <li>
          <NavLink to="/home/real-time-translation" className={({ isActive }) => (isActive ? "active-link" : "")}>
            <button className="nav-btn">
              <i className="fas fa-language"></i>
              {!isCollapsed && <span className="nav-text">Real-time Translation</span>}
            </button>
          </NavLink>
        </li>
      </ul>

      {/* Collapse/Expand Button */}
      <button className="toggle-navbar-btn" onClick={toggleNavbar}>
        {isCollapsed ? ">>" : "<<"}
      </button>

      {/* Logout Button */}
      <div className="logout-button" onClick={handleLogout}>
        <button className="logout-btn">
          <i className="fas fa-sign-out-alt"></i>
          {!isCollapsed && <span className="logout-text">Logout</span>}
        </button>
      </div>
    </nav>
  );
};

export default VerticalNav;
