import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Notes from "./pages/Notes";
import MyNotes from "./pages/MyNotes";

import AdminDashboard from "./pages/admin/AdminDashboard";
import MasterDashboard from "./pages/master/MasterDashboard";
import ReadNote from "./pages/ReadNote";
import UploadNote from "./pages/UploadNote";
import UpdateNote from "./pages/UpdateNote";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Public Routes */}

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* Student */}

        <Route
          path="/notes"
          element={
            <ProtectedRoute allowedRoles={["student", "admin", "master"]}>
              <Notes />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-notes"
          element={
            <ProtectedRoute
              allowedRoles={["student", "admin", "master"]}
            >
              <MyNotes />
            </ProtectedRoute>
          }
        />

        {/* Read Note */}

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


        {/* Admin */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />


        {/* Master */}

        <Route
          path="/master"
          element={
            <ProtectedRoute allowedRoles={["admin", "master"]}>
              <MasterDashboard />
            </ProtectedRoute>
          }
        />

        {/* Upload */}

        <Route
          path="/upload"
          element={
            <ProtectedRoute
              allowedRoles={["student", "admin", "master"]}
            >
              <UploadNote />
            </ProtectedRoute>
          }
        />

        {/* Update */}
        <Route
          path="/notes/:id/update"
          element={
            <ProtectedRoute
              allowedRoles={["student", "admin", "master"]}
            >
              <UpdateNote />
            </ProtectedRoute>
          }
        />


        {/* Root */}

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />


        {/* Unknown URL */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;