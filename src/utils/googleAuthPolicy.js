export const isMobileAuthUserAgent = (userAgent = "", maxTouchPoints = 0) =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent)
  || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);

export const shouldRedirectGoogleSignIn = ({ userAgent, maxTouchPoints, hostname, authDomain }) =>
  isMobileAuthUserAgent(userAgent, maxTouchPoints)
  && Boolean(hostname)
  && hostname === authDomain;
