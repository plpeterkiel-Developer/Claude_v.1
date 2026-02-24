import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const client = axios.create({
  baseURL: API_URL,
  withCredentials: true, // send cookies with every request
  headers: { 'Content-Type': 'application/json' },
});

// Refresh access token on 401
let isRefreshing = false;
let queue = [];

function processQueue(error) {
  queue.forEach((cb) => cb(error));
  queue = [];
}

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queue.push((err) => {
            if (err) reject(err);
            else resolve(client(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await client.post('/auth/refresh');
        processQueue(null);
        return client(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default client;
