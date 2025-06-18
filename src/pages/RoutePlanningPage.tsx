import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { routeService } from '../services/routeService';
import { carService } from '../services/carService';
import type { Car, Route } from '../types/api.types';
import { useAuth } from '../contexts/AuthContext';

// Replace with your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoicnlhemljaTg0IiwiYSI6ImNtOXU1dGlmMTA1ajQya3NjNWR4eTEzNTkifQ.dXa7Bea_0j-eQbzRjoc-Dw';

interface LocationSuggestion {
  text: string;
  place_name: string;
  center: [number, number];
}

interface RouteDetails {
  distance: number;
  duration: number;
  fuelCost: number;
}

interface AlternativeRoute {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  fuelCost: number;
}

function RoutePlanningPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [cars, setCars] = useState<Car[]>([]);
  const [selectedCar, setSelectedCar] = useState<string>('');
  const [startPoint, setStartPoint] = useState<string>('');
  const [endPoint, setEndPoint] = useState<string>('');
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeDetails, setRouteDetails] = useState<RouteDetails | null>(null);
  const [alternativeRoute, setAlternativeRoute] = useState<AlternativeRoute | null>(null);
  const [showAlternativeRoute, setShowAlternativeRoute] = useState(false);

  // Add state for suggestions
  const [startSuggestions, setStartSuggestions] = useState<LocationSuggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<LocationSuggestion[]>([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);

  // Add debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Add geocoding function
  const searchLocation = async (query: string, setSuggestions: (suggestions: LocationSuggestion[]) => void) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      const data = await routeService.searchLocation(query);
      
      if (data.features) {
        const suggestions = data.features.map((feature: any) => ({
          text: feature.properties.name,
          place_name: feature.properties.label,
          center: feature.geometry.coordinates
        }));
        setSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Create debounced search functions
  const debouncedStartSearch = useRef(
    debounce((query: string) => searchLocation(query, setStartSuggestions), 300)
  ).current;

  const debouncedEndSearch = useRef(
    debounce((query: string) => searchLocation(query, setEndSuggestions), 300)
  ).current;

  // Handle input changes
  const handleStartPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartPoint(value);
    debouncedStartSearch(value);
    setShowStartSuggestions(true);
  };

  const handleEndPointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndPoint(value);
    debouncedEndSearch(value);
    setShowEndSuggestions(true);
  };

  // Handle suggestion selection
  const handleStartSuggestionClick = (suggestion: LocationSuggestion) => {
    setStartPoint(suggestion.place_name);
    setStartSuggestions([]);
    setShowStartSuggestions(false);
  };

  const handleEndSuggestionClick = (suggestion: LocationSuggestion) => {
    setEndPoint(suggestion.place_name);
    setEndSuggestions([]);
    setShowEndSuggestions(false);
  };

  useEffect(() => {
    // Initialize map
    if (map.current) return;
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [35.2433, 38.9637], // Turkey center
      zoom: 6
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const fetchCars = async () => {
      if (!user) return;
      
      try {
        const userCars = await carService.getUserCars(user.id);
        setCars(userCars);
        if (userCars.length > 0) {
          setSelectedCar(userCars[0].id);
        }
      } catch (err) {
        setError('Failed to fetch vehicles');
      }
    };

    fetchCars();
  }, [user]);

  const handleCalculateRoute = async () => {
    if (!startPoint || !endPoint || !selectedCar) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await routeService.calculateRoute({
        startPoint,
        endPoint,
        carId: selectedCar
      });

      setRoute(result);
      setAlternativeRoute(result.alternativeRoute || null);
      setRouteDetails({
        distance: result.distance,
        duration: result.duration,
        fuelCost: result.fuelCost
      });

      // Draw routes on map
      if (map.current) {
        // Remove existing routes if any
        ['eco-route', 'shortest-route'].forEach(id => {
          if (map.current?.getSource(id)) {
            map.current.removeLayer(id);
            map.current.removeSource(id);
          }
        });

        // Add eco route
        map.current.addSource('eco-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: result.coordinates
            }
          }
        });

        map.current.addLayer({
          id: 'eco-route',
          type: 'line',
          source: 'eco-route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2ecc71',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });

        // Add shortest route if available
        if (result.alternativeRoute) {
          map.current.addSource('shortest-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: result.alternativeRoute.coordinates
              }
            }
          });

          map.current.addLayer({
            id: 'shortest-route',
            type: 'line',
            source: 'shortest-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
              'visibility': showAlternativeRoute ? 'visible' : 'none'
            },
            paint: {
              'line-color': '#e74c3c',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });
        }

        // Fit map to show both routes
        const bounds = new mapboxgl.LngLatBounds();
        result.coordinates.forEach(coord => bounds.extend(coord as [number, number]));
        if (result.alternativeRoute) {
          result.alternativeRoute.coordinates.forEach(coord => bounds.extend(coord as [number, number]));
        }
        map.current.fitBounds(bounds, { padding: 50 });
      }

    } catch (err) {
      console.error('Error calculating route:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  const toggleAlternativeRoute = () => {
    setShowAlternativeRoute(!showAlternativeRoute);
    if (map.current && map.current.getLayer('shortest-route')) {
      map.current.setLayoutProperty(
        'shortest-route',
        'visibility',
        !showAlternativeRoute ? 'visible' : 'none'
      );
    }
  };

  const handleSaveRoute = async () => {
    setError('Route saving is temporarily disabled');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Plan Route</h1>
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

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Route Planning Form */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Route Details</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">Start Point</label>
                  <input
                    type="text"
                    value={startPoint}
                    onChange={handleStartPointChange}
                    onFocus={() => setShowStartSuggestions(true)}
                    placeholder="Enter start location"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {showStartSuggestions && startSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                      <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {startSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                            onClick={() => handleStartSuggestionClick(suggestion)}
                          >
                            <div className="flex items-center">
                              <span className="ml-3 block truncate">{suggestion.place_name}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700">End Point</label>
                  <input
                    type="text"
                    value={endPoint}
                    onChange={handleEndPointChange}
                    onFocus={() => setShowEndSuggestions(true)}
                    placeholder="Enter destination"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                  {showEndSuggestions && endSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg">
                      <ul className="max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        {endSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-green-50"
                            onClick={() => handleEndSuggestionClick(suggestion)}
                          >
                            <div className="flex items-center">
                              <span className="ml-3 block truncate">{suggestion.place_name}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Vehicle</label>
                  <select
                    value={selectedCar}
                    onChange={(e) => setSelectedCar(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>
                        {car.name} - {car.model}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCalculateRoute}
                  disabled={loading}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Calculating...' : 'Calculate Route'}
                </button>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}

              {routeDetails && (
                <div className="mt-6 space-y-3">
                  <h3 className="font-semibold">Route Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-600">Distance</div>
                      <div className="font-medium">{(routeDetails.distance / 1000).toFixed(1)} km</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-600">Duration</div>
                      <div className="font-medium">{Math.round(routeDetails.duration / 60)} min</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="text-sm text-gray-600">Fuel Cost</div>
                      <div className="font-medium">${routeDetails.fuelCost.toFixed(2)}</div>
                    </div>
                  </div>
                  <button
                    onClick={handleSaveRoute}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Save Route
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div ref={mapContainer} className="w-full h-[600px]" />
            </div>
            {route && alternativeRoute && (
              <div className="max-w-3xl mx-auto mt-10">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Route Comparison</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-md p-4 border border-green-200">
                      <h4 className="font-semibold text-green-700 mb-2 flex items-center">
                        Eco-friendly Route
                        <span className="ml-2 inline-block bg-green-200 text-green-800 text-xs px-2 py-0.5 rounded">Recommended</span>
                      </h4>
                      <div className="space-y-1 text-gray-700">
                        <div><span className="font-medium">Distance:</span> {(route.distance / 1000).toFixed(1)} km</div>
                        <div><span className="font-medium">Duration:</span> {Math.round(route.duration / 60)} minutes</div>
                        <div><span className="font-medium">Fuel Cost:</span> ${route.fuelCost.toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-700 mb-2">Shortest Route</h4>
                      <div className="space-y-1 text-gray-700">
                        <div><span className="font-medium">Distance:</span> {(alternativeRoute.distance / 1000).toFixed(1)} km</div>
                        <div><span className="font-medium">Duration:</span> {Math.round(alternativeRoute.duration / 60)} minutes</div>
                        <div><span className="font-medium">Fuel Cost:</span> ${alternativeRoute.fuelCost.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-center">
                    <button
                      className={`relative overflow-hidden px-6 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all duration-150
                        ${showAlternativeRoute
                          ? 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'
                          : 'bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-800'}
                      `}
                      onClick={toggleAlternativeRoute}
                    >
                      {showAlternativeRoute ? 'Hide' : 'Show'} Shortest Route
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoutePlanningPage; 