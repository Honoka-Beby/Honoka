// netlify/functions/handleVisitCount.js
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// !!! IMPORTANT: Replace with YOUR ACTUAL NETLIFY DEPLOYED FRONTEND DOMAIN !!!
const ALLOW_ORIGIN = process.env.VITE_FRONTEND_URL || "https://honoka1.netlify.app"; 

exports.handler = async (event, context) => {
  const defaultHeaders = {
    'Access-Control-Allow-Origin': ALLOW_ORIGIN, // Correctly use the variable here
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: 'OK',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: defaultHeaders,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  let visitorCount = 0;
  try {
    const visitorRef = db.collection('siteMeta').doc('visits');
    // Run a transaction to ensure atomic increment, robust against race conditions
    const newCount = await db.runTransaction(async (t) => {
      const sfDoc = await t.get(visitorRef);
      let currentCount = 0;
      if (!sfDoc.exists) {
        // Doc doesn't exist, create it with initial count of 0
        t.set(visitorRef, { count: 0 }); 
      } else {
        currentCount = sfDoc.data().count || 0; // Get current count, default to 0 if field is missing
      }
      t.update(visitorRef, { count: currentCount + 1 });
      return currentCount + 1; // Return the incremented count for the response
    }, {maxAttempts: 3}); // Max 3 retry attempts for transaction for robustness

    return {
      statusCode: 200,
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: newCount }), // Return the *newly incremented* count
    };

  } catch (error) {
    console.error('Error handling visitor count:', error);
    return {
      statusCode: 500,
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message, count: 0 }), // Return 0 count in error
    };
  }
};
