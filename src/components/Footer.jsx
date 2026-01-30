import React from "react";

const Footer = () => {
  const contactItems = [
    {
      label: "Hotline",
      value: "0355 067 656",
      href: "tel:0355067656",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M6.6 3.5 9 4.1c.4.1.7.4.8.8l.6 3c0 .3 0 .6-.2.8l-1.8 1.8c.9 1.6 2.3 3 3.9 3.9l1.8-1.8c.2-.2.5-.3.8-.2l3 .6c.4.1.7.4.8.8l.6 2.4c.2.7-.2 1.4-.9 1.6-1.3.4-2.7.5-4.1.3-1-.2-2.1-.5-3.2-1-1.8-.8-3.4-2-4.7-3.4C5.9 13.2 4.5 10.7 4 8c-.3-1.4-.3-2.8.1-4.1.2-.7.9-1.1 1.5-1z" />
        </svg>
      ),
    },
    {
      label: "Email",
      value: "mongcoaching@gmail.com",
      href: "mailto:mongcoaching@gmail.com",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M3.2 5.8C3.7 4.8 4.7 4 5.8 4h12.4c1.1 0 2.1.8 2.6 1.8L12 11.6 3.2 5.8zM3 7.7V16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7.7l-8.5 5.7c-.3.2-.7.2-1 0L3 7.7z" />
        </svg>
      ),
    },
    {
      label: "Địa chỉ",
      value: "Him Lam, Vạn Phúc, Hà Đông, Hà Nội, Việt Nam",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M12 3c3.9 0 7 3 7 6.8 0 3.6-2.6 7.8-6.7 11.1-.2.2-.5.2-.7 0C7.5 17.6 5 13.4 5 9.8 5 6 8.1 3 12 3zm0 2c-2.7 0-5 2-5 4.8 0 2.6 2.1 6.1 5 8.9 2.9-2.8 5-6.3 5-8.9C17 7 14.7 5 12 5zm0 2.3c1.4 0 2.5 1 2.5 2.4S13.4 12 12 12s-2.5-1-2.5-2.3S10.6 7.3 12 7.3z" />
        </svg>
      ),
    },
  ];

  const socials = [
    {
      href: "https://www.facebook.com/MongCoaching.LuatHapDan",
      label: "Facebook",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M13 10h2.5l.5-3H13V5.5c0-.9.3-1.5 1.6-1.5H16V1.2C15.4 1.1 14.3 1 13 1a4 4 0 0 0-4.3 4.4V7H6v3h2.7v9H13v-9z" />
        </svg>
      ),
    },
    {
      href: "https://www.youtube.com/@nguyenuocmong53",
      label: "YouTube",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M21.6 7.2s-.2-1.6-.8-2.3c-.7-.8-1.4-.8-1.8-.8C16 4 12 4 12 4h-.1S7.9 4 5 4.1c-.4 0-1.1 0-1.8.8-.6.7-.8 2.3-.8 2.3S2 8.8 2 10.4v1.1c0 1.6.3 3.2.3 3.2s.2 1.6.8 2.3c.7.8 1.7.7 2.2.8 1.6.2 6.7.3 6.7.3s4 0 6.9-.3c.4 0 1.1 0 1.8-.8.6-.7.8-2.3.8-2.3s.3-1.6.3-3.2v-1c0-1.6-.3-3.2-.3-3.2zM10 14.8V8.9l4.7 2.9z" />
        </svg>
      ),
    },
    {
      href: "https://www.tiktok.com/@nguyenuocmong53",
      label: "TikTok",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M15.6 4c.3 1.7 1.4 3 3 3.2v2.5c-1.1 0-2.1-.3-3-.9v4.7a5.2 5.2 0 1 1-5.2-5.2c.2 0 .3 0 .5.1V11a2.7 2.7 0 1 0 2 2.6V4h2.7z" />
        </svg>
      ),
    },
    {
      href: "https://luathapdan.edu.vn/",
      label: "Website",
      Icon: () => (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#f3a712]">
          <path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20zm0 2c.9 0 1.8.2 2.6.5-.5.6-.9 1.4-1.3 2.4-.5-.1-1-.2-1.3-.2-.4 0-.9.1-1.4.2-.4-1-.9-1.8-1.4-2.4A7.9 7.9 0 0 1 12 4zm-3 2.4c.5.7 1 1.6 1.4 2.7a15 15 0 0 0-2.6.6A6.1 6.1 0 0 1 9 6.4zM7 12a6 6 0 0 1 .1-1.1 12.8 12.8 0 0 1 3.1-.8c.1.6.1 1.2.1 1.9s0 1.3-.1 1.9a12.8 12.8 0 0 1-3.1-.9A6 6 0 0 1 7 12zm.9 3.3c.8.3 1.7.5 2.6.7-.4 1-.9 2-1.4 2.7a6.1 6.1 0 0 1-1.2-3.4zm4.4 3.6c.5-.6 1-1.5 1.4-2.6l.1-.1.2-.6c.9-.2 1.8-.4 2.6-.7a6.1 6.1 0 0 1-1.4 3.4c-.9.4-1.8.6-2.9.6zM17 12c0 .4 0 .8-.1 1.1-.8.3-1.8.6-3 .8l-.2-.8c-.1-.5 0-1 .1-1.6l.2-.8c1.2.2 2.2.5 3 .8.1.3.1.7.1 1.1zm-.2-2.8a12.9 12.9 0 0 0-2.6-.6c.4-1 .9-2 1.4-2.7a6.1 6.1 0 0 1 1.2 3.4z" />
        </svg>
      ),
    },
  ];

  return (
    <footer className="font-sans text-[#f5e9d7] bg-[radial-gradient(circle_at_10%_10%,rgba(92,66,36,0.25),rgba(20,14,11,0.95)_55%),linear-gradient(135deg,#1a120e_0%,#0d0a0a_70%)] pt-16 pb-10">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-start mb-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3 flex-wrap">
              <img
                src="https://res.cloudinary.com/dstukyjzd/image/upload/v1767861713/FULL_SIZE_ls1mmd.png"
                alt="Mali Edu Logo"
                className="h-14 w-auto object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.35)]"
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="w-[3px] h-6 bg-[#f3a712]" />
              <h3 className="text-lg font-serif font-semibold tracking-[0.12em] text-white uppercase">
                Thông Tin Liên Hệ
              </h3>
            </div>

            <div className="space-y-4">
              {contactItems.map(({ label, value, href, Icon }) => (
                <div
                  key={label}
                  className="grid grid-cols-[44px,1fr] gap-3 items-start rounded-xl border border-white/5 bg-white/5 px-3 py-3"
                >
                  <div className="w-11 h-11 rounded-full border border-[#f3a712]/40 bg-[#f3a712]/10 grid place-items-center">
                    <Icon />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.08em] text-[#e5d3b4]">
                      {label}
                    </p>
                    {href ? (
                      <a
                        href={href}
                        className="text-[15px] text-[#f5e9d7] hover:text-[#f7b94a] transition-colors"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-[15px] text-[#f5e9d7]">{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5 md:justify-self-end w-full">
            <h3 className="text-white font-serif font-semibold tracking-[0.12em] uppercase text-lg">
              Kết Nối Với Chúng Tôi
            </h3>

            <div className="flex flex-wrap gap-3">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full grid place-items-center border border-[#f3a712]/40 bg-white/5 text-[#f3a712] hover:bg-[#f3a712]/15 hover:shadow-[0_10px_20px_rgba(0,0,0,0.35),0_0_0_1px_rgba(243,167,18,0.6)] transition-all"
                >
                  <Icon />
                </a>
              ))}
            </div>

            <p className="italic font-serif text-[15px] leading-relaxed text-[#f5e9d7]">
              “Kết nối tiềm thức – xây dựng kỷ luật – hiện thực hóa mục tiêu.”
            </p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-[#e5d3b4] gap-3">
          <span>© 2026 Mali Edu. All rights reserved.</span>
          <span className="text-[#f7b94a] font-semibold">Designed for Success.</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
