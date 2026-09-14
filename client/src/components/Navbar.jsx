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


        {/* Desktop Navigation */}

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

          {user?.role === "admin" && (
            <Link to="/admin">
              Admin
            </Link>
          )}

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

          {(user?.role === "admin" ||
            user?.role === "master") && (
            <Link to="/admin/notes/manage">
              Manage Notes
            </Link>
          )}

        </nav>


        {/* Desktop User */}

        <div className="desktop-user">

          <span>
            👤 {user?.name}
          </span>

          <button onClick={handleLogout}>
            Logout
          </button>

        </div>


        {/* Mobile Menu Button */}

        <button
          className="mobile-menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation menu"
        >
          {menuOpen ? "✕" : "☰"}
        </button>

      </div>


      {/* Mobile Navigation */}

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


          {user?.role === "admin" && (
            <Link
              to="/admin"
              onClick={closeMenu}
            >
              🛡️ Admin Dashboard
            </Link>
          )}


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
            </>
          )}

          {(user?.role === "admin" ||
            user?.role === "master") && (
            <Link
              to="/admin/notes/manage"
              onClick={closeMenu}
            >
              Manage Notes
            </Link>
          )}


          <Link
            to="/change-password"
            onClick={closeMenu}
          >
            🔐 Change Password
          </Link>


          <button onClick={handleLogout}>
            🚪 Logout
          </button>

        </nav>
      )}

    </header>
  );
}

export default Navbar;