import { doc, getDoc, setDoc } from "firebase/firestore";

/**
 * Ensure an Auth user has a corresponding Firestore profile document.
 * We store minimal, non-sensitive fields for admin listing/enrollment.
 */
export async function ensureUserProfile({ db, user }) {
  if (!user?.uid) {
    console.warn("ensureUserProfile: No user.uid provided");
    return null;
  }
  
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  const now = Date.now();
  const existingData = snap.exists() ? snap.data() : null;

  // Logic for syncing name and photo:
  // We prioritize the Auth provider's data if Firestore is missing it or has a placeholder.
  const existingName = existingData?.displayName || "";
  const existingPhoto = existingData?.photoURL || "";

  const isUnnamed = !existingName || existingName === "UNNAMED LEARNER";
  const hasNoPhoto = !existingPhoto;

  const newDisplayName = (isUnnamed && user.displayName) ? user.displayName : (existingName || "UNNAMED LEARNER");
  const newPhotoURL = (hasNoPhoto && user.photoURL) ? user.photoURL : existingPhoto;

  const profile = {
    uid: user.uid,
    email: user.email || existingData?.email || "",
    displayName: newDisplayName,
    photoURL: newPhotoURL || "",
    role: existingData?.role || "student",
    updatedAt: now,
  };

  // If new user, set createdAt
  if (!snap.exists()) {
    profile.createdAt = now;
  }

  // Determine if we need to update:
  // 1. User doesn't exist in Firestore yet
  // 2. User exists but we just found a name (replacing placeholder)
  // 3. User exists but we just found a photo
  const needsUpdate = !snap.exists() || 
                      (isUnnamed && user.displayName) || 
                      (hasNoPhoto && user.photoURL);

  if (needsUpdate) {
    try {
      await setDoc(ref, profile, { merge: true });
      console.log(`✅ ${snap.exists() ? 'Synced' : 'Created'} user profile for ${user.email}`);
      return { id: user.uid, ...profile };
    } catch (error) {
      console.error("Error saving user profile:", error);
      throw error;
    }
  }

  return { id: snap.id, ...existingData };
}

