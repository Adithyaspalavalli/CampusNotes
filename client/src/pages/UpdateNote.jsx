import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

function UpdateNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchNote = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/notes/${id}`);

        const currentNote = response.data.note;

        if (
          currentNote.status !== "APPROVED" ||
          !currentNote.isCurrent
        ) {
          setError(
            "Only the current approved version can be updated."
          );
          return;
        }

        setNote(currentNote);
      } catch (error) {
        console.error("Failed to load note:", error);

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

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      setFile(null);
      return;
    }

    const maxSize = 10 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setError("PDF file size must not exceed 10 MB.");
      event.target.value = "";
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!file) {
      setError("Please select the new PDF file.");
      return;
    }

    try {
      setUploading(true);

      const data = new FormData();

      data.append("file", file);

      const response = await api.post(
        `/notes/${id}/version`,
        data
      );

      setSuccess(
        response.data.message ||
          "New version uploaded successfully and sent for approval."
      );

      setFile(null);

      const fileInput =
        document.getElementById("new-note-file");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Create note version error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to upload new version."
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading note...</p>
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
            <h2>Unable to update note</h2>

            <p>{error}</p>

            <button
              onClick={() => navigate("/my-notes")}
            >
              Back to My Notes
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
        <div className="upload-page">
          <div className="upload-header">
            <h1>Update Note</h1>

            <p>
              Upload a new PDF version of your note.
            </p>
          </div>

          {error && (
            <div className="upload-message upload-error">
              <div className="upload-message-icon">
                ⚠️
              </div>

              <div>
                <strong>Upload Error</strong>
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
                <strong>Version Submitted</strong>
                <p>{success}</p>
              </div>
            </div>
          )}

          <div className="update-note-card">
            <h2>{note.title}</h2>

            <p>
              {note.subject?.code ||
                "Subject"}{" "}
              • Unit {note.unit} • {note.topic}
            </p>

            <div className="update-note-info">
              <span>
                Current version:{" "}
                <strong>
                  v{note.version || 1}
                </strong>
              </span>

              <span>
                Status:{" "}
                <strong>Approved</strong>
              </span>
            </div>
          </div>

          <form
            className="upload-form"
            onSubmit={handleSubmit}
          >
            <div className="upload-info">
              <strong>How versioning works</strong>

              <p>
                Your existing approved version will remain
                available while the new version is reviewed.
                If approved, the new version will become the
                current version and the old version will become
                outdated.
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="new-note-file">
                New PDF File <span>*</span>
              </label>

              <input
                id="new-note-file"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                required
              />

              <small>
                PDF only • Maximum size: 10 MB
              </small>

              {file && (
                <div className="selected-file">
                  📄 {file.name}
                </div>
              )}
            </div>

            <div className="upload-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate("/my-notes")}
                disabled={uploading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="upload-button"
                disabled={uploading}
              >
                {uploading
                  ? "Uploading..."
                  : "Submit New Version"}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}

export default UpdateNote;