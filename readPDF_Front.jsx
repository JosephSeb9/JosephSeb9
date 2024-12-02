import React, { useState, useEffect } from 'react';
import { Document, Page } from 'react-pdf';
import axios from 'axios';

const ReviewPage = () => {
  const [kpis, setKpis] = useState([]);
  const [selectedKpi, setSelectedKpi] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

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
    setSelectedKpi(kpi);
    const [filename, page] = kpi.source.split(':');
    setPdfFile(`/api/pdfs/${filename}`);
    setPageNumber(parseInt(page, 10));
  };

  return (
    <div className="review-page">
      <div className="pdf-viewer">
        {pdfFile && (
          <Document file={pdfFile}>
            <Page pageNumber={pageNumber} />
          </Document>
        )}
      </div>
      <div className="kpi-list">
        {kpis.map(kpi => (
          <div key={kpi.kpi_id} onClick={() => handleKpiClick(kpi)}>
            {kpi.name}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReviewPage;
