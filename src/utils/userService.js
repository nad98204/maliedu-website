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
  
  if (snap.exists()) {
    // User already exists, return existing data
    return { id: snap.id, ...snap.data() };
  }

  // Create new user profile
  const now = Date.now();
  const profile = {
    uid: user.uid,
    email: user.email || "",
    createdAt: now,
    updatedAt: now,
  };
  
  try {
    await setDoc(ref, profile, { merge: true });
    console.log(`✅ Created user profile for ${user.email} (${user.uid})`);
    return { id: user.uid, ...profile };
  } catch (error) {
    console.error("Error creating user profile:", error);
    throw error;
  }
}

