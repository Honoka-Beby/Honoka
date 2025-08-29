// netlify/functions/getComments.js
const admin = require('firebase-admin');

let isFirebaseInitialized = false;
let db;

// !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY DEPLOYED FRONTEND DOMAIN !!!
const ALLOW_ORIGIN = process.env.VITE_FRONTEND_URL || "https://honoka1.netlify.app"; 

function initializeFirebase() {
  if (isFirebaseInitialized) {
    return;
  }
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    db = admin.firestore();
    isFirebaseInitialized = true;
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (err) {
    console.error("Firebase Admin SDK Initialization Error:", err);
    throw new Error("Failed to initialize Firebase Admin SDK. Check FIREBASE_SERVICE_ACCOUNT_KEY.");
  }
}

exports.handler = async (event, context) => {
  const commonHeaders = {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: commonHeaders,
      body: 'OK',
    };
  }

  // --- Main handler logic starts here ---
  try {
    initializeFirebase();

    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405, // Method Not Allowed
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
    }

    const commentsRef = db.collection('comments');
    const snapshot = await commentsRef.orderBy('timestamp', 'desc').get(); 

    // Handle empty comments list gracefully
    if (snapshot.empty) {
      return {
        statusCode: 200,
        headers: { ...commonHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([]), 
      };
    }

    // Map documents to plain objects, robustly handling missing timestamp by defaulting to actual Date current
    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id, // Include document ID
        author: data.author,
        text: data.text,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : new Date().toISOString(), // Fallback with current date
      };
    });

    return {
      statusCode: 200,
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(comments),
    };

  } catch (error) {
    console.error('Error in getComments function:', error);
    return {
      statusCode: 500,
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to retrieve comments. Internal server error. ' + error.message, comments: [] }), // Provide robust fallback in production
    };
  }
};
