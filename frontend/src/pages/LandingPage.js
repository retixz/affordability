import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaPiggyBank, FaClock, FaChartLine } from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="bg-gray-50 text-gray-800">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-indigo-600">Affordability API</div>
        <nav>
          <Link to="/login" className="text-gray-600 hover:text-indigo-600 px-4">Login</Link>
          <Link to="/register" className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700">
            Sign Up for Free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="text-center py-20 px-6 bg-white">
        <h1 className="text-5xl font-bold mb-4">Stop Guessing. Start Verifying.</h1>
        <p className="text-xl text-gray-600 mb-8">Real-time Affordability Checks for Landlords. Leverage Open Banking to instantly verify an applicant's income and expenses, reducing your risk of missed rent payments.</p>
        <Link to="/register" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-indigo-700">
          Create Your First Check
        </Link>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl font-bold mb-2">How It Works</h2>
          <p className="text-gray-600 mb-12">A simple, 3-step process to get the insights you need.</p>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center">
              <div className="bg-indigo-100 p-6 rounded-full mb-4">
                <FaClock className="text-indigo-600 text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">1. Generate Link</h3>
              <p className="text-gray-600">Enter your applicant's details to create a unique, secure link.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-indigo-100 p-6 rounded-full mb-4">
                <FaPiggyBank className="text-indigo-600 text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">2. Applicant Connects</h3>
              <p className="text-gray-600">Your applicant uses the link to securely connect their bank account in 60 seconds. You never see their credentials.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-indigo-100 p-6 rounded-full mb-4">
                <FaChartLine className="text-indigo-600 text-4xl" />
              </div>
              <h3 className="text-xl font-bold mb-2">3. Get Report</h3>
              <p className="text-gray-600">Receive an instant, easy-to-read report with a clear Affordability Score.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features & Benefits Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Make Smarter Decisions, Faster</h2>
            <p className="text-gray-600">The benefits of automated, real-time verification.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Reduce Evictions</h3>
              <p className="text-gray-600">Make data-driven decisions to lower the risk of payment defaults.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Save Time</h3>
              <p className="text-gray-600">Replace manual document checks and phone calls with a fully automated process.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Increase Security</h3>
              <p className="text-gray-600">Eliminate the need to handle sensitive documents like payslips and bank statements.</p>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Fairer Assessment</h3>
              <p className="text-gray-600">Get a real-time view of affordability, not just an outdated credit score.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Signal */}
      <section className="bg-indigo-50 py-12 px-6">
        <div className="container mx-auto text-center flex justify-center items-center">
          <FaShieldAlt className="text-indigo-600 text-3xl mr-4" />
          <p className="text-gray-700">
            <strong>Bank-Level Security:</strong> We use industry-standard encryption and never see or store applicant credentials.
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-gray-600">Choose the plan that's right for you. Cancel anytime.</p>
          </div>
          <div className="grid lg:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Starter Plan */}
            <div className="border rounded-lg p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-4">Starter</h3>
              <div className="text-4xl font-bold mb-4">
                $29<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              <ul className="text-gray-600 mb-8 flex-grow">
                <li className="mb-2">5 Checks per month</li>
                <li className="mb-2">Email support</li>
              </ul>
              <Link to="/register" className="w-full text-center bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">
                Get Started
              </Link>
            </div>
            {/* Pro Plan */}
            <div className="border-2 border-indigo-600 rounded-lg p-8 flex flex-col relative">
              <div className="absolute top-0 -translate-y-1/2 bg-indigo-600 text-white text-sm font-bold px-3 py-1 rounded-full">Most Popular</div>
              <h3 className="text-2xl font-bold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-4">
                $79<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              <ul className="text-gray-600 mb-8 flex-grow">
                <li className="mb-2">20 Checks per month</li>
                <li className="mb-2">Priority email support</li>
                <li className="mb-2">API Access</li>
              </ul>
              <Link to="/register" className="w-full text-center bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700">
                Choose Pro
              </Link>
            </div>
            {/* Business Plan */}
            <div className="border rounded-lg p-8 flex flex-col">
              <h3 className="text-2xl font-bold mb-4">Business</h3>
               <div className="text-4xl font-bold mb-4">
                $149<span className="text-lg font-normal text-gray-500">/mo</span>
              </div>
              <ul className="text-gray-600 mb-8 flex-grow">
                <li className="mb-2">50 Checks per month</li>
                <li className="mb-2">Phone & email support</li>
                <li className="mb-2">Team member access</li>
              </ul>
              <Link to="/register" className="w-full text-center bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA / Footer */}
      <footer className="bg-gray-800 text-white py-12 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Reduce Your Risk?</h2>
          <p className="text-gray-400 mb-8">Create an account and run your first affordability check in minutes.</p>
          <Link to="/register" className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-indigo-700 mb-8 inline-block">
            Sign Up Now
          </Link>
          <div className="text-gray-500 text-sm">
            <Link to="/terms" className="hover:text-white px-2">Terms of Service</Link>
            <Link to="/privacy" className="hover:text-white px-2">Privacy Policy</Link>
            <a href="mailto:contact@affordabilityapi.com" className="hover:text-white px-2">Contact Us</a>
          </div>
           <p className="mt-8">&copy; 2024 Affordability API. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
