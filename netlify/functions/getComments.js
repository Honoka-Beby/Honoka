// netlify/functions/getComments.js
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

  try {
    const commentsRef = db.collection('comments');
    // Order comments by timestamp in descending order (newest first)
    const snapshot = await commentsRef.orderBy('timestamp', 'desc').get(); 

    if (snapshot.empty) {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([]), // Return empty array if no comments
      };
    }

    const comments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        author: data.author,
        text: data.text,
        // Convert Firestore Timestamp object to ISO string for frontend consumption
        timestamp: data.timestamp ? data.timestamp.toDate().toISOString() : null, 
      };
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(comments),
    };

  } catch (error) {
    console.error('Error getting comments:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app || '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Failed to retrieve comments.', error: error.message }),
    };
  }
};
