import api from './api.config';
import type { Route, CreateRouteData, CalculateRouteRequest } from '../types/api.types';
import polyline from '@mapbox/polyline';

// Remove the direct Python API URL since we'll proxy through Spring Boot
// const PYTHON_API_URL = 'http://localhost:5000';

export const routeService = {
  getUserRoutes: async (userId: number): Promise<Route[]> => {
    const response = await api.get(`/routes/user/${userId}`);
    return response.data;
  },

  getRoute: async (routeId: string): Promise<Route> => {
    const response = await api.get(`/routes/${routeId}`);
    return response.data;
  },

  createRoute: async (routeData: CreateRouteData): Promise<Route> => {
    const response = await api.post('/routes', routeData);
    return response.data;
  },

  updateRoute: async (routeId: string, routeData: Partial<CreateRouteData>): Promise<Route> => {
    const response = await api.put(`/routes/${routeId}`, routeData);
    return response.data;
  },

  deleteRoute: async (routeId: string): Promise<void> => {
    await api.delete(`/routes/${routeId}`);
  },

  searchLocation: async (query: string): Promise<any> => {
    const response = await api.get(`/routes/geocode/search?text=${encodeURIComponent(query)}`);
    return response.data;
  },

  calculateRoute: async (request: CalculateRouteRequest): Promise<Route> => {
    try {
      console.log('Starting route calculation with request:', request);

      // First, geocode the start and end points
      const [startGeocode, endGeocode] = await Promise.all([
        routeService.searchLocation(request.startPoint),
        routeService.searchLocation(request.endPoint)
      ]);

      console.log('Geocoding results:', { startGeocode, endGeocode });

      if (!startGeocode.features?.[0] || !endGeocode.features?.[0]) {
        throw new Error('Could not find coordinates for one or both locations');
      }

      const startCoord = startGeocode.features[0].geometry.coordinates;
      const endCoord = endGeocode.features[0].geometry.coordinates;

      console.log('Coordinates:', { startCoord, endCoord });

      // Get the car's data for eco-route calculation
      const carResponse = await api.get(`/cars/${request.carId}`);
      const car = carResponse.data;
      
      console.log('Car data:', car);

      // Calculate eco-route using Spring Boot backend
      const ecoRouteRequest = {
        startLat: startCoord[1],
        startLon: startCoord[0],
        endLat: endCoord[1],
        endLon: endCoord[0],
        vehicleType: car.type || 'medium',
        fuelType: car.fuelType || 'petrol',
        weight: car.weight || 1500,
        year: car.year || 2020
      };

      console.log('Sending eco-route calculation request:', ecoRouteRequest);

      const ecoRouteResponse = await api.post('/routes/calculate-eco-route', ecoRouteRequest);
      
      if (!ecoRouteResponse.data) {
        throw new Error('Failed to calculate eco-route');
      }

      const ecoRouteData = ecoRouteResponse.data;
      console.log('Eco-route calculation response:', ecoRouteData);

      // Calculate distances and durations
      const shortestDistance = calculateDistance(ecoRouteData.shortest_route.coordinates);
      const ecoDistance = calculateDistance(ecoRouteData.eco_route.coordinates);
      
      // Estimate durations (assuming average speed of 50 km/h)
      const averageSpeed = 50; // km/h
      const shortestDuration = (shortestDistance / 1000) / averageSpeed * 3600; // seconds
      const ecoDuration = (ecoDistance / 1000) / averageSpeed * 3600; // seconds

      // Calculate fuel costs
      const fuelPrice = 1.5; // $ per liter
      const fuelConsumption = car.fuelConsumption; // L/100km
      const shortestFuelCost = (fuelConsumption * shortestDistance / 1000 / 100) * fuelPrice;
      const ecoFuelCost = shortestFuelCost * 0.85; // Assuming 15% fuel savings

      // Return both routes
      return {
        id: 'temp-route',
        startCoordinate: startCoord as [number, number],
        endCoordinate: endCoord as [number, number],
        distance: ecoDistance,
        duration: ecoDuration,
        fuelCost: ecoFuelCost,
        coordinates: ecoRouteData.eco_route.coordinates,
        alternativeRoute: {
          coordinates: ecoRouteData.shortest_route.coordinates,
          distance: shortestDistance,
          duration: shortestDuration,
          fuelCost: shortestFuelCost
        },
        carId: request.carId,
        userId: 0
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to calculate route');
    }
  }
};

// Helper function to calculate distance between coordinates
function calculateDistance(coordinates: [number, number][]): number {
  let distance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    const [lon1, lat1] = coordinates[i - 1];
    const [lon2, lat2] = coordinates[i];
    distance += getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2);
  }
  return distance;
}

function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
} 