import { createContext } from "react";

// Only the Leader landing provides a popup; other funnels keep their anchor CTA.
export const RegistrationContext = createContext(null);

export const loadRegistrationForm = () => import("./sections/FormDangKy");
