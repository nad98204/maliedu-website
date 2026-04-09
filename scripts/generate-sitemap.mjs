/**
 * generate-sitemap.mjs
 * ---------------------
 * Script Node.js sinh file public/sitemap.xml động bằng cách kết nối
 * thẳng vào Firebase Firestore qua firebase-admin SDK.
 *
 * Biến môi trường cần thiết (đặt trong .env hoặc CI/CD):
 *   FIREBASE_PROJECT_ID       – Project ID của Firebase
 *   FIREBASE_CLIENT_EMAIL     – Service account email
 *   FIREBASE_PRIVATE_KEY      – Private key (có thể có \n literal)
 *   SITE_URL (tuỳ chọn)       – Base URL của trang, mặc định: https://luathapdan.edu.vn
 *
 * Ngoài ra, nếu có file serviceAccountKey.json (không commit lên git),
 * script cũng có thể đọc từ biến GOOGLE_APPLICATION_CREDENTIALS.
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------------------------
// 1. Khởi tạo firebase-admin
// ---------------------------------------------------------------------------
let admin;
try {
  admin = require("firebase-admin");
} catch {
  console.error(
    "❌  firebase-admin chưa được cài đặt.\n" +
      "   Chạy: npm install --save-dev firebase-admin\n" +
      "   hoặc:  npm install firebase-admin"
  );
  process.exit(1);
}

const SITE_URL = (process.env.SITE_URL || "https://luathapdan.edu.vn").replace(/\/$/, "");
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
const RAW_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;

let firebaseInitialized = false;

// Nếu có đủ biến môi trường inline → dùng service account trực tiếp
if (PROJECT_ID && CLIENT_EMAIL && RAW_PRIVATE_KEY) {
  // "\n" literal trong .env → thay thành ký tự newline thật
  const privateKey = RAW_PRIVATE_KEY.replace(/\\n/g, "\n");

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: PROJECT_ID,
      clientEmail: CLIENT_EMAIL,
      privateKey,
    }),
  });
  firebaseInitialized = true;
  console.log(`🔐 Dùng service account: ${CLIENT_EMAIL} (project: ${PROJECT_ID})`);
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Dùng file serviceAccountKey.json qua biến môi trường chuẩn của Google
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  });
  firebaseInitialized = true;
  console.log(`🔐 Dùng Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS)`);
} else {
  console.warn(
    "⚠️  Không có thông tin xác thực Firebase Admin.\n" +
      "   Sitemap sẽ chỉ chứa các route tĩnh (không có dữ liệu động từ Firestore).\n" +
      "   Để có đầy đủ dữ liệu, cung cấp một trong hai:\n" +
      "   (A) Ba biến môi trường: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY\n" +
      "   (B) Biến GOOGLE_APPLICATION_CREDENTIALS trỏ đến file serviceAccountKey.json"
  );
}

// Only get Firestore if Firebase was initialized
const db = firebaseInitialized ? admin.firestore() : null;

// ---------------------------------------------------------------------------
// 2. Định nghĩa các route tĩnh (public, có thể index bởi search engine)
// ---------------------------------------------------------------------------
const STATIC_ROUTES = [
  { path: "/",                              priority: "1.0", changefreq: "daily"   },
  { path: "/gioi-thieu",                   priority: "0.8", changefreq: "monthly" },
  { path: "/gioi-thieu/mong-coaching",     priority: "0.7", changefreq: "monthly" },
  { path: "/dao-tao",                      priority: "0.9", changefreq: "weekly"  },
  { path: "/dao-tao/luat-hap-dan",         priority: "0.8", changefreq: "monthly" },
  { path: "/dao-tao/khoi-thong-dong-tien", priority: "0.8", changefreq: "monthly" },
  { path: "/dao-tao/vut-toc-muc-tieu",     priority: "0.8", changefreq: "monthly" },
  { path: "/tin-tuc",                      priority: "0.8", changefreq: "daily"   },
  { path: "/khoa-hoc",                     priority: "0.9", changefreq: "weekly"  },
  { path: "/cam-nhan",                     priority: "0.7", changefreq: "monthly" },
  { path: "/tuyen-dung",                   priority: "0.7", changefreq: "weekly"  },
  { path: "/lien-he",                      priority: "0.6", changefreq: "monthly" },
  // Trang kiến thức tĩnh
  { path: "/kien-thuc/luat-nhan-qua-hap-dan",  priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/tiem-thuc-niem-tin",      priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/chua-lanh-noi-tam",       priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/thien-thuc-hanh",         priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/nang-luong-tien",         priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/muc-tieu-hieu-suat",      priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/kinh-doanh-tinh-thuc",    priority: "0.7", changefreq: "monthly" },
  { path: "/kien-thuc/video-podcast",           priority: "0.7", changefreq: "weekly"  },
];

// ---------------------------------------------------------------------------
// 3. Hàm tiện ích
// ---------------------------------------------------------------------------

/**
 * Định dạng timestamp thành YYYY-MM-DD cho <lastmod>.
 * Chấp nhận Firestore Timestamp, JS Date, epoch ms hoặc chuỗi ISO.
 */
