/**
 * Detects if the current browser is an in-app browser (WebView) 
 * which often restricts Google OAuth login.
 * 
 * Specifically targets: Zalo, Facebook (FBAN/FBAV), Instagram, TikTok.
 */
export const isInAppBrowser = () => {
    const ua = navigator.userAgent || navigator.vendor || window.opera;
    const inAppRegex = /(Zalo|FBAN|FBAV|Instagram|TikTok)/i;
    return inAppRegex.test(ua);
};
