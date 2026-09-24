import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/login");
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <header className="navbar">
      <div className="navbar-container">

        {/* Logo */}

        <Link
          to="/notes"
          className="navbar-logo"
          onClick={closeMenu}
        >
          📚 CampusNotes
        </Link>


        {/* ============================= */}
        {/* DESKTOP NAVIGATION */}
        {/* ============================= */}

        <nav className="desktop-nav">

          <Link to="/notes">
            Notes
          </Link>

          <Link to="/upload">
            Upload
          </Link>

          <Link to="/my-notes">
            My Notes
          </Link>

          {/* Admin */}

          {(user?.role === "admin" ||
            user?.role === "master") && (
            <Link to="/admin">
              Admin
            </Link>
          )}

          {/* Master */}

          {user?.role === "master" && (
            <>
              <Link to="/master">
                Master
              </Link>

              <Link to="/master/users">
                Users
              </Link>

              <Link to="/master/admins">
                Admins
              </Link>

              <Link to="/master/subjects">
                Subjects
              </Link>
            </>
          )}

          {/* Manage Notes */}

          {(user?.role === "admin" ||
            user?.role === "master") && (
            <Link to="/admin/notes/manage">
              Manage Notes
            </Link>
          )}

          {/* Change Password */}

          <Link to="/change-password">
            Change Password
          </Link>

        </nav>


        {/* ============================= */}
        {/* DESKTOP USER */}
        {/* ============================= */}

        <div className="desktop-user">

          <span>
            👤 {user?.name}
          </span>

          <button onClick={handleLogout}>
            Logout
          </button>

        </div>


        {/* ============================= */}
        {/* MOBILE MENU BUTTON */}
        {/* ============================= */}

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>


      {/* ============================= */}
      {/* MOBILE NAVIGATION */}
      {/* ============================= */}

      {menuOpen && (
        <nav className="mobile-nav">

          <Link
            to="/notes"
            onClick={closeMenu}
          >
            📚 Notes
          </Link>

          <Link
            to="/upload"
            onClick={closeMenu}
          >
            📤 Upload Note
          </Link>

          <Link
            to="/my-notes"
            onClick={closeMenu}
          >
            📝 My Notes
          </Link>


          {/* Admin */}

          {(user?.role === "admin" ||
            user?.role === "master") && (
            <Link
              to="/admin"
              onClick={closeMenu}
            >
              🛡️ Admin Dashboard
            </Link>
          )}


          {/* Master */}

          {user?.role === "master" && (
            <>
              <Link
                to="/master"
                onClick={closeMenu}
              >
                👑 Master Dashboard
              </Link>

              <Link
                to="/master/users"
                onClick={closeMenu}
              >
                Users
              </Link>

              <Link
                to="/master/admins"
                onClick={closeMenu}
              >
                Admins
              </Link>

              <Link
                to="/master/subjects"
                onClick={closeMenu}
              >
                Subjects
              </Link>
            </>
          )}


          {/* Manage Notes */}

          {(user?.role === "admin" ||
            user?.role === "master") && (
            <Link
              to="/admin/notes/manage"
              onClick={closeMenu}
            >
              📝 Manage Notes
            </Link>
          )}


          {/* Change Password */}

          <Link
            to="/change-password"
            onClick={closeMenu}
          >
            🔐 Change Password
          </Link>


          {/* Logout */}

          <button onClick={handleLogout}>
            🚪 Logout
          </button>

        </nav>
      )}

    </header>
  );
}

export default Navbar;