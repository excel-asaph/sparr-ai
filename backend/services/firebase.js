const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'sparr-ai.firebasestorage.app' // User provided bucket URL
    });
}

const db = admin.firestore();
const bucket = admin.storage().bucket();

/**
 * Uploads a file buffer to Firebase Storage
 * @param {Buffer} buffer - File content
 * @param {string} destinationPath - Path in storage (e.g. 'users/123/resume.pdf')
 * @returns {Promise<string>} - Signed URL (valid for 1 hour) or Public URL logic
 */
async function uploadFileToStorage(buffer, destinationPath, mimeType = 'application/pdf') {
    const file = bucket.file(destinationPath);

    await file.save(buffer, {
        metadata: { contentType: mimeType }
    });

    // For private files, we usually generate a signed URL. 
    // For simplicity in this dev phase, we make it downloadable with a long expiration.
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Far future
    });

    return url;
}

module.exports = { db, bucket, uploadFileToStorage, admin };
