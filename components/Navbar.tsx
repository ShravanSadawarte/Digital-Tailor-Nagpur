"use client";

import { useState } from "react";

type Props = {
  userEmail: string | null;
  onLogin: () => void;
  onSignup: () => void;
  onLogout: () => void;
};

export default function Navbar({
  userEmail,
  onLogin,
  onSignup,
  onLogout,
}: Props) {
  const [open, setOpen] = useState(false);

  const authButtons = userEmail ? (
    <>
      <span className="user-email" title={userEmail}>
        👋 {userEmail}
      </span>
      <button className="btn btn-outline" onClick={onLogout}>
        Logout
      </button>
    </>
  ) : (
    <>
      <button className="btn btn-outline" onClick={onLogin}>
        Login
      </button>
      <button className="btn btn-primary" onClick={onSignup}>
        Sign Up
      </button>
    </>
  );

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <a href="#home" className="logo">
          <span className="logo-icon">✂️</span>
          <span className="logo-text">
            Digital Tailor <small>Nagpur</small>
          </span>
        </a>

        <nav className="nav-links">
          <a href="#home" className="active">
            Home
          </a>
          <a href="#services">Services</a>
          <a href="#booking">Booking</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="nav-actions">{authButtons}</div>

        <button
          className="hamburger"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <div className={`mobile-menu${open ? " open" : ""}`}>
        <a href="#home" className="active" onClick={() => setOpen(false)}>
          Home
        </a>
        <a href="#services" onClick={() => setOpen(false)}>
          Services
        </a>
        <a href="#booking" onClick={() => setOpen(false)}>
          Booking
        </a>
        <a href="#contact" onClick={() => setOpen(false)}>
          Contact
        </a>
        <div className="mobile-actions">
          {userEmail ? (
            <button
              className="btn btn-outline"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
            >
              Logout ({userEmail})
            </button>
          ) : (
            <>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setOpen(false);
                  onLogin();
                }}
              >
                Login
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setOpen(false);
                  onSignup();
                }}
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
