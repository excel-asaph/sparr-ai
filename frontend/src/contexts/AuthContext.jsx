import React, { createContext, useContext, useState, useEffect } from 'react';
import {
    signInAnonymously,
    signInWithPopup,
    linkWithPopup,
    signOut,
    onAuthStateChanged
} from "firebase/auth";
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

const SESSION_DURATION = 6 * 60 * 60 * 1000; // 6 Hours in ms

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkSessionExpiry = (user) => {
        const storedLoginTime = localStorage.getItem('loginTime');
        const currentTime = Date.now();

        if (user && storedLoginTime) {
            if (currentTime - parseInt(storedLoginTime) > SESSION_DURATION) {
                console.log("Session Expired. Logging out...");
                logout(true); // Is Expiry
                return false;
            }
        }
        return true;
    };

    // Login as Guest (Anonymous)
    const loginAsGuest = async () => {
        if (currentUser) return;

        // Simple lock to prevent double-firing in StrictMode
        if (window._isGuestLoginInProgress) return;
        window._isGuestLoginInProgress = true;

        try {
            localStorage.setItem('loginTime', Date.now().toString());
            return await signInAnonymously(auth);
        } finally {
            window._isGuestLoginInProgress = false;
        }
    };

    // Login with Google (Fresh Login)
    const loginWithGoogle = async () => {
        const result = await signInWithPopup(auth, googleProvider);
        localStorage.setItem('loginTime', Date.now().toString());

        // Persist "Known User"
        if (result.user?.email) {
            localStorage.setItem('lastKnownUser', result.user.email);
        }
        return result;
    };

    // Upgrade Guest to Google Account (Link)
    const linkGoogleAccount = async () => {
        if (!auth.currentUser) return loginWithGoogle();
        const result = await linkWithPopup(auth.currentUser, googleProvider);
        localStorage.setItem('loginTime', Date.now().toString());

        // Persist "Known User"
        if (result.user?.email) {
            localStorage.setItem('lastKnownUser', result.user.email);
        }
        return result;
    };

    const logout = (isExpiry = false) => {
        localStorage.removeItem('loginTime');
        localStorage.removeItem('firebaseToken');

        // Only clear known user if explicit logout
        if (!isExpiry) {
            localStorage.removeItem('lastKnownUser');
        }

        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                // Check Expiry
                const isValid = checkSessionExpiry(user);
                if (!isValid) {
                    // Logged out by checkSessionExpiry
                    return;
                }

                setCurrentUser(user);
                setLoading(false);

                // Get ID Token for backend calls
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
