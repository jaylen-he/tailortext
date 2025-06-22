
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Changed from { App } to App

console.log("index.tsx: Script started"); // For diagnostics

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("index.tsx: Could not find root element to mount to");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);