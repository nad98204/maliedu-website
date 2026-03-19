const HOME_BANNER_CACHE_KEY = "mali-home-banners";

export const readHomeBannerCache = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(HOME_BANNER_CACHE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeHomeBannerCache = (banners) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      HOME_BANNER_CACHE_KEY,
      JSON.stringify(Array.isArray(banners) ? banners : [])
    );
  } catch {
    // Ignore localStorage write failures.
  }
};
