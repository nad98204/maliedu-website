import crypto from "node:crypto";

export const hashData = (input) => {
  if (!input) return "";
  return crypto.createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
};

export const normalizeNameForHash = (value) =>
  value
    ? value
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "")
    : "";

export const sendMetaCapiEvent = async ({
  pixelId,
  accessToken,
  eventName,
  eventId,
  userData,
  customData,
  sourceUrl,
  testEventCode,
}) => {
  if (!pixelId || !accessToken) return null;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        event_id: eventId,
        event_source_url: sourceUrl || "",
        user_data: userData,
        custom_data: customData,
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  const url = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error(`[CAPI] Error sending ${eventName}:`, error);
    return { error: error.message };
  }
};
