import React from 'react';
import { FaFacebook, FaYoutube, FaUsers } from 'react-icons/fa';
import { Helmet } from 'react-helmet-async';

const LinkBio = () => {
  const links = [
    {
      title: 'Facebook',
      subtitle: 'Trang cá nhân Facebook của tôi',
      url: 'https://www.facebook.com/mong.coaching',
      icon: <FaFacebook className="w-6 h-6 text-blue-600" />
    },
    {
      title: 'YouTube',
      subtitle: 'Mong Coaching',
      url: 'https://www.youtube.com/@nguyenuocmong53',
      icon: <FaYoutube className="w-6 h-6 text-red-600" />
    },
    {
      title: 'Cộng Đồng Luật Hấp Dẫn',
      subtitle: 'Nơi mọi người chia kết quả và những bài học về Luật Hấp Dẫn',
      url: 'https://www.facebook.com/groups/1567840277339435',
      icon: <FaUsers className="w-6 h-6 text-green-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-white flex justify-center p-4 sm:p-8">
      <Helmet>
        <title>Mong Coaching | Link Bio</title>
        <meta name="description" content="Kết nối với Mong Coaching qua các mạng xã hội và cộng đồng Luật Hấp Dẫn." />
      </Helmet>
      
      <div className="w-full max-w-[480px] flex flex-col items-center">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full overflow-hidden mb-4 border-2 border-gray-100 shadow-lg">
          <img 
            src="https://s3-hn1-api.longvan.vn/video-khoa-hoc/videos/1777965254335-679939279-Avatar.jpg" 
            alt="Mong Coaching" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Name */}
        <h1 className="text-xl font-bold text-gray-900 mb-1 tracking-tight">Mong Coaching</h1>
        <p className="text-gray-600 text-sm mb-8 font-medium">Liên hệ với tôi Mong Coaching:</p>
        
        {/* Links List */}
        <div className="w-full space-y-3">
          {links.map((link, index) => (
            <a 
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center w-full p-4 bg-white border border-gray-200 rounded-[24px] shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
            >
              <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mr-4 group-hover:bg-white transition-colors">
                {link.icon}
              </div>
              <div className="flex-grow text-left">
                <div className="font-bold text-gray-900 text-[15px] leading-tight">{link.title}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{link.subtitle}</div>
              </div>
            </a>
          ))}
        </div>

        {/* Footer info (optional, keeping it simple) */}
        <div className="mt-12 text-gray-400 text-[10px] font-medium tracking-widest uppercase">
          © 2026 Mong Coaching
        </div>
      </div>
    </div>
  );
};

export default LinkBio;
