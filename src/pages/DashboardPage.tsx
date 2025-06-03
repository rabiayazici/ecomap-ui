import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { carService } from '../services/carService'; // Import car service
import { routeService } from '../services/routeService'; // Import route service
import type { Car, Route } from '../types/api.types'; // Import types
import { useNavigate } from 'react-router-dom';

// Import SVG icons
import RouteIcon from '../assets/icons/route-icon.svg';
import VehicleIcon from '../assets/icons/vehicle-icon.svg';
import ClockIcon from '../assets/icons/clock-icon.svg';
import CarIcon from '../assets/icons/car-icon.svg';

function DashboardPage() {
  const { user, logout } = useAuth();
  const [cars, setCars] = useState<Car[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    fuelConsumption: '',
  });

  useEffect(() => {
    const fetchUserData = async () => {
      console.log('Current user:', user);
      console.log('Token:', localStorage.getItem('token'));
      
      if (!user) {
        setLoadingCars(false);
        setLoadingRoutes(false);
        return;
      }

      try {
        // Fetch user's cars using the correct endpoint
        const userCars = await carService.getUserCars(user.id);
        setCars(userCars);
        setLoadingCars(false);

        // Fetch user's routes using the correct endpoint
        const userRoutes = await routeService.getUserRoutes(user.id);
        setRoutes(userRoutes);
        setLoadingRoutes(false);

      } catch (err) {
        console.error('Error details:', err);
        setError('Failed to fetch dashboard data.');
        setLoadingCars(false);
        setLoadingRoutes(false);
      }
    };

    fetchUserData();
  }, [user]); // Refetch data when user changes

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const carData = {
        ...formData,
        fuelConsumption: parseFloat(formData.fuelConsumption)
      };

      if (editingCar) {
        await carService.updateCar(editingCar.id, carData);
      } else {
        await carService.createCar(carData);
      }
      setIsModalOpen(false);
      setEditingCar(null);
      setFormData({
        name: '',
        model: '',
        fuelConsumption: '',
      });
      // Refresh the cars list
      if (user) {
        const userCars = await carService.getUserCars(user.id);
        setCars(userCars);
      }
    } catch (err) {
      setError('Failed to save vehicle');
    }
  };

  const handleEdit = (car: Car) => {
    setEditingCar(car);
    setFormData({
      name: car.name,
      model: car.model,
      fuelConsumption: car.fuelConsumption.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (carId: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        await carService.deleteCar(carId);
        if (user) {
          const userCars = await carService.getUserCars(user.id);
          setCars(userCars);
        }
      } catch (err) {
        setError('Failed to delete vehicle');
      }
    }
  };

  if (loadingCars || loadingRoutes) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-600">Welcome, {user?.name}</span>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-lg text-gray-600">Ready to plan your next journey? Let's get you where you need to go.</p>
      </section>

      {/* Main Content Area with Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Plan New Route Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <img src={RouteIcon} alt="Route Icon" className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Plan New Route</h3>
              <span className="ml-auto text-sm text-green-600 font-medium">Quick Start</span>
            </div>
            <p className="text-gray-600 mb-4">Calculate optimal routes with real-time traffic and fuel cost estimates.</p>
            <button 
              onClick={() => navigate('/plan-route')}
              className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              + Start Planning
            </button>
          </div>

          {/* Vehicle Profiles Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <img src={VehicleIcon} alt="Vehicle Icon" className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Vehicle Profiles</h3>
              <span className="ml-auto text-sm text-gray-500">{cars.length} vehicles</span>
            </div>
            <div className="space-y-4">
              {cars.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No vehicles added yet.</p>
                  <button
                    onClick={() => {
                      setEditingCar(null);
                      setFormData({
                        name: '',
                        model: '',
                        fuelConsumption: '',
                      });
                      setIsModalOpen(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Add Your First Vehicle
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {cars.map(car => (
                    <div key={car.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{car.name}</div>
                        <div className="text-sm text-gray-600">{car.model} - {car.fuelConsumption} L/100km</div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(car)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(car.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setEditingCar(null);
                      setFormData({
                        name: '',
                        model: '',
                        fuelConsumption: '',
                      });
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    + Add Vehicle
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Recent Routes Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center mb-4">
              <img src={ClockIcon} alt="Clock Icon" className="w-8 h-8 mr-3" />
              <h3 className="text-xl font-semibold text-gray-900">Recent Routes</h3>
            </div>
            <div className="text-center py-8">
              {routes.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-600">No saved routes yet</p>
                  <button 
                    onClick={() => navigate('/plan-route')}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Plan Your First Route
                  </button>
                </div>
              ) : (
                <p className="text-gray-600">Displaying {routes.length} recent routes.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit/Add Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Model</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fuel Consumption (L/100km)</label>
                <input
                  type="number"
                  name="fuelConsumption"
                  value={formData.fuelConsumption}
                  onChange={handleInputChange}
                  step="0.1"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  {editingCar ? 'Save Changes' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage; 