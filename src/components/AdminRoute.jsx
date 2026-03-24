import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";
import {
  getAdminModuleByPathname,
  getFirstAllowedAdminPath,
  hasModuleAccess,
  isAdminUser,
  isSuperAdminEmail,
} from "../utils/adminAccess";

const defaultAccessState = {
  allowedModules: [],
  isAdmin: false,
  isChecking: true,
  isSuperAdmin: false,
  user: null,
};

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const [accessState, setAccessState] = useState(defaultAccessState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setAccessState({
          ...defaultAccessState,
          isChecking: false,
        });
        return;
      }

      const isSuperAdmin = isSuperAdminEmail(currentUser.email);
      if (isSuperAdmin) {
        setAccessState({
          allowedModules: [],
          isAdmin: true,
          isChecking: false,
          isSuperAdmin: true,
          user: currentUser,
        });
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.exists() ? userDoc.data() : {};

        setAccessState({
          allowedModules: userData.allowedModules || [],
          isAdmin: isAdminUser({
            email: currentUser.email,
            role: userData.role,
          }),
          isChecking: false,
          isSuperAdmin: false,
          user: currentUser,
        });
      } catch (error) {
        console.error("Error checking admin role:", error);
        setAccessState({
          allowedModules: [],
          isAdmin: false,
          isChecking: false,
          isSuperAdmin: false,
          user: currentUser,
        });
      }
    });

    return unsubscribe;
  }, []);

  if (accessState.isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Dang kiem tra dang nhap...
      </div>
    );
  }

  if (!accessState.user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!accessState.isAdmin) {
    return <Navigate to="/khoa-hoc-cua-toi" replace />;
  }

  const requiredModule = getAdminModuleByPathname(location.pathname);
  if (
    requiredModule &&
    !hasModuleAccess({
      allowedModules: accessState.allowedModules,
      isSuperAdmin: accessState.isSuperAdmin,
      moduleKey: requiredModule,
    })
  ) {
    return (
      <Navigate
        to={getFirstAllowedAdminPath({
          allowedModules: accessState.allowedModules,
          isSuperAdmin: accessState.isSuperAdmin,
        })}
        replace
      />
    );
  }

  return children;
};

export default AdminRoute;
