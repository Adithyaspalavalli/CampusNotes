import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function MasterDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/master/dashboard/stats"
      );

      setStats(response.data);
    } catch (error) {
      console.error(
        "Failed to fetch master dashboard stats:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading Master Dashboard...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>Unable to load dashboard</h2>

            <p>{error}</p>

            <button onClick={fetchStats}>
              Try Again
            </button>
          </div>
        </PageContainer>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="master-dashboard">

          {/* HEADER */}
          <div className="master-dashboard-header">
            <div>
              <span className="master-dashboard-label">
                MASTER CONTROL CENTER
              </span>

              <h1>Master Dashboard</h1>

              <p>
                Manage users, admins, subjects,
                notes and the CampusNotes system.
              </p>
            </div>

            <button
              className="master-refresh-button"
              onClick={fetchStats}
            >
              ↻ Refresh
            </button>
          </div>

          {/* MAIN STATISTICS */}
          <section className="master-stat-section">

            <h2>System Overview</h2>

            <div className="master-stat-grid">

              <div className="master-stat-card">
                <div className="master-stat-icon">
                  👥
                </div>

                <div>
                  <span>Total Users</span>
                  <strong>
                    {stats.users.total}
                  </strong>
                </div>
              </div>

              <div className="master-stat-card">
                <div className="master-stat-icon">
                  📝
                </div>

                <div>
                  <span>Total Notes</span>
                  <strong>
                    {stats.notes.total}
                  </strong>
                </div>
              </div>

              <div className="master-stat-card">
                <div className="master-stat-icon">
                  📚
                </div>

                <div>
                  <span>Total Subjects</span>
                  <strong>
                    {stats.subjects.total}
                  </strong>
                </div>
              </div>

              <div className="master-stat-card">
                <div className="master-stat-icon">
                  ⏳
                </div>

                <div>
                  <span>Pending Notes</span>
                  <strong>
                    {stats.notes.pending}
                  </strong>
                </div>
              </div>

            </div>
          </section>

          {/* USER STATISTICS */}
          <section className="master-dashboard-section">

            <div className="master-section-header">
              <div>
                <h2>User Statistics</h2>
                <p>
                  Overview of CampusNotes accounts.
                </p>
              </div>
            </div>

            <div className="master-detail-grid">

              <div className="master-detail-card">
                <span>Students</span>
                <strong>
                  {stats.users.students}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Admins</span>
                <strong>
                  {stats.users.admins}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Masters</span>
                <strong>
                  {stats.users.masters}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Active Users</span>
                <strong>
                  {stats.users.active}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Disabled Users</span>
                <strong>
                  {stats.users.disabled}
                </strong>
              </div>

            </div>
          </section>

          {/* NOTE STATISTICS */}
          <section className="master-dashboard-section">

            <div className="master-section-header">
              <div>
                <h2>Note Statistics</h2>
                <p>
                  Current state of uploaded notes.
                </p>
              </div>
            </div>

            <div className="master-detail-grid">

              <div className="master-detail-card">
                <span>Pending</span>
                <strong>
                  {stats.notes.pending}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Approved</span>
                <strong>
                  {stats.notes.approved}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Rejected</span>
                <strong>
                  {stats.notes.rejected}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Outdated</span>
                <strong>
                  {stats.notes.outdated}
                </strong>
              </div>

            </div>
          </section>

          {/* SUBJECT STATISTICS */}
          <section className="master-dashboard-section">

            <div className="master-section-header">
              <div>
                <h2>Subject Statistics</h2>
                <p>
                  Current subject availability.
                </p>
              </div>
            </div>

            <div className="master-detail-grid">

              <div className="master-detail-card">
                <span>Total Subjects</span>
                <strong>
                  {stats.subjects.total}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Active Subjects</span>
                <strong>
                  {stats.subjects.active}
                </strong>
              </div>

              <div className="master-detail-card">
                <span>Inactive Subjects</span>
                <strong>
                  {stats.subjects.inactive}
                </strong>
              </div>

            </div>
          </section>

          {/* QUICK MANAGEMENT */}
          <section className="master-dashboard-section">

            <div className="master-section-header">
              <div>
                <h2>Quick Management</h2>

                <p>
                  Access important Master controls.
                </p>
              </div>
            </div>

            <div className="master-management-grid">

              <button
                className="master-management-card"
                onClick={() =>
                  navigate(
                    "/admin/notes/pending"
                  )
                }
              >
                <span className="management-icon">
                  ⏳
                </span>

                <strong>
                  Pending Notes
                </strong>

                <small>
                  Review notes waiting for approval
                </small>
              </button>

              <button
                className="master-management-card"
                onClick={() =>
                  navigate(
                    "/admin/notes/manage"
                  )
                }
              >
                <span className="management-icon">
                  📝
                </span>

                <strong>
                  Manage Notes
                </strong>

                <small>
                  View and manage all notes
                </small>
              </button>

              <button
                className="master-management-card"
                onClick={() =>
                  navigate(
                    "/master/subjects"
                  )
                }
              >
                <span className="management-icon">
                  📚
                </span>

                <strong>
                  Manage Subjects
                </strong>

                <small>
                  Create, edit and manage subjects
                </small>
              </button>

              <button
                className="master-management-card"
                onClick={() =>
                  navigate(
                    "/master/admins"
                  )
                }
              >
                <span className="management-icon">
                  👨‍💼
                </span>

                <strong>
                  Manage Admins
                </strong>

                <small>
                  Create admins and assign permissions
                </small>
              </button>

              <button
                className="master-management-card"
                onClick={() =>
                  navigate(
                    "/master/users"
                  )
                }
              >
                <span className="management-icon">
                  👥
                </span>

                <strong>
                  Manage Users
                </strong>

                <small>
                  Manage student accounts
                </small>
              </button>

            </div>
          </section>

        </div>
      </PageContainer>
    </>
  );
}

export default MasterDashboard;