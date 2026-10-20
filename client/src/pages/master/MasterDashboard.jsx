import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function MasterDashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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

  const fetchAnalytics = useCallback(async (from, to) => {
    if (from && to && from > to) {
      setAnalyticsError(
        "The start date cannot be after the end date."
      );
      return;
    }

    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const params = {};
      if (from) params.from = from;
      if (to) params.to = to;

      const response = await api.get(
        "/master/dashboard/analytics",
        { params }
      );

      setAnalytics(response.data);
    } catch (error) {
      console.error("Master analytics error:", error);
      setAnalyticsError(
        error.response?.data?.message ||
          "Failed to load analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  const handleExportAnalytics = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setAnalyticsError(
        "The start date cannot be after the end date."
      );
      return;
    }

    try {
      setExporting(true);
      setAnalyticsError("");

      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await api.get(
        "/master/dashboard/analytics/export",
        {
          params,
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], {
          type: "text/csv;charset=utf-8;",
        })
      );

      const link = document.createElement("a");
      link.href = url;
      link.download = "campusnotes-master-analytics.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Master analytics export error:", error);
      setAnalyticsError(
        "Failed to export analytics. Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => fetchAnalytics("", ""));
  }, [fetchAnalytics]);

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

          {/* DOWNLOAD ANALYTICS */}
          <section className="master-dashboard-section">
            <div className="master-section-header">
              <div>
                <h2>Download Analytics</h2>
                <p>
                  Analyze note downloads, subject rankings, and note statuses.
                </p>
              </div>
            </div>

            <div className="analytics-controls">
              <label>
                From date
                <input
                  type="date"
                  value={fromDate}
                  max={toDate || undefined}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>

              <label>
                To date
                <input
                  type="date"
                  value={toDate}
                  min={fromDate || undefined}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>

              <button
                type="button"
                className="master-refresh-button"
                disabled={analyticsLoading}
                onClick={() => fetchAnalytics(fromDate, toDate)}
              >
                {analyticsLoading ? "Loading..." : "Apply Filters"}
              </button>

              <button
                type="button"
                className="master-refresh-button"
                disabled={analyticsLoading}
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  fetchAnalytics("", "");
                }}
              >
                Clear Dates
              </button>

              <button
                type="button"
                className="master-refresh-button"
                disabled={exporting}
                onClick={handleExportAnalytics}
              >
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            </div>

            {analyticsError && (
              <div className="notes-message error-box">
                {analyticsError}
              </div>
            )}

            {analyticsLoading && (
              <div className="notes-message">
                Loading analytics...
              </div>
            )}

            {analytics && !analyticsLoading && (
              <>
                <h3>Summary</h3>

                <div className="master-detail-grid">
                  <div className="master-detail-card">
                    <span>Total Notes</span>
                    <strong>{analytics.summary.totalNotes}</strong>
                  </div>

                  <div className="master-detail-card">
                    <span>Pending</span>
                    <strong>{analytics.summary.pendingNotes}</strong>
                  </div>

                  <div className="master-detail-card">
                    <span>Approved</span>
                    <strong>{analytics.summary.approvedNotes}</strong>
                  </div>

                  <div className="master-detail-card">
                    <span>Rejected</span>
                    <strong>{analytics.summary.rejectedNotes}</strong>
                  </div>

                  <div className="master-detail-card">
                    <span>Outdated</span>
                    <strong>{analytics.summary.outdatedNotes}</strong>
                  </div>

                  <div className="master-detail-card">
                    <span>Total Downloads</span>
                    <strong>{analytics.summary.totalDownloads}</strong>
                  </div>
                </div>

                <h3 className="analytics-subheading">
                  Most-Downloaded Notes
                </h3>

                {analytics.mostDownloadedNotes?.length > 0 ? (
                  <div className="analytics-table-container">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Note</th>
                          <th>Subject</th>
                          <th>Downloads</th>
                        </tr>
                      </thead>

                      <tbody>
                        {analytics.mostDownloadedNotes.map((note) => (
                          <tr key={note._id}>
                            <td>
                              {note.title || note.fileName || "Untitled"}
                            </td>
                            <td>{note.subjectName || "—"}</td>
                            <td>{note.downloads}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No downloaded notes found for this selection.</p>
                )}

                <h3 className="analytics-subheading">
                  Subject Rankings
                </h3>

                {analytics.subjectRankings?.length > 0 ? (
                  <div className="analytics-table-container">
                    <table className="analytics-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Subject</th>
                          <th>Code</th>
                          <th>Downloads</th>
                        </tr>
                      </thead>

                      <tbody>
                        {analytics.subjectRankings.map((subject, index) => (
                          <tr key={subject._id}>
                            <td>{index + 1}</td>
                            <td>{subject.name}</td>
                            <td>{subject.code || "—"}</td>
                            <td>{subject.downloads}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>No subject download activity found.</p>
                )}
              </>
            )}
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