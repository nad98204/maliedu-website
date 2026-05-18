const VIETNAMESE_D_RE = /[đĐ]/g;
const DIACRITIC_RE = /[\u0300-\u036f]/g;
const NON_WORD_SPACE_RE = /[^\p{L}\p{N}\s]/gu;

export const normalizeLeadSearchText = (value = "") =>
  String(value || "")
    .normalize("NFD")
    .replace(DIACRITIC_RE, "")
    .replace(VIETNAMESE_D_RE, "d")
    .toLowerCase()
    .replace(NON_WORD_SPACE_RE, " ")
    .replace(/\s+/g, " ")
    .trim();

export const normalizeLeadPhoneDigits = (value = "") =>
  String(value || "").replace(/\D/g, "");

const addPrefixes = (keywords, value, minLength = 1) => {
  const normalized = String(value || "").trim();
  for (let i = minLength; i <= normalized.length; i += 1) {
    keywords.add(normalized.slice(0, i));
  }
};

const addDigitSubstrings = (keywords, digits) => {
  for (let start = 0; start < digits.length; start += 1) {
    for (let end = start + 3; end <= digits.length; end += 1) {
      keywords.add(digits.slice(start, end));
    }
  }
};

export const normalizeLeadSearchTerm = (value = "") => {
  const digits = normalizeLeadPhoneDigits(value);
  if (digits.length >= 3) return digits;
  return normalizeLeadSearchText(value);
};

export const buildLeadSearchKeywords = ({ name = "", phone = "" } = {}) => {
  const keywords = new Set();
  const normalizedName = normalizeLeadSearchText(name);
  const compactName = normalizedName.replace(/\s/g, "");
  const phoneDigits = normalizeLeadPhoneDigits(phone);

  if (normalizedName) {
    addPrefixes(keywords, normalizedName);
    normalizedName.split(" ").filter(Boolean).forEach((word) => addPrefixes(keywords, word));
  }

  if (compactName && compactName !== normalizedName) {
    addPrefixes(keywords, compactName);
  }

  if (phoneDigits) {
    addPrefixes(keywords, phoneDigits);
    addDigitSubstrings(keywords, phoneDigits);
  }

  return Array.from(keywords);
};
