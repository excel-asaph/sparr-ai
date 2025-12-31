/**
 * @fileoverview Authentication Context Provider
 * 
 * Manages Firebase authentication state and provides auth methods
 * throughout the application. Supports anonymous (guest) login,
 * Google OAuth, account linking, and session expiry handling.
 * 
 * @module contexts/AuthContext
 * @requires firebase/auth
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
    signInAnonymously,
    signInWithPopup,
    linkWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from '../firebase';

/** @type {React.Context} Authentication context */
const AuthContext = createContext();

/**
 * Custom hook to access authentication context.
 * 
 * @function useAuth
 * @returns {Object} Auth context value with currentUser and auth methods
 * 
 * @example
 * const { currentUser, loginWithGoogle, logout } = useAuth();
 */
export const useAuth = () => useContext(AuthContext);

/** @constant {number} Session duration in milliseconds (6 hours) */
const SESSION_DURATION = 6 * 60 * 60 * 1000;

/**
 * Authentication provider component that wraps the application.
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider component with auth context
 */
export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    /**
     * Checks if the current session has expired.
     * Automatically logs out user if session exceeds duration limit.
     * 
     * @param {User} user - Firebase user object
     * @returns {boolean} True if session is valid, false if expired
     */
    const checkSessionExpiry = (user) => {
        const storedLoginTime = localStorage.getItem('loginTime');
        const currentTime = Date.now();

        if (user && storedLoginTime) {
            if (currentTime - parseInt(storedLoginTime) > SESSION_DURATION) {
                logout(true);
                return false;
            }
        }
        return true;
    };

    /**
     * Signs in user anonymously as a guest.
     * Implements lock mechanism to prevent duplicate calls in StrictMode.
     * 
     * @async
     * @function loginAsGuest
     * @returns {Promise<UserCredential|undefined>} Firebase user credential
     */
    const loginAsGuest = async () => {
        if (currentUser) return;

        // Prevent double-firing in React StrictMode
        if (window._isGuestLoginInProgress) return;
        window._isGuestLoginInProgress = true;

        try {
            localStorage.setItem('loginTime', Date.now().toString());
            return await signInAnonymously(auth);
        } finally {
            window._isGuestLoginInProgress = false;
        }
    };

    /**
     * Signs in user with Google OAuth popup.
     * Persists user email for returning user detection.
     * 
     * @async
     * @function loginWithGoogle
     * @returns {Promise<UserCredential>} Firebase user credential
     */
    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        localStorage.setItem('loginTime', Date.now().toString());

        // Store email for returning user detection
        if (result.user?.email) {
            localStorage.setItem('lastKnownUser', result.user.email);
        }
        return result;
    };

    /**
     * Upgrades anonymous account to Google account via linking.
     * Falls back to fresh Google login if no current user exists.
     * 
     * @async
     * @function linkGoogleAccount
     * @returns {Promise<UserCredential>} Firebase user credential
     */
    const linkGoogleAccount = async () => {
        if (!auth.currentUser) return loginWithGoogle();
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        localStorage.setItem('loginTime', Date.now().toString());

        if (result.user?.email) {
            localStorage.setItem('lastKnownUser', result.user.email);
        }
        return result;
    };

    /**
     * Signs out the current user and clears all stored data.
     * Preserves lastKnownUser for returning user detection.
     * 
     * @async
     * @function logout
     * @param {boolean} [isExpiry=false] - Whether logout is due to session expiry
     * @returns {Promise<void>}
     */
    const logout = async (isExpiry = false) => {
        const lastKnownUser = localStorage.getItem('lastKnownUser');

        localStorage.clear();

        // Preserve for returning user detection
        if (lastKnownUser) {
            localStorage.setItem('lastKnownUser', lastKnownUser);
        }

        // Clear IndexedDB for complete cleanup
        try {
            const databases = await indexedDB.databases();
            for (const db of databases) {
                if (db.name) {
                    indexedDB.deleteDatabase(db.name);
                }
            }
        } catch (error) {
            // Fallback for browsers without indexedDB.databases()
            const knownDatabases = ['firebaseLocalStorageDb', 'firebase-messaging-database'];
            knownDatabases.forEach(dbName => {
                try {
                    indexedDB.deleteDatabase(dbName);
                } catch (e) {
                    // Ignore cleanup errors
                }
            });
        }

        sessionStorage.clear();

        return signOut(auth);
    };

    // Subscribe to Firebase auth state changes
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const isValid = checkSessionExpiry(user);
                if (!isValid) return;

                setCurrentUser(user);
                setLoading(false);

                // Cache ID token for backend API calls
                user.getIdToken().then(token => {
                    localStorage.setItem('firebaseToken', token);
                });
            } else {
                setCurrentUser(null);
                setLoading(false);
                localStorage.removeItem('firebaseToken');
            }
        });

        return unsubscribe;
    }, []);

    /** @type {Object} Context value exposed to consumers */
    const value = {
        currentUser,
        loginAsGuest,
        loginWithGoogle,
        linkGoogleAccount,
        logout,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
