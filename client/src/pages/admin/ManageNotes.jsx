import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function ManageNotes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/admin/notes/manage"
      );

      setNotes(response.data.notes || []);
    } catch (error) {
      console.error(
        "Failed to fetch manage notes:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load notes."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get("/auth/me");

      setCurrentUser(response.data.user);
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error
      );
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchCurrentUser();
  }, []);

  const isMaster =
    currentUser?.role === "master";

  const isAdmin =
    currentUser?.role === "admin";

  const canDeleteNote = (note) => {
    if (isMaster) {
      return true;
    }

    if (!isAdmin) {
      return false;
    }

    if (
      currentUser?.permissions?.deleteNotes !== true
    ) {
      return false;
    }

    const assignedSubjects =
      currentUser?.assignedSubjects || [];

    const noteSubjectId =
      note.subject?._id || note.subject;

    return assignedSubjects.some(
      (subject) => {
        const assignedSubjectId =
          subject?._id || subject;

        return (
          assignedSubjectId.toString() ===
          noteSubjectId?.toString()
        );
      }
    );
  };

  const canApproveNotes =
    isMaster ||
    (
      isAdmin &&
      currentUser?.permissions?.approveNotes === true
    );

  const canRejectNotes =
    isMaster ||
    (
      isAdmin &&
      currentUser?.permissions?.rejectNotes === true
    );

  const filteredNotes = useMemo(() => {
    const searchText =
      search.trim().toLowerCase();

    return notes.filter((note) => {
      const matchesSearch =
        !searchText ||
        note.title
          ?.toLowerCase()
          .includes(searchText) ||
        note.topic
          ?.toLowerCase()
          .includes(searchText) ||
        note.subject?.name
          ?.toLowerCase()
          .includes(searchText) ||
        note.subject?.code
          ?.toLowerCase()
          .includes(searchText) ||
        note.uploadedBy?.name
          ?.toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "ALL" ||
        note.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [notes, search, statusFilter]);

  const getStatusClass = (status) => {
    switch (status) {
      case "APPROVED":
        return "status-approved";
      case "PENDING":
        return "status-pending";
      case "REJECTED":
        return "status-rejected";
      case "OUTDATED":
        return "status-outdated";
      default:
        return "";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "APPROVED":
        return "Approved";
      case "PENDING":
        return "Pending";
      case "REJECTED":
        return "Rejected";
      case "OUTDATED":
        return "Outdated";
      default:
        return status;
    }
  };

  const handleDelete = async (note) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${note.title}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(
        `/notes/${note._id}`
      );

      setNotes((currentNotes) =>
        currentNotes.filter(
          (item) => item._id !== note._id
        )
      );
    } catch (error) {
      console.error(
        "Delete note error:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to delete note."
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading notes...</p>
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
            <h2>Unable to load notes</h2>

            <p>{error}</p>

            <button onClick={fetchNotes}>
              Try Again
            </button>
          </div>
        </PageContainer>
      </>
    );
  }

  const approvedCount = notes.filter(
    (note) => note.status === "APPROVED"
  ).length;

  const pendingCount = notes.filter(
    (note) => note.status === "PENDING"
  ).length;

  const rejectedCount = notes.filter(
    (note) => note.status === "REJECTED"
  ).length;

  const outdatedCount = notes.filter(
    (note) => note.status === "OUTDATED"
  ).length;

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="manage-notes-page">

          <div className="manage-notes-header">
            <div>
              <h1>Manage Notes</h1>

              <p>
                View and manage notes across
                your permitted subjects.
              </p>
            </div>

            <button
              className="manage-notes-refresh-button"
              onClick={fetchNotes}
            >
              ↻ Refresh
            </button>
          </div>

          <div className="manage-notes-stats">

            <div className="manage-note-stat">
              <span>All</span>
              <strong>{notes.length}</strong>
            </div>

            <div className="manage-note-stat">
              <span>Approved</span>
              <strong>{approvedCount}</strong>
            </div>

            <div className="manage-note-stat">
              <span>Pending</span>
              <strong>{pendingCount}</strong>
            </div>

            <div className="manage-note-stat">
              <span>Rejected</span>
              <strong>{rejectedCount}</strong>
            </div>

            <div className="manage-note-stat">
              <span>Outdated</span>
              <strong>{outdatedCount}</strong>
            </div>

          </div>

          <div className="manage-notes-filters">

            <input
              type="text"
              placeholder="Search title, subject, topic or uploader..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="ALL">
                All Status
              </option>

              <option value="APPROVED">
                Approved
              </option>

              <option value="PENDING">
                Pending
              </option>

              <option value="REJECTED">
                Rejected
              </option>

              <option value="OUTDATED">
                Outdated
              </option>
            </select>

            <button
              onClick={clearFilters}
              className="manage-notes-clear-button"
            >
              Clear
            </button>

          </div>

          <div className="manage-notes-results">
            Showing{" "}
            <strong>
              {filteredNotes.length}
            </strong>{" "}
            of{" "}
            <strong>{notes.length}</strong>{" "}
            notes
          </div>

          {filteredNotes.length === 0 ? (
            <div className="notes-message">
              <h2>No notes found</h2>

              <p>
                Try changing your search or
                status filter.
              </p>
            </div>
          ) : (
            <div className="manage-notes-list">

              {filteredNotes.map((note) => (
                <div
                  className="manage-note-card"
                  key={note._id}
                >

                  <div className="manage-note-content">

                    <div className="manage-note-title-row">

                      <h2>{note.title}</h2>

                      <span
                        className={`note-status ${getStatusClass(
                          note.status
                        )}`}
                      >
                        {getStatusText(
                          note.status
                        )}
                      </span>

                    </div>

                    <p className="manage-note-subject">
                      {note.subject?.code ||
                        "Subject"}{" "}
                      •{" "}
                      {note.subject?.name ||
                        "Unknown Subject"}
                    </p>

                    <div className="manage-note-details">

                      <span>
                        Semester{" "}
                        {note.semester}
                      </span>

                      <span>
                        Unit {note.unit}
                      </span>

                      <span>
                        {note.topic}
                      </span>

                      <span>
                        Version{" "}
                        {note.version || 1}
                      </span>

                      {note.isCurrent && (
                        <span>
                          Current Version
                        </span>
                      )}

                    </div>

                    <div className="manage-note-uploader">
                      Uploaded by:{" "}
                      <strong>
                        {note.uploadedBy?.name ||
                          "Unknown"}
                      </strong>

                      {note.uploadedBy?.email && (
                        <>
                          {" "}
                          (
                          {
                            note.uploadedBy.email
                          }
                          )
                        </>
                      )}
                    </div>

                    <div className="manage-note-date">
                      Uploaded:{" "}
                      {note.createdAt
                        ? new Date(
                            note.createdAt
                          ).toLocaleString()
                        : "—"}
                    </div>

                    {note.status ===
                      "REJECTED" &&
                      note.rejectionReason && (
                        <div className="manage-note-rejection">
                          <strong>
                            Rejection reason:
                          </strong>

                          <p>
                            {
                              note.rejectionReason
                            }
                          </p>
                        </div>
                      )}

                  </div>

                  <div className="manage-note-actions">

                    {note.status ===
                      "APPROVED" &&
                      note.isCurrent && (
                        <button
                          className="manage-note-read-button"
                          onClick={() =>
                            navigate(
                              `/admin/notes/${note._id}/read`
                            )
                          }
                        >
                          📖 Read
                        </button>
                      )}

                    {note.status === "PENDING" &&
                      (canApproveNotes ||
                        canRejectNotes) && (
                        <button
                          className="manage-note-review-button"
                          onClick={() =>
                            navigate(
                              `/admin/notes/${note._id}`
                            )
                          }
                        >
                          Review
                        </button>
                      )}

                    {canDeleteNote(note) && (
                      <button
                        className="manage-note-delete-button"
                        onClick={() =>
                          handleDelete(note)
                        }
                      >
                        🗑 Delete
                      </button>
                    )}

                  </div>

                </div>
              ))}

            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
}

export default ManageNotes;