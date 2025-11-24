// Vercel Serverless Function for Express App
// This file will be used by Vercel to handle API requests

// Note: This is a placeholder. 
// Vercel will automatically detect and use the Express app from dist/index.js
// For now, we'll create a simple handler that imports the built app

export default async function handler(req, res) {
  // Import the built Express app
  // The actual implementation will be in the built dist/index.js
  const { app } = await import('../dist/index.js');
  return app(req, res);
}
