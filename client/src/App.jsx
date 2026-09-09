import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Public pages
import Login from "./pages/Login";
import Register from "./pages/Register";

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

// Master pages
import MasterDashboard from "./pages/master/MasterDashboard";

// Authentication / authorization
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
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

            Master can access Admin functionality.
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
            ADMIN - REVIEW NOTE
            Admin + Master

            IMPORTANT:
            This must come BEFORE /admin/notes/:id
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
            MASTER ONLY
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
    </BrowserRouter>
  );
}

export default App;