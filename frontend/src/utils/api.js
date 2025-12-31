/**
 * @fileoverview API Configuration
 * 
 * Centralized API URL configuration for all backend calls.
 * Uses environment variable for production, falls back to localhost for development.
 * 
 * @module utils/api
 */

/**
 * Base URL for all API calls
 * @type {string}
 */
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Makes an authenticated API call
 * @param {string} endpoint - API endpoint (e.g., '/api/generate-jobs')
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const apiFetch = (endpoint, options = {}) => {
    return fetch(`${API_URL}${endpoint}`, options);
};
