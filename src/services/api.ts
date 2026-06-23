// src/services/api.ts

import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://192.168.1.19:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});