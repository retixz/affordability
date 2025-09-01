import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from 'react-icons/fa';
import ReportFlags from './ReportFlags';
import './ReportView.css';
import './ReportFlags.css';

const ReportView = () => {
  const { applicantId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/reports/${applicantId}`);
        setReportData(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'An unexpected error occurred while fetching the report.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReport();
  }, [applicantId]);

  if (isLoading) {
    return <div className="report-view loading">Loading Report...</div>;
  }

  if (error) {
    return <div className="report-view error">Error: {error}</div>;
  }

  if (!reportData) {
    return <div className="report-view">No report data available.</div>;
  }

  const {
    applicantName,
    affordabilityScore,
    verifiedIncomeMonthly,
    verifiedExpensesMonthly,
    accountSummary,
    flags
  } = reportData;

  const score = parseFloat(affordabilityScore);

  const getScoreIcon = () => {
    if (score >= 7.0) {
      return <FaCheckCircle className="icon green" />;
    } else if (score < 4.0) {
      return <FaTimesCircle className="icon red" />;
    } else {
      return <FaInfoCircle className="icon yellow" />;
    }
  };

  return (
    <div className="report-view">
      <header className="report-header">
        <h1>Financial Health Report for {applicantName}</h1>
      </header>
      <main className="report-main">
        <ReportFlags flags={flags} />

        <div className="score-card">
            <div className="score-icon">
                {getScoreIcon()}
            </div>
            <div className="score-details">
                <h2>Affordability Score</h2>
                <p className="score-value">{score.toFixed(2)} / 10.00</p>
            </div>
        </div>
        <div className="details-card">
            <h3>Financial Summary</h3>
            <div className="detail-item">
                <span className="label">Verified Monthly Income</span>
                <span className="value">£{parseFloat(verifiedIncomeMonthly).toFixed(2)}</span>
            </div>
            <div className="detail-item">
                <span className="label">Verified Recurring Expenses</span>
                <span className="value">£{parseFloat(verifiedExpensesMonthly).toFixed(2)}</span>
            </div>
        </div>
        <div className="details-card context-card">
            <h3>Account Context</h3>
             <div className="detail-item">
                <span className="label">Connected Accounts</span>
                <span className="value">{accountSummary.connectedAccounts}</span>
            </div>
            <div className="detail-item">
                <span className="label">Total Transactions (90 days)</span>
                <span className="value">{accountSummary.totalTransactions}</span>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ReportView;
