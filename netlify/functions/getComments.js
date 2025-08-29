// netlify/functions/getComments.js
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

  try {
    const commentsRef = db.collection('comments');
    const snapshot = await commentsRef.orderBy('timestamp', 'desc').get(); 

    if (snapshot.empty) {
      return {
        statusCode: 200,
        headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify([]), // Return empty array if no comments
      };
    }

    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        author: data.author,
        text: data.text,
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null, 
      };
    });

    return {
      statusCode: 200,
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(comments),
    };

  } catch (error) {
    console.error('Error getting comments:', error);
    return {
      statusCode: 500,
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to retrieve comments. Please try again.', error: error.message }),
    };
  }
};
