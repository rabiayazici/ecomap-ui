import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteDetails {
  id: number;
  imagePath: string;
  startPointX: number;
  startPointY: number;
  endPointX: number;
  endPointY: number;
  terrainType: string;
  routeOptimization: string;
  calculatedRoutePath: string;
  distance: number;
  estimatedTime: number;
}

function RouteDetailsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const route = location.state?.route as RouteDetails;

  if (!route) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Route not found</h2>
          <p className="mt-2 text-gray-600">Please calculate a new route</p>
          <button
            onClick={() => navigate('/satellite-route')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create New Route
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Route Details</h1>
          <button
            onClick={() => navigate('/satellite-route')}
            className="text-gray-600 hover:text-gray-900"
          >
            Create New Route
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Route Map */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Route Map</h2>
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={`/api/images/${route.imagePath}`}
                    alt="Route Map"
                    className="object-cover"
                  />
                </div>
              </div>

              {/* Route Information */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Route Information</h2>
                <dl className="grid grid-cols-1 gap-4">
                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Distance</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {route.distance.toFixed(2)} km
                    </dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Estimated Time</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900">
                      {route.estimatedTime} minutes
                    </dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Terrain Type</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                      {route.terrainType}
                    </dd>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 rounded-lg">
                    <dt className="text-sm font-medium text-gray-500">Optimization Method</dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 capitalize">
                      {route.routeOptimization}
                    </dd>
                  </div>
                </dl>

                <div className="mt-8">
                  <button
                    onClick={() => window.print()}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Export Route Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default RouteDetailsPage;