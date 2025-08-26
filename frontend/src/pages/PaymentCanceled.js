import React from 'react';
import { Link } from 'react-router-dom';

const PaymentCanceled = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
            <div className="p-10 bg-white rounded-lg shadow-md text-center">
                <h1 className="text-2xl font-bold text-red-600 mb-4">Payment Canceled</h1>
                <p className="text-gray-700 mb-6">Your subscription process was canceled. You can return to the pricing page to try again.</p>
                <Link to="/billing" className="px-6 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
                    Back to Pricing
                </Link>
            </div>
        </div>
    );
};

export default PaymentCanceled;
