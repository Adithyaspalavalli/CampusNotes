import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          "/admin/notes/pending"
        );

        setPendingCount(
          response.data.count || 0
        );
      } catch (error) {
        console.error(
          "Failed to fetch pending notes:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load dashboard information"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchPendingCount();
  }, []);

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="admin-dashboard">

          {/* =====================================
              HEADER
          ===================================== */}

          <div className="admin-dashboard-header">
            <div>
              <h1>Admin Dashboard</h1>

              <p>
                Manage and review notes assigned
                to you.
              </p>
            </div>
          </div>


          {/* =====================================
              ERROR
          ===================================== */}

          {error && (
            <div className="admin-dashboard-error">
              <strong>Unable to load dashboard</strong>

              <p>{error}</p>
            </div>
          )}


          {/* =====================================
              STATISTICS
          ===================================== */}

          <div className="admin-dashboard-stats">

            {/* Pending */}

            <div className="admin-stat-card pending-stat">
              <div className="admin-stat-icon">
                📋
              </div>

              <div>
                <span className="admin-stat-label">
                  Pending Notes
                </span>

                <strong className="admin-stat-number">
                  {loading ? "..." : pendingCount}
                </strong>

                <span className="admin-stat-description">
                  Waiting for review
                </span>
              </div>
            </div>


            {/* Assigned Subjects */}

            <div className="admin-stat-card">
              <div className="admin-stat-icon">
                📚
              </div>

              <div>
                <span className="admin-stat-label">
                  Assigned Subjects
                </span>

                <strong className="admin-stat-number">
                  -
                </strong>

                <span className="admin-stat-description">
                  Managed by you
                </span>
              </div>
            </div>


            {/* Role */}

            <div className="admin-stat-card">
              <div className="admin-stat-icon">
                🛡️
              </div>

              <div>
                <span className="admin-stat-label">
                  Account Role
                </span>

                <strong className="admin-stat-role">
                  Admin
                </strong>

                <span className="admin-stat-description">
                  CampusNotes administrator
                </span>
              </div>
            </div>

          </div>


          {/* =====================================
              PENDING NOTES
          ===================================== */}

          <div className="admin-dashboard-section">

            <div className="admin-section-header">
              <div>
                <h2>Pending Notes</h2>

                <p>
                  Review notes waiting for
                  approval.
                </p>
              </div>

              {!loading && pendingCount > 0 && (
                <span className="admin-pending-badge">
                  {pendingCount} pending
                </span>
              )}
            </div>


            <div className="admin-dashboard-card">

              <div className="admin-dashboard-card-icon">
                📋
              </div>

              <div className="admin-dashboard-card-content">
                <h3>
                  Notes waiting for moderation
                </h3>

                <p>
                  Review uploaded notes, verify
                  their content and either approve
                  or reject them.
                </p>

                <button
                  className="admin-dashboard-primary-button"
                  onClick={() =>
                    navigate(
                      "/admin/notes/pending"
                    )
                  }
                >
                  Review Pending Notes →
                </button>
              </div>

            </div>

          </div>


          {/* =====================================
              QUICK ACTIONS
          ===================================== */}

          <div className="admin-dashboard-section">

            <div className="admin-section-header">
              <div>
                <h2>Quick Actions</h2>

                <p>
                  Common administrative actions.
                </p>
              </div>
            </div>


            <div className="admin-quick-actions">

              <button
                className="admin-quick-action"
                onClick={() =>
                  navigate(
                    "/admin/notes/pending"
                  )
                }
              >
                <span>📋</span>

                <div>
                  <strong>
                    Pending Notes
                  </strong>

                  <small>
                    Review and moderate notes
                  </small>
                </div>
              </button>


              <button
                className="admin-quick-action"
                onClick={() =>
                  navigate("/my-notes")
                }
              >
                <span>📚</span>

                <div>
                  <strong>
                    My Notes
                  </strong>

                  <small>
                    View notes uploaded by you
                  </small>
                </div>
              </button>


              <button
                className="admin-quick-action"
                onClick={() =>
                  navigate("/upload")
                }
              >
                <span>⬆️</span>

                <div>
                  <strong>
                    Upload Note
                  </strong>

                  <small>
                    Upload a new note
                  </small>
                </div>
              </button>

            </div>

          </div>

        </div>
      </PageContainer>
    </>
  );
}

export default AdminDashboard;