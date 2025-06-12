export interface User {
  id: number;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface Car {
  id: string;
  name: string;
  model: string;
  engine_type: string;
  year: number;
  fuel_type: string;
  engine_displacement: number;
  transmission: string;
  drive_type: string;
  fuelConsumption: number;
  userId: number;
}

export interface CreateCarData {
  name: string;
  model: string;
  engine_type: string;
  year: number;
  fuel_type: string;
  engine_displacement: number;
  transmission: string;
  drive_type: string;
  fuelConsumption: number;
}

export interface Route {
  id: string;
  startCoordinate: [number, number];
  endCoordinate: [number, number];
  distance: number;
  duration: number;
  fuelCost: number;
  coordinates: [number, number][];
  carId: string;
  userId: number;
}

export interface CreateRouteData {
  startCoordinate: [number, number];
  endCoordinate: [number, number];
  carId: string;
}

export interface CalculateRouteRequest {
  startPoint: string;
  endPoint: string;
  carId: string;
}

export interface ApiError {
  message: string;
  status: number;
} 