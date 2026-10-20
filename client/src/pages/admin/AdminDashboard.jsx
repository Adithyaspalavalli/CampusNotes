
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/Navbar";
import api from "../../services/api";

function AdminDashboard() {
  const [user, setUser] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [statsError, setStatsError] = useState("");
  const [analyticsError, setAnalyticsError] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);

        const userResponse = await api.get("/auth/me");
        setUser(userResponse.data.user);

        try {
          const statsResponse = await api.get("/admin/dashboard/stats");
          setStatistics(statsResponse.data.statistics);
          setStatsError("");
        } catch (error) {
          setStatsError(
            error.response?.data?.message ||
              "Failed to load dashboard statistics."
          );
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

  const loadAnalytics = async () => {
    if (fromDate && toDate && fromDate > toDate) {
      setAnalyticsError(
        "The start date cannot be after the end date."
      );
      return;
    }

    try {
      setAnalyticsLoading(true);
      setAnalyticsError("");

      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await api.get(
        "/admin/dashboard/analytics",
        { params }
      );

      setAnalytics(response.data);
    } catch (error) {
      console.error("Analytics error:", error);
      setAnalyticsError(
        error.response?.data?.message ||
          "Failed to load analytics."
      );
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "master" ||
        user?.permissions?.viewStatistics === true) {
      loadAnalytics();
    }
  }, [user]);

  const handleExport = async () => {
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
        "/admin/dashboard/analytics/export",
        {
          params,
          responseType: "blob",
        }
      );

      const blob = new Blob(
        ["\uFEFF", response.data],
        { type: "text/csv;charset=utf-8;" }
      );

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = "campusnotes-analytics.csv";

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("CSV export error:", error);
      setAnalyticsError(
        "Failed to export analytics. Please try again."
      );
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="admin-dashboard-page">
            <div className="dashboard-loading">
              Loading dashboard...
            </div>
          </div>
        </div>
      </>
    );
  }

  const isMaster = user?.role === "master";
  const canViewStatistics =
    isMaster || user?.permissions?.viewStatistics === true;

  const summary = analytics?.summary;

  return (
    <>
      <Navbar />

      <div className="page-container">
        <div className="admin-dashboard-page">
          <div className="admin-dashboard-header">
            <div>
              <h1>
                {isMaster ? "Master Dashboard" : "Admin Dashboard"}
              </h1>
              <p>
                Welcome back,{" "}
                <strong>{user?.name || "Admin"}</strong>
              </p>
            </div>

            <div className="admin-role-badge">
              {isMaster ? "MASTER" : "ADMIN"}
            </div>
          </div>

          <section className="dashboard-section">
            <div className="section-heading">
              <h2>Assigned Subjects</h2>
              <span>{user?.assignedSubjects?.length || 0}</span>
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
                      {subject.code} · Semester {subject.semester}
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

          {canViewStatistics && (
            <>
              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h2>Statistics</h2>
                    <p>
                      Overview of notes accessible to your account.
                    </p>
                  </div>
                </div>

                {statsError && (
                  <div className="dashboard-error">
                    {statsError}
                  </div>
                )}

                {statistics && (
                  <div className="statistics-grid">
                    <div className="stat-card">
                      <span className="stat-label">Total Notes</span>
                      <strong className="stat-value">
                        {statistics.totalNotes}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Approved</span>
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
                      <span className="stat-label">Pending</span>
                      <strong className="stat-value">
                        {statistics.pendingNotes}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Rejected</span>
                      <strong className="stat-value">
                        {statistics.rejectedNotes}
                      </strong>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Outdated</span>
                      <strong className="stat-value">
                        {statistics.outdatedNotes}
                      </strong>
                    </div>

                    <div className="stat-card downloads-card">
                      <span className="stat-label">
                        Lifetime Downloads
                      </span>
                      <strong className="stat-value">
                        {statistics.totalDownloads}
                      </strong>
                    </div>
                  </div>
                )}
              </section>

              <section className="dashboard-section">
                <div className="section-heading">
                  <div>
                    <h2>Download Analytics</h2>
                    <p>
                      Filter activity and export your statistics.
                    </p>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    alignItems: "end",
                    marginBottom: "20px",
                  }}
                >
                  <label>
                    From date
                    <input
                      type="date"
                      value={fromDate}
                      max={toDate || undefined}
                      onChange={(event) =>
                        setFromDate(event.target.value)
                      }
                      style={{
                        display: "block",
                        padding: "10px",
                        marginTop: "5px",
                      }}
                    />
                  </label>

                  <label>
                    To date
                    <input
                      type="date"
                      value={toDate}
                      min={fromDate || undefined}
                      onChange={(event) =>
                        setToDate(event.target.value)
                      }
                      style={{
                        display: "block",
                        padding: "10px",
                        marginTop: "5px",
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={loadAnalytics}
                    disabled={analyticsLoading}
                    className="quick-action-card"
                    style={{ cursor: "pointer" }}
                  >
                    {analyticsLoading ? "Loading..." : "Apply Filters"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFromDate("");
                      setToDate("");
                      setAnalyticsError("");
                      // Fetch lifetime analytics without date filters.
                      setTimeout(() => {
                        api.get("/admin/dashboard/analytics")
                          .then((response) =>
                            setAnalytics(response.data)
                          )
                          .catch(() =>
                            setAnalyticsError(
                              "Failed to load analytics."
                            )
                          );
                      }, 0);
                    }}
                    className="quick-action-card"
                    style={{ cursor: "pointer" }}
                  >
                    Clear Dates
                  </button>

                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting || analyticsLoading}
                    className="quick-action-card"
                    style={{ cursor: "pointer" }}
                  >
                    {exporting ? "Exporting..." : "Export CSV"}
                  </button>
                </div>

                {analyticsError && (
                  <div className="dashboard-error">
                    {analyticsError}
                  </div>
                )}

                {analyticsLoading && (
                  <div className="dashboard-loading">
                    Loading analytics...
                  </div>
                )}

                {summary && !analyticsLoading && (
                  <>
                    <h3>Selected Period Summary</h3>

                    <div className="statistics-grid">
                      <div className="stat-card">
                        <span className="stat-label">
                          Notes Created
                        </span>
                        <strong className="stat-value">
                          {summary.totalNotes}
                        </strong>
                      </div>

                      <div className="stat-card">
                        <span className="stat-label">
                          Pending
                        </span>
                        <strong className="stat-value">
                          {summary.pendingNotes}
                        </strong>
                      </div>

                      <div className="stat-card">
                        <span className="stat-label">
                          Approved
                        </span>
                        <strong className="stat-value">
                          {summary.approvedNotes}
                        </strong>
                      </div>

                      <div className="stat-card">
                        <span className="stat-label">
                          Rejected
                        </span>
                        <strong className="stat-value">
                          {summary.rejectedNotes}
                        </strong>
                      </div>

                      <div className="stat-card">
                        <span className="stat-label">
                          Outdated
                        </span>
                        <strong className="stat-value">
                          {summary.outdatedNotes}
                        </strong>
                      </div>

                      <div className="stat-card downloads-card">
                        <span className="stat-label">
                          Downloads in Period
                        </span>
                        <strong className="stat-value">
                          {summary.totalDownloads}
                        </strong>
                      </div>
                    </div>

                    <h3 style={{ marginTop: "28px" }}>
                      Most-Downloaded Notes
                    </h3>

                    {analytics.mostDownloadedNotes?.length ? (
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "12px",
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={cellStyle}>Note</th>
                              <th style={cellStyle}>Subject</th>
                              <th style={cellStyle}>Downloads</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.mostDownloadedNotes.map(
                              (note) => (
                                <tr key={note._id}>
                                  <td style={cellStyle}>
                                    {note.title ||
                                      note.fileName ||
                                      "Untitled note"}
                                  </td>
                                  <td style={cellStyle}>
                                    {note.subjectName || "—"}
                                  </td>
                                  <td style={cellStyle}>
                                    {note.downloads}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No downloads found for this selection.</p>
                    )}

                    <h3 style={{ marginTop: "28px" }}>
                      Subject Rankings
                    </h3>

                    {analytics.subjectRankings?.length ? (
                      <div style={{ overflowX: "auto" }}>
                        <table
                          style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: "12px",
                          }}
                        >
                          <thead>
                            <tr>
                              <th style={cellStyle}>Rank</th>
                              <th style={cellStyle}>Subject</th>
                              <th style={cellStyle}>Code</th>
                              <th style={cellStyle}>Downloads</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analytics.subjectRankings.map(
                              (subject, index) => (
                                <tr key={subject._id}>
                                  <td style={cellStyle}>
                                    {index + 1}
                                  </td>
                                  <td style={cellStyle}>
                                    {subject.name}
                                  </td>
                                  <td style={cellStyle}>
                                    {subject.code || "—"}
                                  </td>
                                  <td style={cellStyle}>
                                    {subject.downloads}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>No subject download activity found.</p>
                    )}
                  </>
                )}

                {!analytics && !analyticsLoading && !analyticsError && (
                  <div className="empty-dashboard-message">
                    Analytics are not available.
                  </div>
                )}
              </section>
            </>
          )}

          {!canViewStatistics && (
            <div className="dashboard-info">
              Statistics are unavailable because your account does not
              have the <strong>View Statistics</strong> permission.
            </div>
          )}

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
                <span>Review notes waiting for approval.</span>
              </Link>

              <Link
                to="/admin/notes/manage"
                className="quick-action-card"
              >
                <strong>Manage Notes</strong>
                <span>View and manage accessible notes.</span>
              </Link>

              <Link to="/my-notes" className="quick-action-card">
                <strong>My Notes</strong>
                <span>View notes you have uploaded.</span>
              </Link>

              <Link to="/upload" className="quick-action-card">
                <strong>Upload Note</strong>
                <span>Upload a new PDF note.</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

const cellStyle = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #ddd",
};

export default AdminDashboard;
