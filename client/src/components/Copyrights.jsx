import { Link } from "react-router-dom";

function Copyright() {
  return (
    <footer className="copyright">
      <small>
        © {new Date().getFullYear()} <Link to="/">Campus Notes</Link>. All rights reserved.
      </small>
    </footer>
  );
}

export default Copyright;
