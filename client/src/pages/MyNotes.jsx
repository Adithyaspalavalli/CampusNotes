import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

function MyNotes() {
  const navigate = useNavigate();

  const [notes, setNotes] = useState([]);

  const [currentUser, setCurrentUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [deletingId, setDeletingId] =
    useState(null);

  const [actionError, setActionError] =
    useState("");

  const [actionSuccess, setActionSuccess] =
    useState("");

  /*
  ==================================================
  FETCH USER + NOTES
  ==================================================
  */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ------------------------------------------
        GET CURRENT USER
        ------------------------------------------
        */

        const userResponse =
          await api.get("/auth/me");

        setCurrentUser(
          userResponse.data.user
        );

        /*
        ------------------------------------------
        GET MY NOTES
        ------------------------------------------
        */

        const notesResponse =
          await api.get("/notes/my");

        setNotes(
          notesResponse.data.notes || []
        );

      } catch (error) {
        console.error(
          "Failed to load My Notes:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load your notes."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  /*
  ==================================================
  STATUS CLASS
  ==================================================
  */

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

  /*
  ==================================================
  STATUS TEXT
  ==================================================
  */

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

  /*
  ==================================================
  READ NOTE
  ==================================================
  */

  const handleRead = (note) => {
    if (
      note.status !== "APPROVED" ||
      !note.isCurrent
    ) {
      return;
    }

    navigate(
      `/notes/${note._id}/read`
    );
  };

  /*
  ==================================================
  CHECK WHETHER CURRENT USER CAN DELETE NOTE
  ==================================================
  */

  const canDeleteNote = (note) => {
    if (!currentUser) {
      return false;
    }

    /*
    ------------------------------------------
    MASTER
    ------------------------------------------

    Master can delete any note.
    */

    if (
      currentUser.role === "master"
    ) {
      return true;
    }

    /*
    ------------------------------------------
    STUDENT
    ------------------------------------------

    Student can only delete:

    - Own PENDING note
    - Own REJECTED note

    Since this is "My Notes", ownership is
    already guaranteed by the backend query.
    */

    if (
      currentUser.role === "student"
    ) {
      return (
        note.status === "PENDING" ||
        note.status === "REJECTED"
      );
    }

    /*
    ------------------------------------------
    ADMIN
    ------------------------------------------

    Admin requires:

    1. deleteNotes permission
    2. Subject must be assigned
    */

    if (
      currentUser.role === "admin"
    ) {
      if (
        currentUser.permissions
          ?.deleteNotes !== true
      ) {
        return false;
      }

      const assignedSubjects =
        currentUser.assignedSubjects ||
        [];

      return assignedSubjects.some(
        (subject) =>
          subject._id?.toString() ===
          note.subject?._id?.toString()
      );
    }

    return false;
  };

  /*
  ==================================================
  DELETE NOTE
  ==================================================
  */

  const handleDelete = async (note) => {
    /*
    ------------------------------------------
    SAFETY CHECK
    ------------------------------------------
    */

    if (!canDeleteNote(note)) {
      setActionError(
        "You do not have permission to delete this note."
      );

      return;
    }

    /*
    ------------------------------------------
    CONFIRMATION
    ------------------------------------------
    */

    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${note.title}"?\n\nThis action cannot be undone.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(note._id);

      setActionError("");
      setActionSuccess("");

      /*
      ------------------------------------------
      DELETE API
      ------------------------------------------
      */

      const response =
        await api.delete(
          `/notes/${note._id}`
        );

      /*
      ------------------------------------------
      REMOVE FROM UI
      ------------------------------------------
      */

      setNotes(
        (currentNotes) =>
          currentNotes.filter(
            (item) =>
              item._id !== note._id
          )
      );

      /*
      ------------------------------------------
      SUCCESS MESSAGE
      ------------------------------------------
      */

      setActionSuccess(
        response.data.message ||
          "Note deleted successfully."
      );

      /*
      ------------------------------------------
      CLEAR SUCCESS MESSAGE
      ------------------------------------------
      */

      setTimeout(() => {
        setActionSuccess("");
      }, 3000);

    } catch (error) {
      console.error(
        "Delete note error:",
        error
      );

      setActionError(
        error.response?.data?.message ||
          "Failed to delete note."
      );

    } finally {
      setDeletingId(null);
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
              Loading your notes...
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  /*
  ==================================================
  PAGE ERROR
  ==================================================
  */

  if (error) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">

            <h2>
              Unable to load notes
            </h2>

            <p>
              {error}
            </p>

            <button
              onClick={() =>
                window.location.reload()
              }
            >
              Try Again
            </button>

          </div>
        </PageContainer>
      </>
    );
  }

  /*
  ==================================================
  MAIN PAGE
  ==================================================
  */

  return (
    <>
      <Navbar />

      <PageContainer>

        <div className="my-notes-page">

          {/* ======================================
              HEADER
          ====================================== */}

          <div className="my-notes-header">

            <div>

              <h1>
                My Notes
              </h1>

              <p>
                Manage the notes you have
                uploaded.
              </p>

            </div>

            <button
              className="my-notes-upload-button"
              onClick={() =>
                navigate("/upload")
              }
            >
              + Upload Note
            </button>

          </div>


          {/* ======================================
              ACTION SUCCESS
          ====================================== */}

          {actionSuccess && (
            <div className="my-notes-action-success">
              ✅ {actionSuccess}
            </div>
          )}


          {/* ======================================
              ACTION ERROR
          ====================================== */}

          {actionError && (
            <div className="my-notes-action-error">

              <span>
                ⚠️
              </span>

              <p>
                {actionError}
              </p>

              <button
                onClick={() =>
                  setActionError("")
                }
              >
                ×
              </button>

            </div>
          )}


          {/* ======================================
              EMPTY STATE
          ====================================== */}

          {notes.length === 0 ? (

            <div className="notes-message">

              <h2>
                No notes uploaded yet
              </h2>

              <p>
                Upload your first set of
                notes and share them with
                your college community.
              </p>

              <button
                onClick={() =>
                  navigate("/upload")
                }
              >
                Upload Your First Note
              </button>

            </div>

          ) : (

            <>

              {/* ==================================
                  SUMMARY
              ================================== */}

              <div className="my-notes-summary">

                <span>
                  Total uploads:{" "}
                  <strong>
                    {notes.length}
                  </strong>
                </span>

              </div>


              {/* ==================================
                  NOTES LIST
              ================================== */}

              <div className="my-notes-list">

                {notes.map((note) => (

                  <div
                    className="my-note-card"
                    key={note._id}
                  >

                    <div className="my-note-main">

                      {/* ============================
                          TITLE + STATUS
                      ============================ */}

                      <div className="my-note-title-row">

                        <h2>
                          {note.title}
                        </h2>

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


                      {/* ============================
                          SUBJECT / UNIT / TOPIC
                      ============================ */}

                      <p className="my-note-topic">

                        {note.subject?.code ||
                          "Subject"}

                        {" "}• Unit{" "}
                        {note.unit}

                        {" "}•{" "}
                        {note.topic}

                      </p>


                      {/* ============================
                          DESCRIPTION
                      ============================ */}

                      {note.description && (
                        <p className="my-note-description">
                          {note.description}
                        </p>
                      )}


                      {/* ============================
                          DETAILS
                      ============================ */}

                      <div className="my-note-details">

                        <span>
                          Semester{" "}
                          {note.semester}
                        </span>

                        <span>
                          Version{" "}
                          {note.version || 1}
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
                            {note.downloadCount ||
                              0}
                          </span>
                        )}

                      </div>


                      {/* ============================
                          REJECTION REASON
                      ============================ */}

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


                    {/* =================================
                        ACTIONS
                    ================================= */}

                    <div className="my-note-actions">

                      {/* =================================
                          APPROVED
                      ================================= */}

                      {note.status ===
                        "APPROVED" &&
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


                      {/* =================================
                          PENDING
                      ================================= */}

                      {note.status ===
                        "PENDING" && (

                        <span className="action-info">
                          Waiting for admin review
                        </span>

                      )}


                      {/* =================================
                          REJECTED
                      ================================= */}

                      {note.status ===
                        "REJECTED" && (

                        <span className="action-info">
                          Upload a corrected version
                        </span>

                      )}


                      {/* =================================
                          OUTDATED
                      ================================= */}

                      {note.status ===
                        "OUTDATED" && (

                        <span className="action-info">
                          Previous version
                        </span>

                      )}


                      {/* =================================
                          DELETE
                      ================================= */}

                      {canDeleteNote(note) && (

                        <button
                          className="my-note-delete-button"
                          onClick={() =>
                            handleDelete(note)
                          }
                          disabled={
                            deletingId ===
                            note._id
                          }
                        >

                          {deletingId ===
                          note._id
                            ? "Deleting..."
                            : "🗑 Delete"}

                        </button>

                      )}

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