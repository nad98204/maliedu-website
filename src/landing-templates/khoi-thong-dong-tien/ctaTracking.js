import { trackMetaEventForPixel } from "../../utils/metaPixel";

export const trackCtaClick = (source = "unknown") => {
  trackMetaEventForPixel(window.__maliCurrentPixelId, "InitiateCheckout", {
    content_name: "CTA Click - Khơi Thông Dòng Tiền",
    content_category: source,
  });
};
