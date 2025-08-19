import React from 'react';
import './ApplicantPortal.css'; // Re-using styles for simplicity

const SuccessPage = () => {
  return (
    <div className="portal-container">
      <div className="portal-header">
        <h1>Thank you!</h1>
      </div>
      <div className="portal-body">
        <p>Your bank account has been connected successfully.</p>
        <p>You can now close this window.</p>
      </div>
    </div>
  );
};

export default SuccessPage;
