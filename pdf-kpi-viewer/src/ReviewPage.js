// src/ReviewPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEdit } from '@fortawesome/free-solid-svg-icons';
import './App.css'; // Ensure you are importing the App.css file

const ReviewPage = () => {
  const [kpis, setKpis] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [editingKpi, setEditingKpi] = useState(null);
  const [summaryContent, setSummaryContent] = useState('');
  const pdfViewerRef = useRef(null);

  useEffect(() => {
    axios.get('/api/kpis')
      .then(response => {
        setKpis(response.data);
      })
      .catch(error => {
        console.error('Error fetching KPIs:', error);
      });
  }, []);

  const handleKpiClick = (kpi) => {
    setSelectedKpi(kpi.kpi_id);
    const [filename, page] = kpi.source.split(':');
    setPdfFile(`/api/pdfs/${filename.trim()}`);
    setPageNumber(parseInt(page, 10));
    setPdfError(null); // Reset error state
    fitToScreen(); // Apply fit to screen when a KPI is selected
  };

  const handleEditClick = (kpi) => {
    setEditingKpi(kpi.kpi_id);
    setSummaryContent(kpi.summary);
  };

  const handleSummaryChange = (event) => {
    setSummaryContent(event.target.value);
  };

  const handleSummarySave = () => {
    axios.post(`/api/kpis/${editingKpi}`, { summary: summaryContent })
      .then(response => {
        setKpis(kpis.map(kpi => kpi.kpi_id === editingKpi ? { ...kpi, summary: summaryContent } : kpi));
        setEditingKpi(null);
      })
      .catch(error => {
        console.error('Error saving summary:', error);
      });
  };

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(scale - 0.2);
  };

  const fitToScreen = () => {
    if (pdfViewerRef.current) {
      const containerWidth = pdfViewerRef.current.clientWidth;
      const pageWidth = 595.28 * 4; // Default width of an A4 page in points
      const scaleX = containerWidth / pageWidth;
      setScale(scaleX);
    }
  };

  return (
    <div className="container">
      <div className="pdf-viewer-container">
        <h2>View PDF</h2>
        <div className="pdf-controls">
          <button onClick={zoomOut}>-</button>
          <button onClick={fitToScreen}>Fit</button>
          <button onClick={zoomIn}>+</button>
        </div>
        <div className="pdf-viewer" ref={pdfViewerRef}>
          {pdfFile ? (
            <Document
              file={pdfFile}
              onLoadError={(error) => {
                console.error('Error loading PDF:', error);
                setPdfError('Failed to load PDF file.');
              }}
            >
              <Page pageNumber={pageNumber} scale={scale} />
            </Document>
          ) : (
            <div>{pdfError || 'Select a KPI to view the PDF.'}</div>
          )}
        </div>
      </div>
      <div className="separator"></div>
      <div className="kpi-list-container">
        <h2>KPI List</h2>
        <div className="kpi-list">
          {kpis.map(kpi => (
            <div
              key={kpi.kpi_id}
              className={`kpi-item ${selectedKpi === kpi.kpi_id ? 'selected' : 'not-selected'}`}
            >
              <div className="kpi-left">
                <span>{kpi.name}</span>
                <button onClick={() => handleKpiClick(kpi)}>
                  <FontAwesomeIcon icon={faEye} />
                </button>
              </div>
              <div className="kpi-right">
                <button onClick={() => handleEditClick(kpi)}>
                  <FontAwesomeIcon icon={faEdit} />
                </button>
              </div>
              {editingKpi === kpi.kpi_id && (
                <div className="kpi-edit">
                  <textarea 
                    value={summaryContent} 
                    onChange={handleSummaryChange} 
                    style={{ height: 'auto' }}
                    rows={Math.max(3, summaryContent.split('\n').length)}
                  />
                  <button onClick={handleSummarySave}>Save</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;
