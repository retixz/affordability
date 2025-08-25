import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaShieldAlt, FaPiggyBank, FaClock, FaChartLine, FaTabletAlt, FaCheckCircle } from 'react-icons/fa';
import Pricing from '../components/Pricing';

const LandingPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div className="bg-white text-neutral-text font-sans">
      {/* Header */}
      <header className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-primary-blue">Affordability API</div>
        <nav>
          <Link to="/login" className="text-neutral-text hover:text-primary-blue px-4">Login</Link>
          <Link to="/register" className="bg-primary-blue text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700">
            Sign Up for Free
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 flex items-center">
        <div className="w-1/2">
          <h1 className="text-5xl font-bold text-neutral-text mb-4">Know they can pay. Instantly.</h1>
          <p className="text-xl text-neutral-text mb-8">Stop chasing payslips and bank statements. Our Open Banking affordability check gives you a clear, real-time answer in minutes. Fast, secure, and radically simple.</p>
          <Link to="/register" className="bg-primary-blue text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-700">
            Create Your First Free Check
          </Link>
        </div>
        <div className="w-1/2 flex justify-center">
          <div className="relative">
            <FaTabletAlt className="text-gray-200 text-9xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center">
              <FaCheckCircle className="text-green-500 text-5xl mr-2" />
              <span className="text-2xl font-bold text-neutral-text">8.2/10</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gray-50">
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

      <Pricing />

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
