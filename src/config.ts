/**
 * Central configuration for backend API.
 *
 * All backend URLs and API versioning live here so they can be updated
 * in one place instead of being scattered across service files.
 */

export const BACKEND_URL = "https://linkedin-ai-backend.stevenli2007.workers.dev";

export const API_VERSION = "v1";

/** Full endpoint paths — use these instead of string concatenation. */
export const API_ENDPOINTS = {
  generate: `${BACKEND_URL}/api/${API_VERSION}/generate`,
  refineProfile: `${BACKEND_URL}/api/${API_VERSION}/refine-profile`,
  refineMessage: `${BACKEND_URL}/api/${API_VERSION}/refine-message`,
} as const;
