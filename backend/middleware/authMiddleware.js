/**
 * @fileoverview Firebase Authentication Middleware
 * 
 * Express middleware for authenticating requests using Firebase ID tokens.
 * Validates Bearer tokens from the Authorization header and attaches
 * decoded user information to the request object.
 * 
 * @module middleware/authMiddleware
 * @requires firebase-admin
 */

const admin = require('firebase-admin');

/**
 * Express middleware that authenticates requests using Firebase ID tokens.
 * 
 * Extracts the Bearer token from the Authorization header, verifies it with
 * Firebase Auth, and attaches the decoded token to `req.user` for downstream use.
 * 
 * @async
 * @function authenticate
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 * @returns {Promise<void>}
 * 
 * @example
 * // Usage in Express route
 * app.get('/api/protected', authenticate, (req, res) => {
 *     console.log(req.user.uid); // Firebase User ID
 * });
 */
async function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;

    // Validate Authorization header format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Extract token from "Bearer <token>" format
    const token = authHeader.split('Bearer ')[1];

    try {
        // Verify token with Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(token);

        // Attach decoded user info to request for downstream handlers
        req.user = decodedToken;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
}

module.exports = authenticate;
