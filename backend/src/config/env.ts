import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb+srv://pradeepmolleti09_db_user:Vi9Ex9DjuD6Xr1iE@cluster0.7ir9i67.mongodb.net/?appName=Cluster0",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "MY_SECRET_KEY",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "1018923804236-dvh398b37aecmh2t2k2f9i9tuuhpdbvo.apps.googleusercontent.com",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "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",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "dumangedk",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "185632714393386",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || "OQ4flJbPCYiuZRd191AEUAaiGEQ",
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDHUVqIQRrzsJP4pgOwnBB8TkRibhOSwkI",
};

