// src/services/api.ts

import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://pharma-erp-pharma-backend.rrh5yv.easypanel.host/api',
  // baseURL: 'http://192.168.1.2:3000/api', // Local network IP for testing
  responseEncoding: 'utf8',
  headers: {
    'Content-Type': 'application/json',
  },
});