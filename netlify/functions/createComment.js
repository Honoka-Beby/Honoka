// netlify/functions/createComment.js
const admin = require('firebase-admin');

let isFirebaseInitialized = false;
let db;

// !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY DEPLOYED FRONTEND DOMAIN !!!
// This value is used in Access-Control-Allow-Origin headers.
// Must match your live Netlify site URL exactly, for example: "https://honoka1.netlify.app"
const ALLOW_ORIGIN = process.env.VITE_FRONTEND_URL || "https://honoka1.netlify.app"; 


// Initialize Firebase Admin SDK only once for reuse across invocations.
function initializeFirebase() {
  if (isFirebaseInitialized) {
    return; // Already initialized, do nothing
  }
  
  try {
    // CRITICAL: Ensure FIREBASE_SERVICE_ACCOUNT_KEY exists and is valid JSON
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    isFirebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.error("Firebase Admin SDK Initialization Error:", err);
    // Do NOT set isFirebaseInitialized = true; allow retry on next invocation if needed.
    throw new Error("Failed to initialize Firebase Admin SDK. Check FIREBASE_SERVICE_ACCOUNT_KEY.");
  }
}

exports.handler = async (event, context) => {
  // Define common headers with dynamic Access-Control-Allow-Origin
  const commonHeaders = {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // Cache pre-flight response for 24 hours
  };

  // Pre-flight request for CORS (responds without hitting main logic)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: commonHeaders,
      body: 'OK',
    };
  }

  // --- Main handler logic starts here ---
  try {
    // Try to ensure Firebase is initialized. This will throw if key is bad.
    initializeFirebase(); 

    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405, // Method Not Allowed
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    const data = JSON.parse(event.body);
    const { author, text } = data;

    // Server-side validation
    if (!author || author.trim() === '' || !text || text.trim() === '') {
      return {
        statusCode: 400,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Author and text are required.' }),
      };
    }
    if (author.length > 50 || text.length > 500) {
      return {
        statusCode: 400,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Author or text too long. Max: 50 for author, 500 for text.' }),
      };
    }

    const newComment = {
      author: author.trim(),
      text: text.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Firestore server timestamp
    };

    await db.collection('comments').add(newComment);

    return {
      statusCode: 200,
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Comment added successfully!', commentId: newComment.id, timestamp: new Date().toISOString() }), // Return more useful info
    };

  } catch (error) {
    console.error('Error in createComment function:', error);
    // Explicitly return a 500 with detailed error message
    return {
      statusCode: 500,
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to add comment. Internal server error. ' + error.message }),
    };
  }
};
