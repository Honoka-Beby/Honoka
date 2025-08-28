// netlify/functions/handleVisitCount.js
const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,

      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
      },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  let visitorCount = 0;
  try {
    const visitorRef = db.collection('siteMeta').doc('visits');
    const doc = await visitorRef.get();

    if (!doc.exists) {
      // If document doesn't exist, create it with initial count (0)
      await visitorRef.set({ count: 0 });
      visitorCount = 0; // Initialize for response
    } else {
      visitorCount = doc.data().count; // Get current count
    }
    
    // Increment count transactionally to prevent race conditions
    const newCount = await db.runTransaction(async (t) => {
      const sfDoc = await t.get(visitorRef);
      const currentCount = sfDoc.data().count || 0;
      t.update(visitorRef, { count: currentCount + 1 });
      return currentCount + 1; // Return the incremented count for the response
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ count: newCount }), // Return the *newly incremented* count
    };

  } catch (error) {
    console.error('Error handling visitor count:', error);
    // Even if there's an error, try to return 0 or a placeholder count
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message, count: 0 }), 
    };
  }
};
