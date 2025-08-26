import React, { useState, useEffect } from 'react';
import api from '../services/api';

const Billing = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const response = await api.get('/subscription');
                setSubscription(response.data);
            } catch (error) {
                console.error('Error fetching subscription details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSubscription();
    }, []);

    const handleManageBilling = async () => {
        try {
            const response = await api.post('/create-portal-session');
            const { url } = response.data;
            window.location.href = url;
        } catch (error) {
            console.error('Error creating portal session:', error);
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-8">Billing</h1>
            {subscription ? (
                <div className="bg-white shadow-md rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Your Subscription</h2>
                    <p><strong>Plan:</strong> {subscription.plan}</p>
                    <p><strong>Status:</strong> {subscription.status}</p>
                    <button onClick={handleManageBilling} className="mt-4 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
                        Manage Billing
                    </button>
                </div>
            ) : (
                <p>You do not have an active subscription.</p>
            )}
        </div>
    );
};

export default Billing;
