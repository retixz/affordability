import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import './ReportFlags.css';

const ReportFlags = ({ flags }) => {
  if (!flags || flags.length === 0) {
    return null;
  }

  return (
    <div className="report-flags">
      <h3 className="flags-header">
        <FaExclamationTriangle className="icon" />
        Attention Required
      </h3>
      <ul className="flags-list">
        {flags.map((flag, index) => (
          <li key={index} className="flag-item">
            <strong>{flag.code.replace(/_/g, ' ')}:</strong> {flag.message}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ReportFlags;
