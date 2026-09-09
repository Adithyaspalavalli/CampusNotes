import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function PendingNotes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPendingNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/admin/notes/pending");

      setNotes(response.data.notes || []);
    } catch (error) {
      console.error(
        "Failed to fetch pending notes:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load pending notes."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingNotes();
  }, []);

  const handleReview = (noteId) => {
    navigate(`/admin/notes/${noteId}`);
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading pending notes...</p>
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
            <h2>Unable to load pending notes</h2>

            <p>{error}</p>

            <button onClick={fetchPendingNotes}>
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
        <div className="admin-page">

          <div className="admin-page-header">
            <div>
              <h1>Pending Notes</h1>

              <p>
                Review uploaded notes before they become
                available to students.
              </p>
            </div>

            <div className="admin-pending-count">
              {notes.length} Pending
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="notes-message">
              <h2>No pending notes</h2>

              <p>
                There are currently no notes waiting for
                approval.
              </p>
            </div>
          ) : (
            <div className="admin-notes-list">
              {notes.map((note) => (
                <div
                  className="admin-note-card"
                  key={note._id}
                >
                  <div className="admin-note-content">

                    <div className="admin-note-title-row">
                      <h2>{note.title}</h2>

                      <span className="note-status status-pending">
                        Pending
                      </span>
                    </div>

                    <p className="admin-note-subject">
                      {note.subject?.code ||
                        "Subject"}{" "}
                      •{" "}
                      {note.subject?.name ||
                        "Unknown Subject"}
                    </p>

                    <div className="admin-note-details">
                      <span>
                        Semester {note.semester}
                      </span>

                      <span>
                        Unit {note.unit}
                      </span>

                      <span>
                        Topic: {note.topic}
                      </span>

                      <span>
                        Version {note.version || 1}
                      </span>
                    </div>

                    <div className="admin-note-uploader">
                      Uploaded by:{" "}
                      <strong>
                        {note.uploadedBy?.name ||
                          "Unknown"}
                      </strong>

                      {note.uploadedBy?.email && (
                        <>
                          {" "}
                          ({note.uploadedBy.email})
                        </>
                      )}
                    </div>

                    <div className="admin-note-date">
                      Submitted:{" "}
                      {new Date(
                        note.createdAt
                      ).toLocaleString()}
                    </div>
                  </div>

                  <div className="admin-note-actions">
                    <button
                      className="admin-review-button"
                      onClick={() =>
                        handleReview(note._id)
                      }
                    >
                      Review Note
                    </button>
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

export default PendingNotes;