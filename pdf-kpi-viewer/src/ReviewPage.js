// src/ReviewPage.js
import React, { useState, useEffect, useRef } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';

const ReviewPage = () => {
  const [kpis, setKpis] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pdfError, setPdfError] = useState(null);
  const [scale, setScale] = useState(1.0);
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

  const zoomIn = () => {
    setScale(scale + 0.2);
  };

  const zoomOut = () => {
    setScale(scale - 0.2);
  };

  const fitToScreen = () => {
    if (pdfViewerRef.current) {
      const containerWidth = pdfViewerRef.current.clientWidth;
      const pageWidth = 595.28*4; // Default width of an A4 page in points
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
              onClick={() => handleKpiClick(kpi)}
              className={selectedKpi === kpi.kpi_id ? 'selected' : 'not-selected'}
            >
              {kpi.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReviewPage;