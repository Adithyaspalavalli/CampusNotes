import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";

import Navbar from "../components/Navbar";
import PageContainer from "../components/PageContainer";
import api from "../services/api";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";


// PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();


function ReadNote() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);

  const [pdfUrl, setPdfUrl] = useState(null);

  const [numPages, setNumPages] = useState(null);

  const [pageNumber, setPageNumber] = useState(1);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");


  useEffect(() => {
    let objectUrl = null;


    const loadNote = async () => {
      try {
        setLoading(true);
        setError("");


        // -----------------------------
        // Get note details
        // -----------------------------

        const noteResponse = await api.get(
          `/notes/${id}`
        );

        setNote(noteResponse.data.note);


        // -----------------------------
        // Get PDF
        // -----------------------------

        const pdfResponse = await api.get(
          `/notes/${id}/read`,
          {
            responseType: "blob",
          }
        );


        // -----------------------------
        // Create temporary PDF URL
        // -----------------------------

        objectUrl = URL.createObjectURL(
          pdfResponse.data
        );

        setPdfUrl(objectUrl);

      } catch (error) {
        console.error(
          "Failed to load note:",
          error
        );

        setError(
          error.response?.data?.message ||
            "Failed to load this note."
        );

      } finally {
        setLoading(false);
      }
    };


    loadNote();


    // Cleanup
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };

  }, [id]);


  // -----------------------------
  // PDF loaded
  // -----------------------------

  const handleDocumentLoadSuccess = ({
    numPages,
  }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };


  // -----------------------------
  // Previous page
  // -----------------------------

  const goToPreviousPage = () => {
    setPageNumber((current) =>
      Math.max(current - 1, 1)
    );
  };


  // -----------------------------
  // Next page
  // -----------------------------

  const goToNextPage = () => {
    setPageNumber((current) =>
      Math.min(
        current + 1,
        numPages || 1
      )
    );
  };


  // -----------------------------
  // Loading
  // -----------------------------

  if (loading) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>
              Opening note...
            </p>
          </div>
        </PageContainer>
      </>
    );
  }


  // -----------------------------
  // Error
  // -----------------------------

  if (error) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message error-box">

            <h2>
              Unable to open note
            </h2>

            <p>
              {error}
            </p>

            <button
              onClick={() =>
                navigate("/notes")
              }
            >
              Back to Notes
            </button>

          </div>
        </PageContainer>
      </>
    );
  }


  if (!note || !pdfUrl) {
    return (
      <>
        <Navbar />

        <PageContainer>
          <div className="notes-message">
            <p>
              Note could not be loaded.
            </p>
          </div>
        </PageContainer>
      </>
    );
  }


  return (
    <>
      <Navbar />

      <PageContainer>

        {/* ========================= */}
        {/* READER HEADER */}
        {/* ========================= */}

        <div className="reader-header">

          <button
            className="back-button"
            onClick={() =>
              navigate("/notes")
            }
          >
            ← Back to Notes
          </button>


          <div className="reader-title">

            <h1>
              {note.title}
            </h1>

            <p>
              {note.subject?.name ||
                note.subject?.code ||
                "Subject"}{" "}
              • Unit {note.unit} • Version{" "}
              {note.version || 1}
            </p>

          </div>

        </div>


        {/* ========================= */}
        {/* PDF VIEWER */}
        {/* ========================= */}

        <div className="campus-pdf-viewer">

          <Document
            file={pdfUrl}
            onLoadSuccess={
              handleDocumentLoadSuccess
            }
            onLoadError={(error) => {
              console.error(
                "PDF loading error:",
                error
              );

              setError(
                "Unable to display PDF."
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
              className="campus-pdf-page"
            />

          </Document>

        </div>


        {/* ========================= */}
        {/* OUR CONTROLS ONLY */}
        {/* ========================= */}

        <div className="pdf-controls">

          <button
            onClick={
              goToPreviousPage
            }
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

      </PageContainer>
    </>
  );
}

export default ReadNote;