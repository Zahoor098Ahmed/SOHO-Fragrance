export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api";

// Helper: Get JWT token from localStorage
export const getAuthToken = () => {
  try {
    const userStr = localStorage.getItem("soho_user");
    if (userStr) {
      const parsed = JSON.parse(userStr);
      return parsed.token || "";
    }
  } catch {}
  return "";
};

// Helper: Make API requests securely with JWT
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Something went wrong.");
  }

  return response.json();
};

export default apiRequest;
