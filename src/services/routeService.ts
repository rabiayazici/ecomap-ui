import api from './api.config';
import type { Route, CreateRouteData, CalculateRouteRequest } from '../types/api.types';

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
      // First, geocode the start and end points
      const [startGeocode, endGeocode] = await Promise.all([
        routeService.searchLocation(request.startPoint),
        routeService.searchLocation(request.endPoint)
      ]);

      if (!startGeocode.features?.[0] || !endGeocode.features?.[0]) {
        throw new Error('Could not find coordinates for one or both locations');
      }

      const startCoord = startGeocode.features[0].geometry.coordinates;
      const endCoord = endGeocode.features[0].geometry.coordinates;

      // Calculate the route using the calculate-route endpoint
      const routeResponse = await api.post('/routes/calculate-route', {
        coordinates: [startCoord, endCoord]
      });

      const routeData = routeResponse.data;
      
      // Check if we have a valid route response
      if (!routeData || typeof routeData !== 'object') {
        console.error('Invalid route response:', routeData);
        throw new Error('Invalid route response from server');
      }

      // Try to extract route information from the response
      let distance = 0;
      let duration = 0;
      let coordinates: [number, number][] = [];

      if (routeData.routes?.[0]) {
        const route = routeData.routes[0];
        coordinates = route.geometry?.coordinates || [];
        distance = route.distance || 0;
        duration = route.duration || 0;
      }

      if (coordinates.length === 0) {
        console.error('No route coordinates found:', routeData);
        throw new Error('No route coordinates found in response');
      }

      // Get the car's fuel consumption
      const carResponse = await api.get(`/cars/${request.carId}`);
      const car = carResponse.data;
      
      // Calculate fuel cost (assuming fuel price of $1.5 per liter)
      const fuelPrice = 1.5;
      const fuelConsumption = car.fuelConsumption; // L/100km
      const distanceInKm = distance / 1000;
      const fuelUsed = (fuelConsumption * distanceInKm) / 100;
      const fuelCost = fuelUsed * fuelPrice;

      // Create the route in our database
      const createRouteResponse = await routeService.createRoute({
        startCoordinate: startCoord,
        endCoordinate: endCoord,
        carId: request.carId
      });

      return {
        ...createRouteResponse,
        distance,
        duration,
        fuelCost,
        coordinates
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