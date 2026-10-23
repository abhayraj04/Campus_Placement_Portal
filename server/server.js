 const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const compression = require("compression");

const serverEnvPath = path.join(__dirname, ".env");
const rootEnvPath = path.join(__dirname, "../.env");
require("dotenv").config({ path: rootEnvPath });
const serverEnvLoaded = fs.existsSync(serverEnvPath) && require("dotenv").config({ path: serverEnvPath, override: true }).parsed;
console.log(`Loaded environment from ${rootEnvPath}`);
if (serverEnvLoaded) {
  console.log(`Loaded additional environment from ${serverEnvPath}`);
}

const app = express();

console.log('Admin creation token configured:', !!process.env.ADMIN_CREATION_TOKEN);

app.set('trust proxy', true);
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(compression({ level: 6 }));
app.use(express.json({ limit: '150kb' }));

app.use(express.static(path.join(__dirname, '../client/dist'), {
  maxAge: '1d',
  immutable: true,
  etag: true
}));

const mongoOptions = {
  serverSelectionTimeoutMS: 30000,
  connectTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  minPoolSize: 5,
  maxPoolSize: 10,
  maxIdleTimeMS: 600000,
  retryWrites: true,
  w: 'majority'
};

let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
let isConnecting = false;
const LOCAL_MONGO_URI = process.env.LOCAL_MONGO_URI || "mongodb://127.0.0.1:27017/placement_portal";
let activeMongoUri = process.env.MONGO_URI || LOCAL_MONGO_URI;

const connectDB = async () => {
  if (isConnecting) {
    return;
  }

  if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
    return;
  }

  isConnecting = true;
  try {
    await mongoose.connect(activeMongoUri, mongoOptions);
    reconnectAttempts = 0;
    isConnecting = false;
  } catch (err) {
    isConnecting = false;
    console.error(`MongoDB Connection Error with URI [${activeMongoUri}]:`, err.message);

    if (activeMongoUri !== LOCAL_MONGO_URI && (err.message.includes("ENOTFOUND") || err.name === "MongooseServerSelectionError")) {
      console.log(`⚠️ Remote MongoDB unreachable. Falling back automatically to local MongoDB at: ${LOCAL_MONGO_URI}`);
      activeMongoUri = LOCAL_MONGO_URI;
      reconnectAttempts = 0;
      setTimeout(connectDB, 1000);
      return;
    }

    reconnectAttempts++;
    console.error("MongoDB Connection Details:", {
      serverSelectionTimeoutMS: mongoOptions.serverSelectionTimeoutMS,
      connectTimeoutMS: mongoOptions.connectTimeoutMS,
      reconnectAttempt: reconnectAttempts
    });

    if (reconnectAttempts <= MAX_RECONNECT_ATTEMPTS) {
      const delayMs = Math.min(5000 * reconnectAttempts, 30000);
      console.log(`Retrying in ${delayMs / 1000} seconds (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connectDB, delayMs);
    } else {
      console.error("Max reconnection attempts reached. Please check your MongoDB connection.");
    }
  }
};

connectDB();

mongoose.connection.once('open', () => {
  console.log('✅ MongoDB Connected Successfully');
  reconnectAttempts = 0;
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected! Attempting to reconnect...');
  if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
    setTimeout(connectDB, 5000);
  }
});

mongoose.connection.on('error', (err) => {
  console.log('❌ MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
  reconnectAttempts = 0;
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/jobs", require("./routes/jobRoutes"));
app.use("/api/applications", require("./routes/applicationRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));

app.get("/api/health", (req, res) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const mongoStatus = isMongoConnected ? "Connected" : (mongoose.connection.readyState === 2 ? "Connecting" : "Disconnected");
  res.status(200).json({ 
    status: "OK", 
    backend: "running",
    mongodb: mongoStatus,
    timestamp: new Date().toISOString()
  });
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

app.get("/", (req, res) => {
  res.send("Campus Placement Portal Backend Running");
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
