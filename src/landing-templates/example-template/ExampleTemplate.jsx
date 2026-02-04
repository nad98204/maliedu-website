import React from 'react';
import { CheckCircle, Star, ArrowRight } from 'lucide-react';

/**
 * Example Landing Template
 * 
 * Đây là template mẫu để tham khảo cấu trúc.
 * Copy template này khi tạo landing page mới.
 */
const ExampleTemplate = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Landing Page Template Mẫu
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-indigo-100">
            Đây là section hero - thay đổi nội dung theo nhu cầu
          </p>
          <button className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all inline-flex items-center gap-2">
            Đăng ký ngay
            <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-slate-800">
            Lợi ích nổi bật
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all">
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="text-indigo-600" size={24} />
                </div>
                <h3 className="font-bold text-xl mb-2 text-slate-800">Tính năng {i}</h3>
                <p className="text-slate-600">Mô tả chi tiết về tính năng này...</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-indigo-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Sẵn sàng bắt đầu?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Đăng ký ngay để nhận ưu đãi đặc biệt
          </p>
          <button className="bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all">
            Đăng ký miễn phí
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p>© 2026 Mali Edu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default ExampleTemplate;
