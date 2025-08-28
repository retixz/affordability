import React from 'react';
import './ApplicantPortal.css';

const SaltEdgeReturn = () => {
  return (
    <div className="portal-container">
      <div className="portal-header">
        <h1>Thank you!</h1>
      </div>
      <div className="portal-body">
        <p>
          Your bank account has been connected successfully. We are now analyzing your data to generate the affordability report.
        </p>
        <p>
          You can now close this window.
        </p>
      </div>
    </div>
  );
};

export default SaltEdgeReturn;
