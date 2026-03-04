import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

const AdminRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Hardcoded Super Admin Email
        const ADMIN_EMAILS = ["mongcoaching@gmail.com"];
        if (ADMIN_EMAILS.includes(currentUser.email)) {
          setIsAdmin(true);
        } else {
          try {
            const userDocRef = doc(db, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists() && userDoc.data().role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error checking admin role:", error);
            setIsAdmin(false);
          }
        }
      } else {
        setIsAdmin(false);
      }
      setIsChecking(false);
    });

    return unsubscribe;
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    // If logged in but not admin, redirect to user dashboard or home
    return <Navigate to="/khoa-hoc-cua-toi" replace />;
  }

  return children;
};

export default AdminRoute;
