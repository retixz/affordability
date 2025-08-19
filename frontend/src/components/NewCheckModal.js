import React, { useState } from 'react';
import axios from 'axios';
import './NewCheckModal.css';

const NewCheckModal = ({ onClose }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [secureLink, setSecureLink] = useState(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:3000/checks', {
        fullName,
        email,
      });

      if (response.status === 201) {
        setSecureLink(response.data.secureLink);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(secureLink).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const handleClose = () => {
    // Reset state when closing the modal after a link has been generated
    if (secureLink) {
        setFullName('');
        setEmail('');
        setSecureLink(null);
        setError(null);
        setIsLoading(false);
    }
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={handleClose}>&times;</button>
        {secureLink ? (
          <div className="success-view">
            <h3>Secure Link Generated</h3>
            <p>Share this secure link with your applicant to start the affordability check.</p>
            <div className="link-container">
              <input type="text" value={secureLink} readOnly />
              <button onClick={handleCopyLink}>
                {isCopied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
            <button className="done-button" onClick={handleClose}>Done</button>
          </div>
        ) : (
          <>
            <h3>New Affordability Check</h3>
            <p>Enter your applicant's details to generate a secure link.</p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Applicant's Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Applicant's Email Address</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <p className="error-message">{error}</p>}
              <div className="button-group">
                <button type="button" className="cancel-button" onClick={handleClose}>Cancel</button>
                <button type="submit" className="generate-button" disabled={isLoading}>
                  {isLoading ? 'Generating...' : 'Generate Secure Link'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default NewCheckModal;