function toDateString(value) {
  if (!value) return new Date().toISOString().split("T")[0];
  // Firestore Timestamp object
  if (typeof value.toDate === "function") {
    return value.toDate().toISOString().split("T")[0];
  }
  return new Date(value).toISOString().split("T")[0];
}

/** Trả về một <url> block XML đầy đủ. */
function urlEntry({ loc, lastmod, changefreq = "monthly", priority = "0.7" }) {
  return [
    "  <url>",
    `    <loc>${loc}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Escape ký tự đặc biệt trong XML URL. */
function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/'/g, "&apos;")
    .replace(/"/g, "&quot;")
    .replace(/>/g, "&gt;")
    .replace(/</g, "&lt;");
}

// ---------------------------------------------------------------------------
// 4. Hàm chính
// ---------------------------------------------------------------------------
async function generateSitemap() {
  console.log("🚀 Bắt đầu sinh sitemap...");
  console.log(`   Base URL: ${SITE_URL}`);

  const entries = [];

  // ── 4a. Route tĩnh ──────────────────────────────────────────────────────
  console.log(`📄 Thêm ${STATIC_ROUTES.length} route tĩnh...`);
  for (const route of STATIC_ROUTES) {
    entries.push(
      urlEntry({
        loc: escapeXml(`${SITE_URL}${route.path}`),
        changefreq: route.changefreq,
        priority: route.priority,
      })
    );
  }

  // ── 4b. Courses (Khóa học) ───────────────────────────────────────────────
  // Skip if Firebase not initialized (db is undefined)
  if (!db) {
    console.log("📦 Bỏ qua danh sách khóa học (không có kết nối Firebase)");
  } else {
    console.log("📦 Đang lấy danh sách khóa học (courses)...");
  }
  let courseCount = 0;
  try {
    if (!db) throw new Error("Firebase not initialized");
    const snapshot = await db
      .collection("courses")
      .where("isPublished", "==", true)
      .get();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      entries.push(
        urlEntry({
          loc: escapeXml(`${SITE_URL}/khoa-hoc/${slug}`),
          lastmod: toDateString(data.updatedAt || data.createdAt),
          changefreq: "monthly",
          priority: "0.9",
        })
      );
      courseCount++;
    });
    console.log(`   ✅ ${courseCount} khóa học`);
  } catch (err) {
    console.warn("   ⚠️  Không thể lấy courses:", err.message);
  }

  // ── 4c. Posts / Tin tức ──────────────────────────────────────────────────
  // Collection "posts" chứa cả bài viết thông thường (/bai-viet/:slug)
  // và tin tức theo danh mục "Tin tức" (/tin-tuc/:slug).
  if (!db) {
    console.log("📝 Bỏ qua bài viết (không có kết nối Firebase)");
  } else {
    console.log("📝 Đang lấy bài viết (posts)...");
  }
  let postCount = 0;
  try {
    if (!db) throw new Error("Firebase not initialized");
    const snapshot = await db
      .collection("posts")
      .where("isPublished", "==", true)
      .get();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      // Phân loại đường dẫn theo danh mục
      const routePrefix =
        data.category === "Tin tức" ? "tin-tuc" : "bai-viet";

      entries.push(
        urlEntry({
          loc: escapeXml(`${SITE_URL}/${routePrefix}/${slug}`),
          lastmod: toDateString(data.updatedAt || data.createdAt),
          changefreq: "monthly",
          priority: "0.7",
        })
      );
      postCount++;
    });
    console.log(`   ✅ ${postCount} bài viết`);
  } catch (err) {
    console.warn("   ⚠️  Không thể lấy posts:", err.message);
  }

  // ── 4d. News (nếu có collection riêng) ───────────────────────────────────
  // Một số dự án tách riêng collection "news". Kiểm tra thêm để không bỏ sót.
  if (!db) {
    console.log("📰 Bỏ qua collection 'news' (không có kết nối Firebase)");
  } else {
    console.log("📰 Đang kiểm tra collection 'news'...");
  }
  let newsCount = 0;
  try {
    if (!db) throw new Error("Firebase not initialized");
    const snapshot = await db
      .collection("news")
      .where("isPublished", "==", true)
      .get();

    if (!snapshot.empty) {
      snapshot.forEach((doc) => {
        const data = doc.data();
        const slug = data.slug || doc.id;
        entries.push(
          urlEntry({
            loc: escapeXml(`${SITE_URL}/tin-tuc/${slug}`),
            lastmod: toDateString(data.updatedAt || data.createdAt),
            changefreq: "weekly",
            priority: "0.7",
          })
        );
        newsCount++;
      });
      console.log(`   ✅ ${newsCount} tin tức từ collection 'news'`);
    } else {
      console.log("   ℹ️  Collection 'news' trống hoặc không tồn tại, bỏ qua.");
    }
  } catch (err) {
    // Lỗi "NOT_FOUND" là bình thường nếu collection chưa tồn tại
    if (!err.message?.includes("NOT_FOUND")) {
      console.warn("   ⚠️  Không thể lấy news:", err.message);
    } else {
      console.log("   ℹ️  Collection 'news' chưa tồn tại, bỏ qua.");
    }
  }

  // ── 4e. Recruitment (Tuyển dụng) ─────────────────────────────────────────
  if (!db) {
    console.log("👔 Bỏ qua tin tuyển dụng (không có kết nối Firebase)");
  } else {
    console.log("👔 Đang lấy tin tuyển dụng (recruitment)...");
  }
  let recruitCount = 0;
  try {
    if (!db) throw new Error("Firebase not initialized");
    const snapshot = await db
      .collection("recruitment")
      .where("isPublished", "==", true)
      .get();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const slug = data.slug || doc.id;
      entries.push(
        urlEntry({
          loc: escapeXml(`${SITE_URL}/tuyen-dung/${slug}`),
          lastmod: toDateString(data.updatedAt || data.createdAt),
          changefreq: "monthly",
          priority: "0.6",
        })
      );
      recruitCount++;
    });
    console.log(`   ✅ ${recruitCount} tin tuyển dụng`);
  } catch (err) {
    if (!err.message?.includes("NOT_FOUND")) {
      console.warn("   ⚠️  Không thể lấy recruitment:", err.message);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Ghép XML và ghi file
  // ---------------------------------------------------------------------------
  const today = new Date().toISOString().split("T")[0];
  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<!-- Sitemap tự động sinh lúc build – ${today} -->`,
    `<!-- Tổng URL: ${entries.length} (tĩnh: ${STATIC_ROUTES.length}, khóa học: ${courseCount}, bài viết: ${postCount}, news: ${newsCount}, tuyển dụng: ${recruitCount}) -->`,
    `<urlset`,
    `  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"`,
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`,
    `  xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9`,
    `  http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">`,
    ...entries,
    `</urlset>`,
  ].join("\n");

  const PUBLIC_DIR = path.resolve(__dirname, "../public");
  const OUTPUT_PATH = path.join(PUBLIC_DIR, "sitemap.xml");

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, xml, "utf8");

  const relativePath = path.relative(path.resolve(__dirname, ".."), OUTPUT_PATH);
  console.log(`\n✅ Sitemap đã lưu tại: ${relativePath}`);
  console.log(`   Tổng ${entries.length} URL (tĩnh: ${STATIC_ROUTES.length}, khóa học: ${courseCount}, bài viết: ${postCount + newsCount}, tuyển dụng: ${recruitCount})`);
}

generateSitemap()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Lỗi sinh sitemap:", err);
    process.exit(1);
  });
