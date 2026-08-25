// src/services/api.ts

import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://pharma-erp-pharma-backend.rrh5yv.easypanel.host/api',
  responseEncoding: 'utf8',
  headers: {
    'Content-Type': 'application/json',
  },
});