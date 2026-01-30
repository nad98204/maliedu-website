import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase";

const AdminRoute = ({ children }) => {
  const [isChecking, setIsChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsChecking(false);
    });

    return unsubscribe;
  }, []);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        Dang kiem tra dang nhap...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Hardcoded Admin Emails
  const ADMIN_EMAILS = ["mongcoaching@gmail.com"];

  if (!ADMIN_EMAILS.includes(user.email)) {
    // If logged in but not admin, redirect to user dashboard or home
    return <Navigate to="/khoa-hoc-cua-toi" replace />;
  }

  return children;
};

export default AdminRoute;
