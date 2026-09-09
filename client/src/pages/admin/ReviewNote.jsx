import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function ReviewNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showRejectBox, setShowRejectBox] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/admin/notes/${id}`
        );

        setNote(response.data.note);
      } catch (error) {
        console.error(
          "Failed to fetch note:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load note."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNote();
  }, [id]);

  const handleApprove = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/admin/notes/${id}/approve`
      );

      setSuccess(
        response.data.message ||
          "Note approved successfully."
      );

      setNote((current) => ({
        ...current,
        status: "APPROVED",
        isCurrent: true,
      }));
    } catch (error) {
      console.error(
        "Approve note error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to approve note."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError(
        "Please provide a reason for rejecting this note."
      );
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/admin/notes/${id}/reject`,
        {
          rejectionReason:
            rejectionReason.trim(),
        }
      );

      setSuccess(
        response.data.message ||
          "Note rejected successfully."
      );

      setNote((current) => ({
        ...current,
        status: "REJECTED",
        isCurrent: false,
        rejectionReason:
          rejectionReason.trim(),
      }));

      setShowRejectBox(false);
    } catch (error) {
      console.error(
        "Reject note error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to reject note."
      );
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading note for review...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error && !note) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>Unable to load note</h2>

            <p>{error}</p>

            <button
              onClick={() =>
                navigate("/admin/notes/pending")
              }
            >
              Back to Pending Notes
            </button>
          </div>
        </PageContainer>
      </>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="review-page">

          <button
            className="review-back-button"
            onClick={() =>
              navigate("/admin/notes/pending")
            }
          >
            ← Back to Pending Notes
          </button>

          <div className="review-header">
            <div>
              <h1>Review Note</h1>

              <p>
                Verify the note before approving it.
              </p>
            </div>

            <span
              className={`note-status ${
                note.status === "PENDING"
                  ? "status-pending"
                  : note.status === "APPROVED"
                  ? "status-approved"
                  : "status-rejected"
              }`}
            >
              {note.status}
            </span>
          </div>

          {error && (
            <div className="upload-message upload-error">
              <div className="upload-message-icon">
                ⚠️
              </div>

              <div>
                <strong>Error</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="upload-message upload-success">
              <div className="upload-message-icon">
                ✅
              </div>

              <div>
                <strong>Success</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          <div className="review-layout">

            {/* Note Information */}
            <div className="review-information">

              <div className="review-card">
                <h2>{note.title}</h2>

                {note.description && (
                  <p className="review-description">
                    {note.description}
                  </p>
                )}

                <div className="review-details">
                  <div>
                    <span>Semester</span>
                    <strong>
                      {note.semester}
                    </strong>
                  </div>

                  <div>
                    <span>Subject</span>
                    <strong>
                      {note.subject?.code ||
                        "Unknown"}
                    </strong>
                  </div>

                  <div>
                    <span>Unit</span>
                    <strong>
                      {note.unit}
                    </strong>
                  </div>

                  <div>
                    <span>Topic</span>
                    <strong>
                      {note.topic}
                    </strong>
                  </div>

                  <div>
                    <span>Version</span>
                    <strong>
                      v{note.version || 1}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="review-card">
                <h3>Uploader</h3>

                <p>
                  <strong>
                    {note.uploadedBy?.name ||
                      "Unknown"}
                  </strong>
                </p>

                {note.uploadedBy?.email && (
                  <p>
                    {note.uploadedBy.email}
                  </p>
                )}
              </div>

              <div className="review-card">
                <h3>File</h3>

                <p className="review-file-name">
                  📄 {note.fileName}
                </p>

                <button
                className="review-open-button"
                onClick={() =>
                  navigate(
                    `/admin/notes/${note._id}/read`
                  )
                }
              >
                📖 Review PDF
              </button>
              </div>

            </div>

            {/* Moderation */}
            <div className="review-moderation">

              {note.status === "PENDING" ? (
                <div className="review-card">
                  <h2>Moderation</h2>

                  <p>
                    Review the PDF and note information
                    before making a decision.
                  </p>

                  <button
                    className="approve-note-button"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    {processing
                      ? "Processing..."
                      : "✓ Approve Note"}
                  </button>

                  {!showRejectBox ? (
                    <button
                      className="reject-note-button"
                      onClick={() =>
                        setShowRejectBox(true)
                      }
                      disabled={processing}
                    >
                      ✕ Reject Note
                    </button>
                  ) : (
                    <div className="reject-form">
                      <label>
                        Rejection Reason
                      </label>

                      <textarea
                        value={rejectionReason}
                        onChange={(event) =>
                          setRejectionReason(
                            event.target.value
                          )
                        }
                        placeholder="Explain why this note should be rejected..."
                        maxLength={500}
                        rows={5}
                      />

                      <small>
                        {rejectionReason.length}/500
                      </small>

                      <div className="reject-form-actions">
                        <button
                          className="cancel-reject-button"
                          onClick={() => {
                            setShowRejectBox(false);
                            setRejectionReason("");
                            setError("");
                          }}
                          disabled={processing}
                        >
                          Cancel
                        </button>

                        <button
                          className="confirm-reject-button"
                          onClick={handleReject}
                          disabled={processing}
                        >
                          {processing
                            ? "Rejecting..."
                            : "Confirm Rejection"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="review-card">
                  <h2>Moderation Complete</h2>

                  <p>
                    This note has already been processed.
                  </p>

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
              )}

            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

export default ReviewNote;