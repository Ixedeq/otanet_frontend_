// Configuration for the OtaNet mobile app

// API Base URL - connects to the same Flask backend as the web app
const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || "https://ota-network.com/api";

// Optional: Development mode flag
const DEV_MODE = process.env.EXPO_PUBLIC_DEV_MODE === "true";

const Config = {
  API_BASE,
  DEV_MODE,
};

export default Config;
