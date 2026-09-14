/**
 * Detects if the current browser is an in-app browser (WebView) 
 * which often restricts Google OAuth login.
 * 
 * Specifically targets: Zalo, Facebook (FBAN/FBAV), Instagram, TikTok.
 */
export const isInAppBrowserUserAgent = (ua = "") =>
    /(Zalo|FBAN|FBAV|Instagram|TikTok|MicroMessenger|; wv\))/i.test(ua)
    || (/(iPhone|iPad|iPod)/i.test(ua)
        && /AppleWebKit/i.test(ua)
        && !/(Safari|CriOS|FxiOS|EdgiOS)/i.test(ua));

export const isInAppBrowser = () =>
    isInAppBrowserUserAgent(navigator.userAgent || navigator.vendor || window.opera || "");
