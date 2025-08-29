// netlify/functions/handleVisitCount.js
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
  
    let visitorCount = 0;
    const visitorRef = db.collection('siteMeta').doc('visits');

    // Use a transaction for atomic increment, robust against race conditions
    const newCount = await db.runTransaction(async (t) => {
      const sfDoc = await t.get(visitorRef);
      let currentCount = 0;
      if (!sfDoc.exists) {
        t.set(visitorRef, { count: 0 }); // Initialize if document doesn't exist
      } else {
        currentCount = sfDoc.data().count || 0; // Get current count, ensure it's a number
      }
      t.update(visitorRef, { count: currentCount + 1 });
      return currentCount + 1; // Return the incremented count
    }, {maxAttempts: 3}); // Max 3 retry attempts for transaction for robustness

    return {
      statusCode: 200,
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: newCount }), // Return the *newly incremented* count
    };

  } catch (error) {
    console.error('Error in handleVisitCount function:', error);
    return {
      statusCode: 500,
      headers: { ...commonHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to retrieve or update visitor count. Internal server error. ' + error.message, count: 0 }),
    };
  }
};
