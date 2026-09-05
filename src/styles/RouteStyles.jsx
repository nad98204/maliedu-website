import { lazy, Suspense } from "react";
import { useLocation } from "react-router";
import { isKhoiThongStylePath } from "./landingPaths";

const passthrough = ({ children }) => children;
const LandingStyles = lazy(async () => {
  if (typeof document === "undefined" || !document.querySelector("style[data-landing-css]")) {
    await import("./landing.css");
  }
  return { default: passthrough };
});
const SiteStyles = lazy(async () => {
  await import("../index.css");
  // A client navigation out of a landing also restores the site's other fonts.
  if (typeof document !== "undefined" && !document.querySelector('link[href*="family=Be+Vietnam+Pro"]')) {
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Roboto:wght@400;700&family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@300;400;500;600;700;800;900&family=Story+Script&display=swap";
    document.head.appendChild(fonts);
  }
  return { default: passthrough };
});

// Also loads the full site stylesheet when navigating out of the funnel.
export default function RouteStyles({ children }) {
  const { pathname } = useLocation();
  const Styles = isKhoiThongStylePath(pathname) ? LandingStyles : SiteStyles;
  return <Suspense fallback={null}><Styles>{children}</Styles></Suspense>;
}
