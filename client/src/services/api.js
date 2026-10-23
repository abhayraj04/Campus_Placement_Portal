import axios from 'axios';

const API_CONFIG_KEY = "campus_api_config";
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const API_PATH = "/api";

const clientCache = new Map();
const getClientCacheKey = (endpoint, params = '') => `${endpoint}:${params}`;
const getCachedResponse = (endpoint, params = '') => {
  const key = getClientCacheKey(endpoint, params);
  const cached = clientCache.get(key);
  if (!cached) return null;
  if (cached.expires < Date.now()) {
    clientCache.delete(key);
    return null;
  }
  return cached.data;
};

const setCachedResponse = (endpoint, data, ttl = 15000, params = '') => {
  const key = getClientCacheKey(endpoint, params);
  clientCache.set(key, { data, expires: Date.now() + ttl });
};

const clearClientCache = (endpoint, params = '') => {
  clientCache.delete(getClientCacheKey(endpoint, params));
};

const normalizeApiUrl = (url) => {
  if (!url) {
    return API_PATH;
  }

  const trimmed = url.trim().replace(/\/+$/g, "");

  if (trimmed === "") {
    return API_PATH;
  }

  if (trimmed.endsWith(API_PATH)) {
    return trimmed;
  }

  return `${trimmed}${API_PATH}`;
};

const resolveDefaultApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  const isBrowser = typeof window !== 'undefined';
  const isLocalhost = isBrowser && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  );

  // When deployed on production web (Render/Vercel), default to relative /api instead of localhost
  if (!isLocalhost && (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    return API_PATH;
  }

  return normalizeApiUrl(envUrl || API_PATH);
};

class APIConfig {
  constructor() {
    this.apiUrl = resolveDefaultApiUrl();
    this.backendAvailable = false;
    this.lastHealthCheck = null;
    this.healthCheckTimer = null;
    this.loadFromStorage();
    this.initHealthCheck();
  }

  loadFromStorage() {
    try {
      const isBrowser = typeof window !== 'undefined';
      const isLocalhost = isBrowser && (
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === ''
      );

      const stored = localStorage.getItem(API_CONFIG_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        if (config.apiUrl) {
          const candidate = normalizeApiUrl(config.apiUrl);
          if (!isLocalhost && (candidate.includes('localhost') || candidate.includes('127.0.0.1'))) {
            localStorage.removeItem(API_CONFIG_KEY);
            return;
          }
          this.apiUrl = candidate;
        }
      }
    } catch (error) {
      console.warn("Failed to load API config from storage:", error);
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(API_CONFIG_KEY, JSON.stringify({
        apiUrl: this.apiUrl,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.warn("Failed to save API config:", error);
    }
  }

  setApiUrl(url) {
    this.apiUrl = normalizeApiUrl(url);
    this.saveToStorage();
  }

  async checkHealth() {
    try {
      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000
      });
      this.backendAvailable = response.status === 200;
      this.lastHealthCheck = new Date();
      console.log(`Backend health: ${this.backendAvailable ? "✓ Connected" : "✗ Unavailable"}`);
      return this.backendAvailable;
    } catch (error) {
      this.backendAvailable = false;
      this.lastHealthCheck = new Date();
      console.warn("Backend health check failed:", error.message);
      return false;
    }
  }

  initHealthCheck() {
    this.checkHealth();

    this.healthCheckTimer = setInterval(() => {
      this.checkHealth();
    }, HEALTH_CHECK_INTERVAL);
  }

  stopHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
  }

  getStatus() {
    return {
      apiUrl: this.apiUrl,
      backendAvailable: this.backendAvailable,
      lastHealthCheck: this.lastHealthCheck
    };
  }

  async waitForBackend(maxRetries = 60, delayMs = 1000) {
    console.log("🔄 Waiting for backend to be ready...");
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        const response = await axios.get(
          `${this.apiUrl}/health`,
          { timeout: 5000 }
        );

        if (response.status === 200) {
          this.backendAvailable = true;
          this.lastHealthCheck = new Date();
          console.log("✓ Backend is ready and connected!");
          return true;
        }
      } catch (error) {
      }

