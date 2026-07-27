

// for local
// export const server = "http://localhost:8000/api/s2";
// export const backend_url = "http://localhost:8000";

// for production
export const server = import.meta.env.VITE_API_URL;
export const backend_url = import.meta.env.VITE_BACKEND_URL;