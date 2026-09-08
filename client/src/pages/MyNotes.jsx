import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

function MyNotes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyNotes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/notes/my");

        setNotes(response.data.notes || []);
      } catch (error) {
        console.error("Failed to fetch my notes:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load your notes."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyNotes();
  }, []);

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
        return "Pending Approval";

      case "REJECTED":
        return "Rejected";

      case "OUTDATED":
        return "Outdated";

      default:
        return status;
    }
  };

  const handleRead = (note) => {
    if (
      note.status !== "APPROVED" ||
      !note.isCurrent
    ) {
      return;
    }

    navigate(`/notes/${note._id}/read`);
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading your notes...</p>
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

            <button
              onClick={() => window.location.reload()}
            >
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
        <div className="my-notes-page">

          <div className="my-notes-header">
            <div>
              <h1>My Notes</h1>

              <p>
                Manage the notes you have uploaded.
              </p>
            </div>

            <button
              className="my-notes-upload-button"
              onClick={() => navigate("/upload")}
            >
              + Upload Note
            </button>
          </div>

          {notes.length === 0 ? (
            <div className="notes-message">
              <h2>No notes uploaded yet</h2>

              <p>
                Upload your first set of notes and
                share them with your college community.
              </p>

              <button
                onClick={() => navigate("/upload")}
              >
                Upload Your First Note
              </button>
            </div>
          ) : (
            <>
              <div className="my-notes-summary">
                <span>
                  Total uploads: <strong>{notes.length}</strong>
                </span>
              </div>

              <div className="my-notes-list">
                {notes.map((note) => (
                  <div
                    className="my-note-card"
                    key={note._id}
                  >
                    <div className="my-note-main">

                      <div className="my-note-title-row">
                        <h2>{note.title}</h2>

                        <span
                          className={`note-status ${getStatusClass(
                            note.status
                          )}`}
                        >
                          {getStatusText(note.status)}
                        </span>
                      </div>

                      <p className="my-note-topic">
                        {note.subject?.code ||
                          "Subject"}{" "}
                        • Unit {note.unit} •{" "}
                        {note.topic}
                      </p>

                      {note.description && (
                        <p className="my-note-description">
                          {note.description}
                        </p>
                      )}

                      <div className="my-note-details">
                        <span>
                          Semester {note.semester}
                        </span>

                        <span>
                          Version {note.version || 1}
                        </span>

                        <span>
                          {new Date(
                            note.createdAt
                          ).toLocaleDateString()}
                        </span>

                        {note.status ===
                          "APPROVED" && (
                          <span>
                            Downloads:{" "}
                            {note.downloadCount || 0}
                          </span>
                        )}
                      </div>

                      {note.status === "REJECTED" &&
                        note.rejectionReason && (
                          <div className="rejection-box">
                            <strong>
                              Rejection reason:
                            </strong>

                            <p>
                              {note.rejectionReason}
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="my-note-actions">
                      {note.status === "APPROVED" &&
                        note.isCurrent && (
                          <>
                            <button
                              className="my-note-read-button"
                              onClick={() =>
                                handleRead(note)
                              }
                            >
                              📖 Read
                            </button>

                            <button
                              className="my-note-update-button"
                              onClick={() =>
                                navigate(
                                  `/notes/${note._id}/update`
                                )
                              }
                            >
                              ✏️ Update
                            </button>
                          </>
                        )}

                      {note.status === "PENDING" && (
                        <span className="action-info">
                          Waiting for admin review
                        </span>
                      )}

                      {note.status === "REJECTED" && (
                        <span className="action-info">
                          Upload a corrected version
                        </span>
                      )}

                      {note.status === "OUTDATED" && (
                        <span className="action-info">
                          Previous version
                        </span>
                      )}

                      <button
                        className="my-note-delete-button"
                        onClick={async () => {
                          const confirmed = window.confirm(
                            "Are you sure you want to delete this note? This action cannot be undone."
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
                                (item) =>
                                  item._id !== note._id
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
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </PageContainer>
    </>
  );
}

export default MyNotes;