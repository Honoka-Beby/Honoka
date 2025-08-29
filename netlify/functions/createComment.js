// netlify/functions/createComment.js
const admin = require('firebase-admin');

// IMPORTANT: Use environment variables for Firebase credentials
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

// Initialize Firebase Admin only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY DEPLOYED FRONTEND DOMAIN !!!
// This variable will be used in Access-Control-Allow-Origin headers.
const ALLOW_ORIGIN = process.env.VITE_FRONTEND_URL || "https://honoka1.netlify.app"; 
// Example fallback if env var is empty locally: "https://honoka1.netlify.app"

exports.handler = async (event, context) => {
  // Common Headers for all responses, including OPTIONS
  const defaultHeaders = {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN, // Correctly use the variable here
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', // Be explicit with allowed methods
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // Cache pre-flight response for 24 hours
  };

  // Pre-flight request for CORS.
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: 'OK', // A simple body for OPTIONS requests
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: defaultHeaders,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { author, text } = data;

    // Basic server-side validation
    if (!author || author.trim() === '' || !text || text.trim() === '') {
      return {
        statusCode: 400,
        headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Author and text are required.' }),
      };
    }
    if (author.length > 50 || text.length > 500) {
      return {
        statusCode: 400,
        headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Author or text too long. Max: 50 for author, 500 for text.' }),
      };
    }

    const newComment = {
      author: author.trim(),
      text: text.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Use server timestamp for accuracy
    };

    await db.collection('comments').add(newComment);

    return {
      statusCode: 200,
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Comment added successfully!', comment: newComment }),
    };

  } catch (error) {
    console.error('Error adding comment:', error);
    return {
      statusCode: 500,
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to add comment. Please try again.', error: error.message }),
    };
  }
};
