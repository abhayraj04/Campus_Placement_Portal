 import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { waitForBackend } from "./services/api.js";

const root = ReactDOM.createRoot(document.getElementById("root"));

const LoadingScreen = () => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    backgroundColor: "#1a1a1a",
    color: "#fff",
    fontSize: "18px",
    fontFamily: "Arial, sans-serif"
  }}>
    <div style={{ marginBottom: "20px" }}>
      <div style={{
        width: "50px",
        height: "50px",
        border: "4px solid #333",
        borderTop: "4px solid #0066ff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        margin: "0 auto"
      }}></div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
    <p>🔄 Connecting to Backend Server...</p>
    <p style={{ fontSize: "14px", color: "#999" }}>Starting services. If hosted on Render free tier, server wake-up may take up to 45 seconds.</p>
  </div>
);

root.render(<LoadingScreen />);

waitForBackend(60, 1000).then(success => {
  if (success) {
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    root.render(
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#1a1a1a",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
        textAlign: "center"
      }}>
        <h1>✗ Connection Failed</h1>
        <p>Unable to connect to the backend server.</p>
        <p style={{ color: "#999", marginTop: "20px" }}>
          Please ensure:
        </p>
        <ul style={{ textAlign: "left", display: "inline-block", color: "#999" }}>
          <li>Backend service is running and accessible</li>
          <li>MongoDB connection is established</li>
          <li>If on Render free tier, the service may still be waking up (click Retry below)</li>
        </ul>
        <button 
          onClick={() => window.location.reload()}
          style={{
            marginTop: "30px",
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: "#0066ff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          Retry Connection
        </button>
      </div>
    );
  }
});
