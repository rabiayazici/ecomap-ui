import api from './api.config';
import type { Car } from '../types/api.types';

interface CreateCarData {
  name: string;
  model: string;
  fuelConsumption: number;
}

export const carService = {
  async getUserCars(userId: number): Promise<Car[]> {
    const response = await api.get(`/cars/user/${userId}`);
    return response.data;
  },

  async getCar(id: string): Promise<Car> {
    const response = await api.get(`/cars/${id}`);
    return response.data;
  },

  async createCar(data: CreateCarData): Promise<Car> {
    const response = await api.post('/cars', data);
    return response.data;
  },

  async updateCar(id: string, data: CreateCarData): Promise<Car> {
    const response = await api.put(`/cars/${id}`, data);
    return response.data;
  },

  async deleteCar(id: string): Promise<void> {
    await api.delete(`/cars/${id}`);
  }
}; 