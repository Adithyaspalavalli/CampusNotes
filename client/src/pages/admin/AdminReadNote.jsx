import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import Navbar from "../../components/Navbar";
import PageContainer from "../../components/PageContainer";
import api from "../../services/api";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

// React-PDF worker configuration for Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function AdminReadNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  ==================================================
  LOAD NOTE + PDF
  ==================================================
  */

  useEffect(() => {
    let objectUrl = null;

    const loadNote = async () => {
      try {
        setLoading(true);
        setError("");

        /*
        ----------------------------------------------
        Get note information
        ----------------------------------------------
        */

        const noteResponse = await api.get(
          `/admin/notes/${id}/preview`
        );

        setNote(noteResponse.data.note);

        /*
        ----------------------------------------------
        Get protected PDF
        ----------------------------------------------
        */

        const pdfResponse = await api.get(
          `/admin/notes/${id}/read`,
          {
            responseType: "blob",
          }
        );

        /*
        ----------------------------------------------
        Create temporary browser URL
        ----------------------------------------------
        */

        objectUrl = URL.createObjectURL(
          pdfResponse.data
        );

        setPdfUrl(objectUrl);
      } catch (error) {
        console.error(
          "Failed to load admin PDF:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load PDF for review."
        );
      } finally {
        setLoading(false);
      }
    };

    loadNote();

    /*
    ----------------------------------------------
    Cleanup temporary PDF URL
    ----------------------------------------------
    */

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [id]);

  /*
  ==================================================
  PDF LOAD SUCCESS
  ==================================================
  */

  const handleDocumentLoadSuccess = ({
    numPages,
  }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  /*
  ==================================================
  PREVIOUS PAGE
  ==================================================
  */

  const goToPreviousPage = () => {
    setPageNumber((currentPage) =>
      Math.max(currentPage - 1, 1)
    );
  };

  /*
  ==================================================
  NEXT PAGE
  ==================================================
  */

  const goToNextPage = () => {
    setPageNumber((currentPage) =>
      Math.min(
        currentPage + 1,
        numPages || 1
      )
    );
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
            <p>Loading PDF for review...</p>
          </div>
        </PageContainer>
      </>
    );
  }

  /*
  ==================================================
  ERROR
  ==================================================
  */

  if (error) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">
            <h2>Unable to open PDF</h2>

            <p>{error}</p>

            <button
              onClick={() =>
                navigate(
                  `/admin/notes/${id}`
                )
              }
            >
              ← Back to Review
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

  if (!note || !pdfUrl) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>
              PDF could not be loaded.
            </p>
          </div>
        </PageContainer>
      </>
    );
  }

  /*
  ==================================================
  VIEWER
  ==================================================
  */

  return (
    <>
      <Navbar />

      <PageContainer>
        <div className="admin-reader-page">

          {/* Header */}

          <div className="admin-reader-header">
            <button
              className="admin-reader-back-button"
              onClick={() =>
                navigate(
                  `/admin/notes/${id}`
                )
              }
            >
              ← Back to Review
            </button>

            <div className="admin-reader-title">
              <h1>{note.title}</h1>

              <p>
                {note.subject?.code ||
                  "Subject"}{" "}
                • Unit {note.unit} • Version{" "}
                {note.version || 1}
              </p>
            </div>

            <span className="note-status status-pending">
              Pending Review
            </span>
          </div>

          {/* PDF */}

          <div className="admin-pdf-viewer">
            <Document
              file={pdfUrl}
              onLoadSuccess={
                handleDocumentLoadSuccess
              }
              onLoadError={(error) => {
                console.error(
                  "Admin PDF loading error:",
                  error
                );

                setError(
                  "Unable to display this PDF."
                );
              }}
              loading={
                <div className="pdf-loading">
                  Loading document...
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                renderTextLayer={true}
                renderAnnotationLayer={false}
                className="admin-pdf-page"
              />
            </Document>
          </div>

          {/* Custom Controls */}

          <div className="admin-pdf-controls">

            <button
              onClick={goToPreviousPage}
              disabled={pageNumber <= 1}
            >
              ← Previous
            </button>

            <span>
              Page {pageNumber}{" "}
              {numPages
                ? `of ${numPages}`
                : ""}
            </span>

            <button
              onClick={goToNextPage}
              disabled={
                !numPages ||
                pageNumber >= numPages
              }
            >
              Next →
            </button>

          </div>

        </div>
      </PageContainer>
    </>
  );
}

export default AdminReadNote;