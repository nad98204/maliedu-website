import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const crmConfig = {
  apiKey: "AIzaSyDr6pJNY5ThZz2NMox5lqXLR_gihyxrNFU",
  authDomain: "dangpkkzxy.firebaseapp.com",
  projectId: "dangpkkzxy",
  storageBucket: "dangpkkzxy.firebasestorage.app",
  messagingSenderId: "644778150594",
  appId: "1:644778150594:web:0c4dca15c424e86efc495b",
  databaseURL: "https://dangpkkzxy-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(crmConfig, "setupAdmin");
const db = getFirestore(app);

const setup = async () => {
  try {
    const landingId = "khoi-thong-dong-tien-leader";
    const sourceKey = "1768973783248_k41";

    console.log("Setting up Leader Landing Page in Firestore...");

    // 1. Tạo Landing Page config
    await setDoc(doc(db, "landing_pages", landingId), {
      name: "Leader - Khơi Thông Dòng Tiền",
      slug: "/dao-tao/khoi-thong-dong-tien-leader",
      active_source_key: sourceKey,
      is_maintenance: false,
      course_k: "K41",
      targetFunnel: "LEADER",
      funnel_type: "leader",
      updatedAt: serverTimestamp()
    }, { merge: true });

    // 2. Tạo Source Config sync
    await setDoc(doc(db, "source_configs", sourceKey), {
      id: sourceKey,
      source_name: "Leader - Khơi Thông Dòng Tiền",
      targetFunnel: "LEADER",
      targetK: "K41",
      assignedSale: "Round Robin",
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log("✅ SUCCESS: Setup complete!");
  } catch (error) {
    console.error("❌ FAILED:", error);
  } finally {
    process.exit();
  }
};

setup();
