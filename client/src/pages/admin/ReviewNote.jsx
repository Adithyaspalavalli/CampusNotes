import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function ReviewNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showRejectBox, setShowRejectBox] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  /*
  ==================================================
  FETCH NOTE
  ==================================================
  */

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError("");

        const [userResponse, noteResponse] =
          await Promise.all([
            api.get("/auth/me"),
            api.get(`/admin/notes/${id}`),
          ]);

        setCurrentUser(userResponse.data.user);
        setNote(noteResponse.data.note);
      } catch (error) {
        console.error(
          "Failed to load review page:",
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

    loadData();
  }, [id]);

  const isMaster =
    currentUser?.role === "master";

  const canApproveNotes =
    isMaster ||
    currentUser?.permissions?.approveNotes === true;

  const canRejectNotes =
    isMaster ||
    currentUser?.permissions?.rejectNotes === true;

  /*
  ==================================================
  APPROVE NOTE
  ==================================================
  */

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

      /*
      ------------------------------------------------
      Wait briefly so Admin can see success message.
      Then return to Pending Notes.
      ------------------------------------------------
      */

      setTimeout(() => {
        navigate("/admin/notes/pending", {
          replace: true,
        });
      }, 800);

    } catch (error) {
      console.error(
        "Approve note error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to approve note."
      );

      setProcessing(false);
    }
  };

  /*
  ==================================================
  REJECT NOTE
  ==================================================
  */

  const handleReject = async () => {
    const reason =
      rejectionReason.trim();

    /*
    ------------------------------------------------
    Validate rejection reason
    ------------------------------------------------
    */

    if (!reason) {
      setError(
        "Please provide a reason for rejecting this note."
      );

      return;
    }

    if (reason.length > 500) {
      setError(
        "Rejection reason cannot exceed 500 characters."
      );

      return;
    }

    /*
    ------------------------------------------------
    Confirm rejection
    ------------------------------------------------
    */

    const confirmed = window.confirm(
      "Are you sure you want to reject this note?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setSuccess("");

      const response = await api.put(
        `/admin/notes/${id}/reject`,
        {
          rejectionReason: reason,
        }
      );

      setSuccess(
        response.data.message ||
          "Note rejected successfully."
      );

      /*
      ------------------------------------------------
      Return to pending notes after success.
      ------------------------------------------------
      */

      setTimeout(() => {
        navigate("/admin/notes/pending", {
          replace: true,
        });
      }, 800);

    } catch (error) {
      console.error(
        "Reject note error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to reject note."
      );

      setProcessing(false);
    }
  };

  /*
  ==================================================
  LOADING
  ==================================================
  */

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>
              Loading note for review...
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  /*
  ==================================================
  ERROR WHILE LOADING NOTE
  ==================================================
  */

  if (error && !note) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>
              Unable to load note
            </h2>

            <p>{error}</p>

            <button
              onClick={() =>
                navigate(
                  "/admin/notes/pending"
                )
              }
            >
              ← Back to Pending Notes
            </button>
          </div>
        </PageContainer>
      </>
    );
  }

  /*
  ==================================================
  SAFETY CHECK
  ==================================================
  */

  if (!note) {
    return null;
  }

  /*
  ==================================================
  MAIN UI
  ==================================================
  */

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="review-page">

          {/* ========================================
              BACK BUTTON
          ======================================== */}

          <button
            className="review-back-button"
            onClick={() =>
              navigate(
                "/admin/notes/pending"
              )
            }
            disabled={processing}
          >
            ← Back to Pending Notes
          </button>


          {/* ========================================
              HEADER
          ======================================== */}

          <div className="review-header">

            <div>
              <h1>
                Review Note
              </h1>

              <p>
                Verify the note before
                approving it.
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


          {/* ========================================
              ERROR MESSAGE
          ======================================== */}

          {error && (
            <div className="upload-message upload-error">

              <div className="upload-message-icon">
                ⚠️
              </div>

              <div>
                <strong>
                  Error
                </strong>

                <p>
                  {error}
                </p>
              </div>

            </div>
          )}


          {/* ========================================
              SUCCESS MESSAGE
          ======================================== */}

          {success && (
            <div className="upload-message upload-success">

              <div className="upload-message-icon">
                ✅
              </div>

              <div>
                <strong>
                  Success
                </strong>

                <p>
                  {success}
                </p>

                <small>
                  Returning to Pending Notes...
                </small>
              </div>

            </div>
          )}


          {/* ========================================
              MAIN REVIEW LAYOUT
          ======================================== */}

          <div className="review-layout">

            {/* ======================================
                NOTE INFORMATION
            ====================================== */}

            <div className="review-information">

              {/* Note Details */}

              <div className="review-card">

                <h2>
                  {note.title}
                </h2>

                {note.description && (
                  <p className="review-description">
                    {note.description}
                  </p>
                )}

                <div className="review-details">

                  <div>
                    <span>
                      Semester
                    </span>

                    <strong>
                      {note.semester}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Subject
                    </span>

                    <strong>
                      {note.subject?.code ||
                        note.subject?.name ||
                        "Unknown"}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Unit
                    </span>

                    <strong>
                      {note.unit}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Topic
                    </span>

                    <strong>
                      {note.topic}
                    </strong>
                  </div>


                  <div>
                    <span>
                      Version
                    </span>

                    <strong>
                      v{note.version || 1}
                    </strong>
                  </div>

                </div>

              </div>


              {/* Uploader */}

              <div className="review-card">

                <h3>
                  Uploader
                </h3>

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


              {/* File */}

              <div className="review-card">

                <h3>
                  File
                </h3>

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
                  disabled={processing}
                >
                  📖 Review PDF
                </button>

              </div>

            </div>


            {/* ======================================
                MODERATION
            ====================================== */}

            <div className="review-moderation">

              {note.status === "PENDING" &&
              !canApproveNotes &&
              !canRejectNotes ? (
                <div className="dashboard-info">
                  You do not have permission to moderate
                  notes.
                </div>
              ) : note.status === "PENDING" ? (

                <div className="review-card">

                  <h2>
                    Moderation
                  </h2>

                  <p>
                    Review the PDF and note
                    information before making
                    a decision.
                  </p>


                  {/* Approve */}

                  {canApproveNotes && (
                    <button
                      className="approve-note-button"
                      onClick={handleApprove}
                      disabled={processing}
                    >
                      {processing
                        ? "Processing..."
                        : "✓ Approve Note"}
                    </button>
                  )}


                  {/* Reject */}

                  {canRejectNotes &&
                    (!showRejectBox ? (

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
                        onChange={(event) => {
                          setRejectionReason(
                            event.target.value
                          );

                          /*
                          Clear validation error
                          while typing.
                          */

                          if (error) {
                            setError("");
                          }
                        }}
                        placeholder="Explain why this note should be rejected..."
                        maxLength={500}
                        rows={5}
                        disabled={processing}
                      />

                      <small>
                        {rejectionReason.length}/500
                      </small>


                      <div className="reject-form-actions">

                        <button
                          className="cancel-reject-button"
                          onClick={() => {
                            setShowRejectBox(
                              false
                            );

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

                  ))}

                </div>

              ) : (

                /* ==================================
                   MODERATION COMPLETE
                ================================== */

                <div className="review-card">

                  <h2>
                    Moderation Complete
                  </h2>

                  <p>
                    This note has already
                    been processed.
                  </p>


                  {note.status ===
                    "REJECTED" &&
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