import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

function Notes() {
  const [notes, setNotes] = useState([]);

  const [search, setSearch] = useState("");
  const [semester, setSemester] = useState("");
  const [subject, setSubject] = useState("");
  const [unit, setUnit] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/notes");

        setNotes(response.data.notes || []);
      } catch (error) {
        console.error("Failed to fetch notes:", error);

        setError(
          error.response?.data?.message ||
            "Failed to load notes. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  /*
   * Get unique subjects from the notes returned
   * by the backend.
   */
  const subjects = useMemo(() => {
    const subjectMap = new Map();

    notes.forEach((note) => {
      if (note.subject?._id) {
        subjectMap.set(
          note.subject._id,
          note.subject
        );
      }
    });

    return Array.from(subjectMap.values()).sort(
      (a, b) =>
        a.name.localeCompare(b.name)
    );
  }, [notes]);

  /*
   * Filter notes
   */
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const searchText =
        search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        note.title
          ?.toLowerCase()
          .includes(searchText) ||
        note.topic
          ?.toLowerCase()
          .includes(searchText) ||
        note.description
          ?.toLowerCase()
          .includes(searchText) ||
        note.subject?.name
          ?.toLowerCase()
          .includes(searchText);

      const matchesSemester =
        !semester ||
        String(note.semester) === semester;

      const matchesSubject =
        !subject ||
        note.subject?._id === subject;

      const matchesUnit =
        !unit ||
        String(note.unit) === unit;

      return (
        matchesSearch &&
        matchesSemester &&
        matchesSubject &&
        matchesUnit
      );
    });
  }, [
    notes,
    search,
    semester,
    subject,
    unit,
  ]);

  /*
   * Download note
   */
  const handleDownload = async (note) => {
    try {
      const response = await api.get(
        `/notes/${note._id}/download`,
        {
          responseType: "blob",
        }
      );

      const blobUrl =
        window.URL.createObjectURL(
          new Blob([response.data])
        );

      const link =
        document.createElement("a");

      link.href = blobUrl;

      link.download =
        note.fileName || "campusnotes.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error(
        "Download failed:",
        error
      );

      alert(
        "Unable to download this note."
      );
    }
  };

  /*
   * Clear all filters
   */
  const clearFilters = () => {
    setSearch("");
    setSemester("");
    setSubject("");
    setUnit("");
  };

  return (
    <>
      <Navbar />

      <PageContainer>

        {/* Page Header */}

        <section className="notes-header">
          <div>
            <h1>Find Your Notes</h1>

            <p>
              Search and download study materials
              shared by your campus community.
            </p>
          </div>
        </section>


        {/* Search & Filters */}

        <section className="notes-filters">

          {/* Search */}

          <div className="search-box">

            <span>🔍</span>

            <input
              type="text"
              placeholder="Search notes, topics or subjects..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          {/* Filters */}

          <div className="filter-grid">

            <select
              value={semester}
              onChange={(e) =>
                setSemester(e.target.value)
              }
            >
              <option value="">
                All Semesters
              </option>

              {[1, 2, 3, 4, 5, 6, 7, 8].map(
                (sem) => (
                  <option
                    key={sem}
                    value={sem}
                  >
                    Semester {sem}
                  </option>
                )
              )}
            </select>


            <select
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
            >
              <option value="">
                All Subjects
              </option>

              {subjects.map((item) => (
                <option
                  key={item._id}
                  value={item._id}
                >
                  {item.name}
                </option>
              ))}
            </select>


            <select
              value={unit}
              onChange={(e) =>
                setUnit(e.target.value)
              }
            >
              <option value="">
                All Units
              </option>

              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    Unit {item}
                  </option>
                )
              )}
            </select>

          </div>


          {/* Active filters */}

          {(search ||
            semester ||
            subject ||
            unit) && (
            <button
              className="clear-filters"
              onClick={clearFilters}
            >
              Clear Filters
            </button>
          )}

        </section>


        {/* Results */}

        <section className="notes-results">

          {loading && (
            <div className="notes-message">
              <p>Loading notes...</p>
            </div>
          )}


          {!loading && error && (
            <div className="notes-message error-box">
              <p>{error}</p>

              <button
                onClick={() =>
                  window.location.reload()
                }
              >
                Try Again
              </button>
            </div>
          )}


          {!loading &&
            !error &&
            filteredNotes.length === 0 && (
              <div className="notes-message">
                <div className="empty-icon">
                  📚
                </div>

                <h2>
                  No notes found
                </h2>

                <p>
                  Try changing your search or
                  filters.
                </p>
              </div>
            )}


          {!loading &&
            !error &&
            filteredNotes.length > 0 && (
              <>
                <div className="results-header">
                  <h2>
                    Available Notes
                  </h2>

                  <span>
                    {filteredNotes.length}{" "}
                    {filteredNotes.length === 1
                      ? "note"
                      : "notes"}
                  </span>
                </div>


                <div className="notes-grid">

                  {filteredNotes.map(
                    (note) => (
                      <article
                        className="note-card"
                        key={note._id}
                      >

                        <div className="note-card-top">

                          <span className="note-subject">
                            {note.subject?.code ||
                              note.subject?.name ||
                              "Subject"}
                          </span>

                          <span className="note-version">
                            v{note.version || 1}
                          </span>

                        </div>


                        <h3>
                          {note.title}
                        </h3>


                        <p className="note-topic">
                          {note.topic}
                        </p>


                        {note.description && (
                          <p className="note-description">
                            {note.description}
                          </p>
                        )}


                        <div className="note-meta">

                          <span>
                            Semester{" "}
                            {note.semester}
                          </span>

                          <span>
                            Unit {note.unit}
                          </span>

                        </div>


                        <div className="note-card-footer">

                          <span className="note-uploader">
                            By{" "}
                            {note.uploadedBy?.name ||
                              "Student"}
                          </span>

                          <div className="note-actions">

                            <button
                              className="read-button"
                              onClick={() =>
                                window.location.href =
                                  `/notes/${note._id}/read`
                              }
                            >
                              📖 Read
                            </button>

                            <button
                              className="download-button"
                              onClick={() =>
                                handleDownload(note)
                              }
                            >
                              ⬇ Download
                            </button>

                          </div>

                        </div>

                      </article>
                    )
                  )}

                </div>
              </>
            )}

        </section>

      </PageContainer>
    </>
  );
}

export default Notes;