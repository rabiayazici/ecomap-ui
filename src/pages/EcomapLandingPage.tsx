import { Link } from 'react-router-dom';

function EcomapLandingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed w-full bg-white shadow-md py-4 px-6 flex justify-between items-center">
        <div className="text-2xl font-bold text-green-600">3D-ECOMAP</div>
        <nav>
          <Link to="/register" className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors">
            Sign Up
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-6 text-center bg-gradient-to-b from-white to-green-50">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
          3D Eco-Friendly Navigation <br /> For Smart Travelers
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Experience 3D mapping technology with eco-friendly route planning, vehicle optimization, and sustainable travel solutions.
        </p>
        <Link to="/login">
          <button className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors">
            Get Started
          </button>
        </Link>
      </section>

      {/* Feature Section */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Smart Location Search</h2>
            <p className="text-gray-600">Find any location with intelligent search...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Vehicle Profiles</h2>
            <p className="text-gray-600">Save your vehicle information...</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Real-time Traffic</h2>
            <p className="text-gray-600">Get live traffic information...</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 px-6 bg-green-50 text-center">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Ready to Navigate Smarter?</h2>
        <p className="text-gray-600 mb-8">Join thousands of users...</p>
        <Link to="/login">
          <button className="bg-green-600 text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors">
            Start Your Journey
          </button>
        </Link>
      </section>
    </div>
  );
}

export default EcomapLandingPage; 