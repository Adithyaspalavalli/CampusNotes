import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

function ManageSubjects() {
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] =
    useState(null);

  const [selectedSemester, setSelectedSemester] =
    useState("ALL");

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    semester: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/master/subjects"
      );

      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error(
        "Failed to fetch subjects:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load subjects."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      semester: "",
    });

    setEditingSubjectId(null);
    setShowAddForm(false);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleAddSubject = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !formData.name.trim() ||
      !formData.code.trim() ||
      !formData.semester
    ) {
      setError(
        "Please provide subject name, code and semester."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        "/master/subjects",
        {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          semester: Number(formData.semester),
        }
      );

      const newSubject = response.data.subject;

      setSubjects((currentSubjects) =>
        [...currentSubjects, newSubject].sort(
          (a, b) =>
            a.semester - b.semester ||
            a.name.localeCompare(b.name)
        )
      );

      setMessage(
        response.data.message ||
          "Subject created successfully."
      );

      resetForm();
    } catch (error) {
      console.error(
        "Create subject error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to create subject."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (subject) => {
    setMessage("");
    setError("");

    setEditingSubjectId(subject._id);

    setFormData({
      name: subject.name || "",
      code: subject.code || "",
      semester: String(
        subject.semester || ""
      ),
    });

    setShowAddForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleUpdateSubject = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      !formData.name.trim() ||
      !formData.code.trim() ||
      !formData.semester
    ) {
      setError(
        "Please provide subject name, code and semester."
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.put(
        `/master/subjects/${editingSubjectId}`,
        {
          name: formData.name.trim(),
          code: formData.code.trim().toUpperCase(),
          semester: Number(formData.semester),
        }
      );

      const updatedSubject =
        response.data.subject;

      setSubjects((currentSubjects) =>
        currentSubjects
          .map((subject) =>
            subject._id === editingSubjectId
              ? updatedSubject
              : subject
          )
          .sort(
            (a, b) =>
              a.semester - b.semester ||
              a.name.localeCompare(b.name)
          )
      );

      setMessage(
        response.data.message ||
          "Subject updated successfully."
      );

      resetForm();
    } catch (error) {
      console.error(
        "Update subject error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update subject."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (subject) => {
    const action = subject.isActive
      ? "disable"
      : "enable";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} "${subject.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setTogglingId(subject._id);
      setMessage("");
      setError("");

      const response = await api.put(
        `/master/subjects/${subject._id}/toggle-status`
      );

      const updatedSubject = response.data.subject;

      setSubjects((currentSubjects) =>
        currentSubjects.map((item) =>
          item._id === subject._id
            ? {
                ...item,
                name:
                  updatedSubject.name,
                code:
                  updatedSubject.code,
                semester:
                  updatedSubject.semester,
                isActive:
                  updatedSubject.isActive,
              }
            : item
        )
      );

      setMessage(
        response.data.message ||
          "Subject status updated successfully."
      );
    } catch (error) {
      console.error(
        "Toggle subject status error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to update subject status."
      );
    } finally {
      setTogglingId(null);
    }
  };

  const filteredSubjects =
    selectedSemester === "ALL"
      ? subjects
      : subjects.filter(
          (subject) =>
            subject.semester ===
            Number(selectedSemester)
        );

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>Loading subjects...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  if (error && subjects.length === 0) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>Unable to load subjects</h2>

            <p>{error}</p>

            <button onClick={fetchSubjects}>
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
        <div className="manage-subjects-page">

          {/* HEADER */}
          <div className="manage-subjects-header">
            <div>
              <button
                className="back-link"
                onClick={() =>
                  navigate("/master")
                }
              >
                ← Master Dashboard
              </button>

              <h1>Manage Subjects</h1>

              <p>
                Create, edit and manage subjects
                available on CampusNotes.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={() => {
                setMessage("");
                setError("");

                if (editingSubjectId) {
                  resetForm();
                } else {
                  setShowAddForm(
                    (current) => !current
                  );
                }
              }}
            >
              {showAddForm
                ? "✕ Close"
                : "+ Add Subject"}
            </button>
          </div>

          {/* MESSAGES */}
          {message && (
            <div className="master-subject-success">
              <span>✓</span>
              <p>{message}</p>
            </div>
          )}

          {error && (
            <div className="master-subject-error">
              <span>!</span>
              <p>{error}</p>
            </div>
          )}

          {/* ADD / EDIT FORM */}
          {showAddForm && (
            <div className="master-subject-form-card">

              <div className="master-subject-form-header">
                <div>
                  <h2>
                    {editingSubjectId
                      ? "Edit Subject"
                      : "Add New Subject"}
                  </h2>

                  <p>
                    {editingSubjectId
                      ? "Update the subject information."
                      : "Add a new subject to CampusNotes."}
                  </p>
                </div>
              </div>

              <form
                onSubmit={
                  editingSubjectId
                    ? handleUpdateSubject
                    : handleAddSubject
                }
              >
                <div className="master-subject-form-grid">

                  <div className="master-subject-form-group">
                    <label htmlFor="subject-name">
                      Subject Name
                    </label>

                    <input
                      id="subject-name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={
                        handleInputChange
                      }
                      placeholder="e.g. Database Management Systems"
                      maxLength={150}
                      disabled={submitting}
                    />
                  </div>

                  <div className="master-subject-form-group">
                    <label htmlFor="subject-code">
                      Subject Code
                    </label>

                    <input
                      id="subject-code"
                      name="code"
                      type="text"
                      value={formData.code}
                      onChange={
                        handleInputChange
                      }
                      placeholder="e.g. DBMS"
                      maxLength={30}
                      disabled={submitting}
                    />

                    <small>
                      The code will be saved in
                      uppercase.
                    </small>
                  </div>

                  <div className="master-subject-form-group">
                    <label htmlFor="subject-semester">
                      Semester
                    </label>

                    <select
                      id="subject-semester"
                      name="semester"
                      value={formData.semester}
                      onChange={
                        handleInputChange
                      }
                      disabled={submitting}
                    >
                      <option value="">
                        Select semester
                      </option>

                      {Array.from(
                        { length: 8 },
                        (_, index) => (
                          <option
                            key={index + 1}
                            value={index + 1}
                          >
                            Semester{" "}
                            {index + 1}
                          </option>
                        )
                      )}
                    </select>
                  </div>

                </div>

                <div className="master-subject-form-actions">

                  <button
                    type="button"
                    className="master-subject-cancel-button"
                    onClick={resetForm}
                    disabled={submitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="master-subject-save-button"
                    disabled={submitting}
                  >
                    {submitting
                      ? "Saving..."
                      : editingSubjectId
                      ? "Save Changes"
                      : "Create Subject"}
                  </button>

                </div>
              </form>
            </div>
          )}

          {/* FILTER */}
          <div className="subjects-toolbar">

            <div>
              <h2>Subjects</h2>

              <p>
                {filteredSubjects.length} of{" "}
                {subjects.length} subjects
              </p>
            </div>

            <select
              value={selectedSemester}
              onChange={(event) =>
                setSelectedSemester(
                  event.target.value
                )
              }
              className="subject-filter"
            >
              <option value="ALL">
                All Semesters
              </option>

              {Array.from(
                { length: 8 },
                (_, index) => (
                  <option
                    key={index + 1}
                    value={index + 1}
                  >
                    Semester {index + 1}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SUBJECT LIST */}
          {filteredSubjects.length === 0 ? (
            <div className="subjects-empty">
              No subjects found.
            </div>
          ) : (
            <div className="subjects-grid">

              {filteredSubjects.map(
                (subject) => (
                  <div
                    className="subject-card"
                    key={subject._id}
                  >

                    <div className="subject-card-top">
                      <div>
                        <h3>{subject.name}</h3>

                        <span className="subject-code">
                          {subject.code}
                        </span>
                      </div>

                      <span
                        className={
                          subject.isActive
                            ? "subject-status active"
                            : "subject-status inactive"
                        }
                      >
                        {subject.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>

                    </div>

                    <div className="subject-semester">
                      Semester {subject.semester}
                    </div>

                    <div className="subject-actions">

                      <button
                        className="secondary-button"
                        onClick={() =>
                          startEditing(
                            subject
                          )
                        }
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className={
                          subject.isActive
                            ? "danger-outline-button"
                            : "success-outline-button"
                        }
                        disabled={
                          togglingId ===
                          subject._id
                        }
                        onClick={() =>
                          handleToggleStatus(
                            subject
                          )
                        }
                      >
                        {togglingId ===
                        subject._id
                          ? "Updating..."
                          : subject.isActive
                          ? "Disable"
                          : "Enable"}
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </div>
      </PageContainer>
    </>
  );
}

export default ManageSubjects;