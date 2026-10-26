import axios from 'axios';
import axiosRetry from 'axios-retry';

// Увеличиваем таймаут до 2 минут (120 000 мс)
export const http = axios.create({ timeout: 120_000 });

axiosRetry(http, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (e) => axiosRetry.isNetworkOrIdempotentRequestError(e) || e.response?.status === 429,
});