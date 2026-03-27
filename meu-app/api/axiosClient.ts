import axios from 'axios';

const API_BASE_URL =
  (typeof process !== 'undefined' &&
    (process as { env?: { EXPO_PUBLIC_API_URL?: string } }).env?.EXPO_PUBLIC_API_URL) ??
  'https://olimpika.onrender.com';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
