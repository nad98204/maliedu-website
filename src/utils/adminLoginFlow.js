import { signOut } from "firebase/auth";

import { auth, db } from "../firebase";
import { getFirstAllowedAdminPath, isAdminUser, isSuperAdminEmail } from "./adminAccess";
import { registerSession } from "./sessionService";
import { ensureUserProfile } from "./userService";

export const completeAdminLogin = async (user) => {
  const userProfile = await ensureUserProfile({ db, user });
  const isAdmin = isAdminUser({ email: user.email, role: userProfile?.role });

  try {
    await registerSession(user.uid, isAdmin);
  } catch (error) {
    if (error.message === "MAX_SESSIONS_REACHED") {
      await signOut(auth);
      throw Object.assign(new Error("Tài khoản đang đăng nhập quá 3 thiết bị! Vui lòng đăng xuất ở thiết bị cũ trước."), {
        code: "auth/max-sessions-reached",
      });
    }
    console.error("Session Register Error:", error);
  }

  return isAdmin
    ? getFirstAllowedAdminPath({
      allowedModules: userProfile?.allowedModules,
      isSuperAdmin: isSuperAdminEmail(user.email),
    })
    : "/khoa-hoc-cua-toi";
};