      attempt++;
      if (attempt < maxRetries) {
        console.log(
          `⏳ Backend not ready yet. Retrying... (${attempt}/${maxRetries})`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.error("✗ Backend failed to connect after maximum retries");
    this.backendAvailable = false;
    return false;
  }
}

const apiConfig = new APIConfig();

export const request = async (endpoint, options = {}) => {
  try {
    const method = (options.method || 'GET').toUpperCase();
    const cacheTTL = options.cacheTTL || 0;
    const cacheParams = options.cacheParams || '';

    if (method === 'GET' && cacheTTL > 0) {
      const cached = getCachedResponse(endpoint, cacheParams);
      if (cached) {
        return {
          success: true,
          data: cached
        };
      }
    }

    const response = await axios({
      url: `${apiConfig.apiUrl}${endpoint}`,
      method,
      data: options.body || options.data,
      timeout: 10000,
      ...options
    });

    const responseData = response.data;
    if (method === 'GET' && cacheTTL > 0) {
      setCachedResponse(endpoint, responseData, cacheTTL, cacheParams);
    }

    if (Array.isArray(responseData)) {
      return {
        success: true,
        data: responseData
      };
    }

    return {
      success: true,
      ...responseData
    };
  } catch (error) {
    console.error(`API Error:`, error.message);

    return {
      success: false,
      message: error.response?.data?.message || "Something went wrong",
      error: error.message
    };
  }
};

export const getAPIStatus = () => apiConfig.getStatus();
export const setAPIUrl = (url) => apiConfig.setApiUrl(url);
export const checkBackendHealth = () => apiConfig.checkHealth();
export const stopAPIHealthChecks = () => apiConfig.stopHealthCheck();
export const waitForBackend = (maxRetries = 60, delayMs = 1000) =>
  apiConfig.waitForBackend(maxRetries, delayMs);
export const getApiUrl = () => apiConfig.apiUrl;

export const registerUser = async (data) => {
  return request("/auth/register", {
    method: "POST",
    data
  });
};

export const loginUser = async (data) => {
  return request("/auth/login", {
    method: "POST",
    data
  });
};

export const forgotPassword = async (email) => {
  return request('/auth/forgot-password', {
    method: 'POST',
    data: { email }
  });
};

export const resetPassword = async ({ email, token, newPassword }) => {
  return request('/auth/reset-password', {
    method: 'POST',
    data: { email, token, newPassword }
  });
};

export const getAllStudents = async () => {
  return request("/admin/students", {
    method: "GET",
    cacheTTL: 20000
  });
};

export const getAllCompanies = async () => {
  return request("/admin/companies", {
    method: "GET",
    cacheTTL: 20000
  });
};

export const verifyStudent = async (studentId) => {
  clearClientCache("/admin/pending-users");
  clearClientCache("/admin/reports");
  return request(`/admin/students/${studentId}/verify`, {
    method: 'PUT'
  });
};

export const deleteStudent = async (studentId) => {
  clearClientCache("/admin/pending-users");
  clearClientCache("/admin/reports");
  return request(`/admin/students/${studentId}`, {
    method: "DELETE"
  });
};

export const approveCompany = async (companyId) => {
  clearClientCache("/admin/pending-users");
  clearClientCache("/admin/reports");
  return request(`/admin/companies/${companyId}/approve`, {
    method: 'PUT'
  });
};

export const deleteCompany = async (companyId) => {
  clearClientCache("/admin/pending-users");
  clearClientCache("/admin/reports");
  return request(`/admin/companies/${companyId}`, {
    method: "DELETE"
  });
};

export const getPendingUsers = async () => {
  return request("/admin/pending-users", {
    method: "GET",
    cacheTTL: 15000
  });
};

export const approveUser = async (userId) => {
  clearClientCache("/admin/pending-users");
  clearClientCache("/admin/reports");
  return request(`/admin/users/${userId}/approve`, {
    method: "PUT"
  });
};

export const rejectUser = async (userId) => {
  clearClientCache("/admin/pending-users");
  clearClientCache("/admin/reports");
  return request(`/admin/users/${userId}/reject`, {
    method: "PUT"
  });
};

export const getPendingJobs = async () => {
  return request("/admin/pending-jobs", {
    method: "GET",
    cacheTTL: 15000
  });
};

export const approveJob = async (jobId) => {
  clearClientCache("/admin/pending-jobs");
  clearClientCache("/admin/reports");
  return request(`/admin/jobs/${jobId}/approve`, {
    method: "PUT"
  });
};

export const rejectJob = async (jobId) => {
  clearClientCache("/admin/pending-jobs");
  clearClientCache("/admin/reports");
  return request(`/admin/jobs/${jobId}/reject`, {
    method: "PUT"
  });
};
export const getPlacementReports = async () => {
  return request("/admin/reports", {
    method: "GET",
    cacheTTL: 25000
  });
};

export const sendEmailToUsers = async (data) => {
  return request("/admin/send-email", {
    method: "POST",
    data
  });
};

export const getAllDrives = async () => {
  return request("/admin/drives", {
    method: "GET",
    cacheTTL: 25000
  });
};

export const createDrive = async (data) => {
  clearClientCache("/admin/drives");
  return request("/admin/drives", {
    method: "POST",
    data
  });
};

export const checkBackend = async () => {
  const res = await request("/health", { method: "GET" });
  return res.success;
};

export const getAllJobs = async () => {
  return request("/jobs", {
    method: "GET",
    cacheTTL: 20000
  });
};

export const createJob = async (data) => {
  clearClientCache("/jobs");
  return request("/jobs", {
    method: "POST",
    data
  });
};

export const applyJob = async (jobId) => {
  return request("/applications/apply", {
    method: "POST",
    data: { jobId }
  });
};

export const getMyApplications = async () => {
  return request("/applications/my-applications", {
    method: "GET",
    cacheTTL: 15000
  });
};

export const getCompanyApplications = async () => {
  return request("/applications/company-applications", {
    method: "GET",
    cacheTTL: 15000
  });
};

export const updateApplicationStatus = async (applicationId, status) => {
  return request(`/applications/status/${applicationId}`, {
    method: "PUT",
    data: { status }
  });
};

export const getUserProfile = async () => {
  return request("/profile/me", {
    method: "GET",
    cacheTTL: 15000
  });
};

export const updateContactInfo = async (data) => {
  clearClientCache("/profile/me");
  return request("/profile/contact", {
    method: "PATCH",
    data
  });
};

export const updateBasicInfo = async (data) => {
  clearClientCache("/profile/me");
  clearClientCache("/profile/completion");
  return request("/profile/basic-info", {
    method: "PATCH",
    data
  });
};

export const updateAcademicInfo = async (data) => {
  clearClientCache("/profile/me");
  clearClientCache("/profile/completion");
  return request("/profile/academic-info", {
    method: "PATCH",
    data
  });
};

export const getProfileCompletion = async () => {
  return request("/profile/completion", {
    method: "GET",
    cacheTTL: 15000
  });
};
