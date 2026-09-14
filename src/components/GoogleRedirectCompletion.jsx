import { useEffect } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";

import { db } from "../firebase";
import { completeAdminLogin } from "../utils/adminLoginFlow";
import { getFirebaseAuthMessage } from "../utils/firebaseAuthErrors";
import { consumeGoogleRedirectResult } from "../utils/googleAuthFlow";
import { ensureUserProfile } from "../utils/userService";

let completionPromise;
const completeRedirectOnce = () => {
  if (!completionPromise) {
    completionPromise = consumeGoogleRedirectResult().then(async (result) => {
      if (!result) return null;
      if (result.intent === "admin") return completeAdminLogin(result.user);
      if (result.intent === "register") {
        await ensureUserProfile({ db, user: result.user });
        return "/khoa-hoc-cua-toi";
      }
      // The modal is closed after a full-page redirect. Header observes Auth state.
      await ensureUserProfile({ db, user: result.user });
      return null;
    });
  }
  return completionPromise;
};

const GoogleRedirectCompletion = () => {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    completeRedirectOnce().then((destination) => {
      if (active && destination) navigate(destination, { replace: true });
    }).catch((error) => {
      console.error("Google redirect completion failed:", error);
      if (active) toast.error(getFirebaseAuthMessage(error));
    });
    return () => { active = false; };
  }, [navigate]);

  return null;
};

export default GoogleRedirectCompletion;
