// netlify/functions/createComment.js
const admin = require('firebase-admin');

// IMPORTANT: Use environment variables for Firebase credentials
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// !!! IMPORTANT: Replace with your actual Netlify deployed frontend domain !!!
const ALLOW_ORIGIN = process.env.VITE_FRONTEND_URL || "https://honoka1.netlify.app"; 
// Best practice is to rely on environment variable, with a hardcoded fallback specific to prod.
// Ensure VITE_FRONTEND_URL is set in your Netlify site settings.

exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app,
      },
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { author, text } = data;

    // Basic validation
    if (!author || author.trim() === '' || !text || text.trim() === '') {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': https://honoka1.netlify.app,
        },
        body: JSON.stringify({ message: 'Author and text are required.' }),
      };
    }
    if (author.length > 50 || text.length > 500) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': https://honoka1.netlify.app,
        },
        body: JSON.stringify({ message: 'Author or text too long.' }),
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
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Comment added successfully!', comment: newComment }),
    };

  } catch (error) {
    console.error('Error adding comment:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': https://honoka1.netlify.app,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Failed to add comment.', error: error.message }),
    };
  }
};
