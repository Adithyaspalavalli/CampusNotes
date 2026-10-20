import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <h2>CampusNotes</h2>
            <p>
              A college notes sharing platform where students can upload,
              discover, and access approved study materials.
            </p>
          </div>

          <nav className="footer-section" aria-label="Quick links">
            <h3>Quick Links</h3>
            <Link to="/notes">Notes</Link>
            <Link to="/upload">Upload Note</Link>
            <Link to="/my-notes">My Notes</Link>
          </nav>

          <nav className="footer-section" aria-label="Account">
            <h3>Account</h3>
            <Link to="/change-password">Change Password</Link>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Create account</Link>
          </nav>

          <div className="footer-section">
            <h3>Contact</h3>
            <a href="mailto:support@campusnotes.com">
              support@campusnotes.com
            </a>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} CampusNotes. All rights reserved.
          </p>
          <p>Built for students, by students.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;