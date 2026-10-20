import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

// Public pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChangePassword from "./pages/ChangePassword";

// Student pages
import Notes from "./pages/Notes";
import MyNotes from "./pages/MyNotes";
import ReadNote from "./pages/ReadNote";
import UploadNote from "./pages/UploadNote";
import UpdateNote from "./pages/UpdateNote";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PendingNotes from "./pages/admin/PendingNotes";
import ReviewNote from "./pages/admin/ReviewNote";
import AdminReadNote from "./pages/admin/AdminReadNote";
import ManageNotes from "./pages/admin/ManageNotes";

// Master pages
import MasterDashboard from "./pages/master/MasterDashboard";
import ManageUsers from "./pages/master/ManageUsers";
import ManageSubjects from "./pages/master/ManageSubjects";
import ManageAdmins from "./pages/master/ManageAdmins";

// Authentication / authorization
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";

function AppContent() {
  const { pathname } = useLocation();

  /*
   * Footer should NOT appear on:
   * 1. Login
   * 2. Register
   * 3. Change Password
   */

  const hideFooter =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/change-password";

  return (
    <div className="app-shell">

      <div className="app-route-content">

        <Routes>

          {/* =========================================
              PUBLIC ROUTES
          ========================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/register"
            element={<Register />}
          />

          {/* =========================================
              CHANGE PASSWORD
              Student + Admin + Master
              Footer hidden
          ========================================= */}

          <Route
            path="/change-password"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "student",
                  "admin",
                  "master",
                ]}
              >
                <ChangePassword />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              NOTES
              Student + Admin + Master
          ========================================= */}

          <Route
            path="/notes"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "student",
                  "admin",
                  "master",
                ]}
              >
                <Notes />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              MY NOTES
              Student + Admin + Master
          ========================================= */}

          <Route
            path="/my-notes"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "student",
                  "admin",
                  "master",
                ]}
              >
                <MyNotes />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              READ APPROVED NOTE
              Student + Admin + Master
          ========================================= */}

          <Route
            path="/notes/:id/read"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "student",
                  "admin",
                  "master",
                ]}
              >
                <ReadNote />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              UPLOAD NOTE
              Student + Admin + Master
          ========================================= */}

          <Route
            path="/upload"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "student",
                  "admin",
                  "master",
                ]}
              >
                <UploadNote />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              UPDATE NOTE
              Student + Admin + Master
          ========================================= */}

          <Route
            path="/notes/:id/update"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "student",
                  "admin",
                  "master",
                ]}
              >
                <UpdateNote />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ADMIN DASHBOARD
              Admin + Master
          ========================================= */}

          <Route
            path="/admin"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "master",
                ]}
              >
                <AdminDashboard />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ADMIN - PENDING NOTES
              Admin + Master
          ========================================= */}

          <Route
            path="/admin/notes/pending"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "master",
                ]}
              >
                <PendingNotes />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ADMIN - MANAGE NOTES
              Admin + Master
          ========================================= */}

          <Route
            path="/admin/notes/manage"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "master",
                ]}
              >
                <ManageNotes />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ADMIN - READ NOTE
              Admin + Master
          ========================================= */}

          <Route
            path="/admin/notes/:id/read"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "master",
                ]}
              >
                <AdminReadNote />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ADMIN - REVIEW NOTE
              Admin + Master
          ========================================= */}

          <Route
            path="/admin/notes/:id"
            element={
              <ProtectedRoute
                allowedRoles={[
                  "admin",
                  "master",
                ]}
              >
                <ReviewNote />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              MASTER DASHBOARD
              Master Only
          ========================================= */}

          <Route
            path="/master"
            element={
              <ProtectedRoute
                allowedRoles={["master"]}
              >
                <MasterDashboard />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              MASTER - USERS
              Master Only
          ========================================= */}

          <Route
            path="/master/users"
            element={
              <ProtectedRoute
                allowedRoles={["master"]}
              >
                <ManageUsers />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              MASTER - SUBJECTS
              Master Only
          ========================================= */}

          <Route
            path="/master/subjects"
            element={
              <ProtectedRoute
                allowedRoles={["master"]}
              >
                <ManageSubjects />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              MASTER - ADMINS
              Master Only
          ========================================= */}

          <Route
            path="/master/admins"
            element={
              <ProtectedRoute
                allowedRoles={["master"]}
              >
                <ManageAdmins />
              </ProtectedRoute>
            }
          />


          {/* =========================================
              ROOT
          ========================================= */}

          <Route
            path="/"
            element={
              <Navigate
                to="/login"
                replace
              />
            }
          />


          {/* =========================================
              UNKNOWN URL
          ========================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

        </Routes>

      </div>


      {/* =========================================
          FOOTER
          Hidden on Login, Register, Change Password
      ========================================= */}

      {!hideFooter && <Footer />}

    </div>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;