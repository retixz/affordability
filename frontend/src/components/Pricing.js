import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStripe } from '@stripe/react-stripe-js';
import api from '../api';

const Pricing = () => {
    const stripe = useStripe();
    const navigate = useNavigate();
    const token = localStorage.getItem('authToken');

    const handleChoosePlan = async (priceId) => {
        if (!token) {
            navigate('/register');
            return;
        }

        try {
            const response = await api.post('/create-checkout-session', { priceId });
            const { sessionId } = response.data;
            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
                console.error('Stripe checkout error:', error);
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
        }
    };

    const plans = [
        { name: 'Starter', price: '$29', checks: 5, features: ['Email support'], priceId: 'price_1S01GcDle4cCh3dRWBh0E0Mi', buttonText: 'Get Started', popular: false },
        { name: 'Pro', price: '$79', checks: 20, features: ['Priority email support', 'API Access'], priceId: 'price_1S01H7Dle4cCh3dRr9Lm4crU', buttonText: 'Choose Pro', popular: true },
        { name: 'Business', price: '$149', checks: 50, features: ['Phone & email support', 'Team member access'], priceId: 'price_1S01HQDle4cCh3dRvyf26eGq', buttonText: 'Get Started', popular: false },
    ];

    return (
        <section className="py-20 px-6">
            <div className="container mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
                    <p className="text-gray-600">Choose the plan that's right for you. Cancel anytime.</p>
                </div>
                <div className="grid lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`border rounded-lg p-8 flex flex-col ${plan.popular ? 'border-2 border-indigo-600' : ''}`}>
                            {plan.popular && <div className="absolute top-0 -translate-y-1/2 bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">Most Popular</div>}
                            <h3 className="text-2xl font-bold mb-4">{plan.name}</h3>
                            <div className="text-4xl font-bold mb-4">
                                {plan.price}<span className="text-lg font-normal text-gray-500">/mo</span>
                            </div>
                            <ul className="text-gray-600 mb-8 flex-grow">
                                <li className="mb-2">{plan.checks} Checks per month</li>
                                {plan.features.map((feature) => <li key={feature} className="mb-2">{feature}</li>)}
                            </ul>
                            <button onClick={() => handleChoosePlan(plan.priceId)} className={`w-full text-center font-bold py-3 px-6 rounded-lg ${plan.popular ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}>
                                {token ? plan.buttonText : 'Sign Up'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Pricing;
