# Google sign-in on luathapdan.vn

The production site is served by Cloudflare Pages. Firebase Authentication uses
`maliedu-web.firebaseapp.com` as its default OAuth helper domain. On 2026-09-14,
Firebase Authentication already listed `luathapdan.vn` as an authorized domain,
but the Google OAuth web client allowed only
`https://maliedu-web.firebaseapp.com/__/auth/handler`. The OAuth branding also
listed only `maliedu-web.firebaseapp.com`, and
`https://luathapdan.vn/__/auth/handler` returned 404.

Roll out in this order so desktop Google popup continues to work:

1. Deploy the Cloudflare Pages code with `VITE_GOOGLE_AUTH_DOMAIN` unset. Verify
   `https://luathapdan.vn/__/auth/handler` and `/__/auth/iframe` return Firebase
   helper HTML with status 200 and **no redirect** to `firebaseapp.com`.
2. In Google Auth Platform for project `maliedu-web`, add `luathapdan.vn` to
   Branding > Authorized domains. On its existing Web application OAuth client,
   add `https://luathapdan.vn` to Authorized JavaScript origins and
   `https://luathapdan.vn/__/auth/handler` to Authorized redirect URIs. Keep the
   existing `firebaseapp.com` origin and redirect URI. Allow time for the Google
   configuration to propagate.
3. Set Cloudflare Pages build variable `VITE_GOOGLE_AUTH_DOMAIN=luathapdan.vn`
   and redeploy the frontend. The SDK uses the custom auth domain only when the
   page host is exactly `luathapdan.vn`; local development and Firebase Hosting
   retain the original helper domain.
4. Verify desktop popup, iPhone Safari full-page redirect and return, Android
   Chrome redirect, and Zalo's instruction to open an external browser. Verify
   that profile sync and the admin/student destination still complete. Do not
   test Google OAuth inside Zalo's embedded browser.

The Google account chooser's “Continue to” hostname follows the OAuth redirect
URI. The app name and support email are separate OAuth Branding settings; changing
the Firebase `authDomain` does not edit those fields or complete Google branding
verification.
