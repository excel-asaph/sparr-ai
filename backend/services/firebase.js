/**
 * @fileoverview Firebase Admin SDK Configuration and Storage Utilities
 * 
 * Initializes Firebase Admin SDK with service account credentials and provides
 * helper functions for Firestore database operations and Cloud Storage file uploads.
 * 
 * @module services/firebase
 * @requires firebase-admin
 */

const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: 'sparr-ai.firebasestorage.app'
    });
}

/** @type {FirebaseFirestore.Firestore} Firestore database instance */
const db = admin.firestore();

/** @type {Bucket} Firebase Cloud Storage bucket instance */
const bucket = admin.storage().bucket();

/**
 * Uploads a file buffer to Firebase Cloud Storage and returns a signed URL.
 * 
 * @async
 * @function uploadFileToStorage
 * @param {Buffer} buffer - The file content as a Buffer
 * @param {string} destinationPath - Storage path (e.g., 'users/123/resume.pdf')
 * @param {string} [mimeType='application/pdf'] - MIME type of the file
 * @returns {Promise<string>} Signed URL for accessing the uploaded file
 * 
 * @example
 * const url = await uploadFileToStorage(pdfBuffer, 'users/abc123/resume.pdf');
 */
async function uploadFileToStorage(buffer, destinationPath, mimeType = 'application/pdf') {
    const file = bucket.file(destinationPath);

    // Save file to Cloud Storage with metadata
    await file.save(buffer, {
        metadata: { contentType: mimeType }
    });

    // Generate signed URL with long expiration for persistent access
    const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500'
    });

    return url;
}

module.exports = { db, bucket, uploadFileToStorage, admin };
