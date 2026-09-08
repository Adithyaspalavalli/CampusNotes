import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

function UploadNote() {
  const navigate = useNavigate();
  const messageRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    semester: "",
    subject: "",
    unit: "",
    topic: "",
  });

  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch active subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoadingSubjects(true);
        setError("");

        const response = await api.get("/subjects");

        setSubjects(response.data.subjects || []);
      } catch (error) {
        console.error("Failed to fetch subjects:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load subjects."
        );
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  useEffect(() => {
    if (error || success) {
      messageRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [error, success]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setError("");
    setSuccess("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    // Check file type
    if (selectedFile.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      setFile(null);
      return;
    }

    // 10 MB limit
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

    // Basic validation
    if (
      !formData.title ||
      !formData.semester ||
      !formData.subject ||
      !formData.unit ||
      !formData.topic
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    try {
      setLoading(true);

      const data = new FormData();

      data.append("title", formData.title);
      data.append("description", formData.description);
      data.append("semester", formData.semester);
      data.append("subject", formData.subject);
      data.append("unit", formData.unit);
      data.append("topic", formData.topic);
      data.append("file", file);

      const response = await api.post("/notes", data);

      setSuccess(
        response.data.message ||
          "Note uploaded successfully and sent for approval."
      );

      // Clear form
      setFormData({
        title: "",
        description: "",
        semester: "",
        subject: "",
        unit: "",
        topic: "",
      });

      setFile(null);

      // Reset file input
      const fileInput = document.getElementById("note-file");

      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Upload note error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to upload note."
      );
    } finally {
      setLoading(false);
    }
  };

  // Subjects belonging to selected semester
  const filteredSubjects = subjects.filter(
    (subject) =>
      !formData.semester ||
      Number(subject.semester) === Number(formData.semester)
  );

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="upload-page">
          <div className="upload-header">
            <h1>Upload Notes</h1>

            <p>
              Share useful study material with your
              college community.
            </p>
          </div>

          {(error || success) && (
            <div
              ref={messageRef}
              className={`upload-message ${
                error ? "upload-error" : "upload-success"
              }`}
              role="alert"
              aria-live="polite"
            >
              <div className="upload-message-icon">
                {error ? "⚠️" : "✅"}
              </div>

              <div>
                <strong>
                  {error ? "Upload Error" : "Upload Successful"}
                </strong>

                <p>{error || success}</p>
              </div>
            </div>
          )}

          <form
            className="upload-form"
            onSubmit={handleSubmit}
          >
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">
                Title <span>*</span>
              </label>

              <input
                id="title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="Example: DBMS Unit 3 Notes"
                maxLength={150}
                required
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe these notes..."
                maxLength={1000}
                rows={4}
              />

              <small>
                {formData.description.length}/1000
              </small>
            </div>

            {/* Semester + Subject */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="semester">
                  Semester <span>*</span>
                </label>

                <select
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select semester
                  </option>

                  {[1, 2, 3, 4, 5, 6, 7, 8].map(
                    (semester) => (
                      <option
                        key={semester}
                        value={semester}
                      >
                        Semester {semester}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subject">
                  Subject <span>*</span>
                </label>

                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  disabled={
                    !formData.semester ||
                    loadingSubjects
                  }
                  required
                >
                  <option value="">
                    {loadingSubjects
                      ? "Loading subjects..."
                      : !formData.semester
                      ? "Select semester first"
                      : "Select subject"}
                  </option>

                  {filteredSubjects.map((subject) => (
                    <option
                      key={subject._id}
                      value={subject._id}
                    >
                      {subject.code} - {subject.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Unit + Topic */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="unit">
                  Unit <span>*</span>
                </label>

                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={handleChange}
                  required
                >
                  <option value="">
                    Select unit
                  </option>

                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                    (unit) => (
                      <option key={unit} value={unit}>
                        Unit {unit}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="topic">
                  Topic <span>*</span>
                </label>

                <input
                  id="topic"
                  name="topic"
                  type="text"
                  value={formData.topic}
                  onChange={handleChange}
                  placeholder="Example: Normalization"
                  maxLength={150}
                  required
                />
              </div>
            </div>

            {/* PDF */}
            <div className="form-group">
              <label htmlFor="note-file">
                PDF File <span>*</span>
              </label>

              <input
                id="note-file"
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

            {/* Information */}
            <div className="upload-info">
              <strong>Important:</strong>

              <p>
                Your note will be submitted for admin
                approval. It will become visible to other
                students only after approval.
              </p>
            </div>

            {/* Buttons */}
            <div className="upload-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate("/notes")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="upload-button"
                disabled={loading || loadingSubjects}
              >
                {loading
                  ? "Uploading..."
                  : "Upload Note"}
              </button>
            </div>
          </form>
        </div>
      </PageContainer>
    </>
  );
}

export default UploadNote;