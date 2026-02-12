import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

export default api;
