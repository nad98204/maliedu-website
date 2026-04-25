import { trackMetaEvent } from "../../utils/metaPixel";

export const trackCtaClick = (source = "unknown") => {
  trackMetaEvent("ViewContent", {
    content_name: "CTA Click - Khơi Thông Dòng Tiền",
    content_category: source,
  });
};
