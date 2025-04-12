import axios from 'axios';
import { message } from 'antd';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const getCacheKey = (id) => `student_${id}`;

const getCachedData = (id) => {
  const cached = localStorage.getItem(getCacheKey(id));
  if (!cached) return null;

  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(getCacheKey(id));
    return null;
  }

  return data;
};

const setCachedData = (id, data) => {
  const cacheData = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(getCacheKey(id), JSON.stringify(cacheData));
};

const retryRequest = async (fn, retries = MAX_RETRIES) => {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return retryRequest(fn, retries - 1);
    }
    throw error;
  }
};

export const fetchStudentData = async (id) => {
  try {
    // Check cache first
    const cachedData = getCachedData(id);
    if (cachedData) {
      return cachedData;
    }

    const response = await retryRequest(() => 
      axios.get(`/api/students/${id}`)
    );
    
    const data = response.data;

    // Cache the response
    setCachedData(id, data);

    return data;
  } catch (error) {
    message.error('Không thể tải dữ liệu học viên');
    throw error;
  }
};

export const updateStudentData = async (id, data) => {
  try {
    const response = await retryRequest(() => 
      axios.put(`/api/students/${id}`, data)
    );
    
    // Update cache
    setCachedData(id, response.data);

    return response.data;
  } catch (error) {
    message.error('Không thể cập nhật thông tin học viên');
    throw error;
  }
};

export const clearStudentCache = (id) => {
  localStorage.removeItem(getCacheKey(id));
}; 