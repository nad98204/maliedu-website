/**
 * Landing Templates Registry
 * 
 * File này export tất cả landing page templates có sẵn.
 * Mỗi khi thêm template mới, import và export tại đây.
 * 
 * Format:
 * export { default as TenComponent } from './folder-name/TenComponent';
 */

// ============================================
// EXAMPLE TEMPLATE (Xóa khi không cần)
// ============================================
export { default as ExampleTemplate } from './example-template/ExampleTemplate';

// ============================================
// PRODUCTION TEMPLATES
// ============================================

// Thiền Giao Thừa - Sự kiện năm mới
export { default as ThienGiaoThua } from './thien-giao-thua';

// Khơi Thông Dòng Tiền - Sự kiện tài chính
export { default as KhoiThongDongTien } from './khoi-thong-dong-tien';
export { default as KhoiThongDongTienLeader } from './khoi-thong-dong-tien/KhoiThongDongTienLeader';
export { default as DongTienThinhVuongTuBanThe } from './dong-tien-thinh-vuong-tu-ban-the/DòngTiềnThịnhVượngTừBảnThể';

