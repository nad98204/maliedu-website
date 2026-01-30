import {
    doc,
    getDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    Timestamp
} from "firebase/firestore";
import { db } from "../firebase";
import { v4 as uuidv4 } from "uuid";

const COLLECTION_NAME = "users";
const MAX_SESSIONS = 3;

// Helper to get or create a persistent Device ID for this browser
export const getDeviceId = () => {
    let deviceId = localStorage.getItem("mali_device_id");
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("mali_device_id", deviceId);
    }
    return deviceId;
};

// Get User Agent Info (Simple version)
const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";
    else if (ua.indexOf("Firefox") > -1) browser = "Firefox";

    let os = "Unknown OS";
    if (ua.indexOf("Win") > -1) os = "Windows";
    else if (ua.indexOf("Mac") > -1) os = "MacOS";
    else if (ua.indexOf("Linux") > -1) os = "Linux";
    else if (ua.indexOf("Android") > -1) os = "Android";
    else if (ua.indexOf("iOS") > -1) os = "iOS";

    return `${browser} on ${os}`;
};

/**
 * Registers the current device as an active session.
 * Throws "MAX_SESSIONS_REACHED" if limit is exceeded.
 */
export const registerSession = async (userId, isAdmin = false) => {
    if (!userId) return;

    const deviceId = getDeviceId();
    const userRef = doc(db, COLLECTION_NAME, userId);

    // 1. Get current sessions
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return; // Should not happen if user is logged in

    const userData = userSnap.data();
    let sessions = userData.activeSessions || [];

    // 2. Remove this device if it already exists (to update it)
    const existingIndex = sessions.findIndex(s => s.deviceId === deviceId);
    if (existingIndex !== -1) {
        sessions.splice(existingIndex, 1);
    }

    // 3. Remove expired sessions (Optional: e.g. > 30 days)
    // For now, we rely on manual logout or LRU if implemented. 
    // Simply check count.

    // 4. Check limit
    if (!isAdmin && sessions.length >= MAX_SESSIONS) {
        throw new Error("MAX_SESSIONS_REACHED");
    }

    // 5. Add current session
    const newSession = {
        deviceId,
        deviceInfo: getDeviceInfo(),
        lastActiveAt: Date.now(),
        userAgent: navigator.userAgent
    };

    // Update Firestore
    // Note: We use arrayUnion logic, but since we removed the old one locally, 
    // it's safer to just set the whole array to avoid race conditions roughly. 
    // For strict atomic, we typically use arrayUnion, but arrayUnion doesn't update fields if obj is diff.
    // So writing the full array is acceptable here.

    sessions.push(newSession);

    await updateDoc(userRef, {
        activeSessions: sessions
    });

    return newSession;
};

/**
 * Removes the current device from active sessions
 */
export const logoutSession = async (userId) => {
    if (!userId) return;
    const deviceId = getDeviceId();
    const userRef = doc(db, COLLECTION_NAME, userId);

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const sessions = userSnap.data().activeSessions || [];
    const newSessions = sessions.filter(s => s.deviceId !== deviceId);

    if (sessions.length !== newSessions.length) {
        await updateDoc(userRef, {
            activeSessions: newSessions
        });
    }
};

/**
 * Removes a specific session (Remote Logout)
 */
export const removeSession = async (userId, targetDeviceId) => {
    if (!userId || !targetDeviceId) return;
    const userRef = doc(db, COLLECTION_NAME, userId);

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const sessions = userSnap.data().activeSessions || [];
    const newSessions = sessions.filter(s => s.deviceId !== targetDeviceId);

    await updateDoc(userRef, {
        activeSessions: newSessions
    });
};

/**
 * Validates if the current session is still valid
 */
export const validateSession = async (userId) => {
    if (!userId) return false;
    const deviceId = getDeviceId();
    const userRef = doc(db, COLLECTION_NAME, userId);

    // Optimistic check? No, must check DB to support remote logout.
    // This might be expensive on every page load.
    // Recommended: Check once on App load (Header mount).

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return false;

    const sessions = userSnap.data().activeSessions || [];
    return sessions.some(s => s.deviceId === deviceId);
};
