import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        // Get current user
        const userResponse = await api.get("/auth/me");

        setUser(userResponse.data.user);

        // Get statistics
        try {
          const statsResponse = await api.get(
            "/admin/dashboard/stats"
          );

          setStatistics(statsResponse.data.statistics);
          setStatsError("");
        } catch (error) {
          if (error.response?.status === 403) {
            setStatsError(
              "You do not have permission to view statistics."
            );
          } else {
            setStatsError(
              error.response?.data?.message ||
                "Failed to load statistics."
            );
          }
        }
      } catch (error) {
        console.error("Dashboard error:", error);

        setStatsError(
          error.response?.data?.message ||
            "Failed to load dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="page-container">
        <div className="admin-dashboard-page">
          <div className="dashboard-loading">
            Loading dashboard...
          </div>
        </div>
      </div>
    );
  }

  const isMaster = user?.role === "master";
  const canViewStatistics =
    isMaster || user?.permissions?.viewStatistics === true;

  return (
    <div className="page-container">
      <div className="admin-dashboard-page">

      {/* Header */}
      <div className="admin-dashboard-header">
        <div>
          <h1>Admin Dashboard</h1>

          <p>
            Welcome back,{" "}
            <strong>{user?.name || "Admin"}</strong>
          </p>
        </div>

        <div className="admin-role-badge">
          {isMaster ? "MASTER" : "ADMIN"}
        </div>
      </div>

      {/* Assigned Subjects */}
      <section className="dashboard-section">
        <div className="section-heading">
          <h2>Assigned Subjects</h2>
          <span>
            {user?.assignedSubjects?.length || 0}
          </span>
        </div>

        {user?.assignedSubjects?.length > 0 ? (
          <div className="assigned-subjects">
            {user.assignedSubjects.map((subject) => (
              <div
                className="assigned-subject-card"
                key={subject._id}
              >
                <strong>{subject.name}</strong>

                <span>
                  {subject.code} · Semester{" "}
                  {subject.semester}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-dashboard-message">
            No subjects have been assigned to you.
          </div>
        )}
      </section>

      {/* Statistics */}
      {canViewStatistics && (
        <section className="dashboard-section">
          <div className="section-heading">
            <div>
              <h2>Statistics</h2>
              <p>Overview of your accessible notes.</p>
            </div>
          </div>

          {statsError ? (
            <div className="dashboard-error">
              {statsError}
            </div>
          ) : statistics ? (
            <div className="statistics-grid">

              <div className="stat-card">
                <span className="stat-label">
                  Total Notes
                </span>
                <strong className="stat-value">
                  {statistics.totalNotes}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  Approved
                </span>
                <strong className="stat-value">
                  {statistics.approvedNotes}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  Current Approved
                </span>
                <strong className="stat-value">
                  {statistics.currentApprovedNotes}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  Pending
                </span>
                <strong className="stat-value">
                  {statistics.pendingNotes}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  Rejected
                </span>
                <strong className="stat-value">
                  {statistics.rejectedNotes}
                </strong>
              </div>

              <div className="stat-card">
                <span className="stat-label">
                  Outdated
                </span>
                <strong className="stat-value">
                  {statistics.outdatedNotes}
                </strong>
              </div>

              <div className="stat-card downloads-card">
                <span className="stat-label">
                  Total Downloads
                </span>
                <strong className="stat-value">
                  {statistics.totalDownloads}
                </strong>
              </div>

            </div>
          ) : (
            <div className="empty-dashboard-message">
              Statistics are not available.
            </div>
          )}
        </section>
      )}

      {/* Statistics permission message */}
      {!canViewStatistics && (
        <div className="dashboard-info">
          Statistics are not available because your account
          does not have the <strong>View Statistics</strong>{" "}
          permission.
        </div>
      )}

      {/* Quick Actions */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Common actions for managing CampusNotes.</p>
          </div>
        </div>

        <div className="quick-actions-grid">

          <Link
            to="/admin/notes/pending"
            className="quick-action-card"
          >
            <strong>Pending Notes</strong>
            <span>
              Review notes waiting for approval.
            </span>
          </Link>

          <Link
            to="/admin/notes/manage"
            className="quick-action-card"
          >
            <strong>Manage Notes</strong>
            <span>
              View and manage accessible notes.
            </span>
          </Link>

          <Link
            to="/my-notes"
            className="quick-action-card"
          >
            <strong>My Notes</strong>
            <span>
              View notes you have uploaded.
            </span>
          </Link>

          <Link
            to="/upload"
            className="quick-action-card"
          >
            <strong>Upload Note</strong>
            <span>
              Upload a new PDF note.
            </span>
          </Link>

        </div>
      </section>

      </div>
    </div>
  );
}

export default AdminDashboard;