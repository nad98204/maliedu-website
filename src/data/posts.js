// MOCK DATA - Sample posts database
// This simulates what would come from Firebase/Cloudinary

export const SAMPLE_POSTS = [
    {
        id: 1,
        title: "Hành trình X2 thu nhập nhờ thay đổi tâm thức tài chính",
        slug: "hanh-trinh-x2-thu-nhap",
        type: "case-study",
        category: "Kết quả học viên",
        author: "Mong Coaching",
        thumbnailUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=600&fit=crop",
        excerpt: "Câu chuyện thực tế của học viên Nguyễn Văn A về việc nhân đôi thu nhập chỉ sau 6 tháng áp dụng các nguyên tắc tài chính từ khóa học.",
        createdAt: "14/01/2026",
        // Extended content for detail page
        content: `
            <p>Tôi là Nguyễn Văn A, trước khi tham gia khóa học "Khởi Thông Dòng Tiền" của Mali Edu, thu nhập của tôi chỉ đủ để trang trải cuộc sống hàng ngày. Tôi luôn cảm thấy bị mắc kẹt trong vòng lặp tài chính không thể thoát ra.</p>

            <h2>Điểm chuyển biến</h2>
            <p>Sau buổi học đầu tiên, tôi nhận ra rằng vấn đề không nằm ở số tiền tôi kiếm được, mà ở cách tôi nghĩ về tiền bạc. Những niềm tin hạn chế về tài chính đã được cấy vào tâm thức tôi từ nhỏ.</p>

            <blockquote>"Tiền không phải là vấn đề, tâm thức về tiền mới là chìa khóa" - Mong Coaching</blockquote>

            <h2>Hành động cụ thể</h2>
            <p>Tôi bắt đầu thay đổi ngay từ những việc nhỏ nhất:</p>
            <ul>
                <li>Viết nhật ký tài chính mỗi ngày</li>
                <li>Thực hành khẳng định tích cực buổi sáng</li>
                <li>Xây dựng hệ thống quản lý chi tiêu</li>
                <li>Đầu tư vào phát triển bản thân</li>
            </ul>

            <h2>Kết quả sau 6 tháng</h2>
            <p>Con số không nói dối: Thu nhập của tôi đã tăng gấp đôi. Nhưng quan trọng hơn, tôi đã tìm lại được sự tự tin và niềm tin vào khả năng tạo ra giá trị của chính mình.</p>

            <p>Nếu tôi có thể làm được, bạn cũng có thể. Hãy bắt đầu hành trình chuyển hóa của bạn ngay hôm nay!</p>
        `
    },
    {
        id: 2,
        title: "Bí quyết quản lý tiền bạc thông minh cho người mới bắt đầu",
        slug: "bi-quyet-quan-ly-tien-bac",
        type: "article",
        category: "Kiến thức tài chính",
        author: "Mali Edu Team",
        thumbnailUrl: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=600&fit=crop",
        excerpt: "7 nguyên tắc vàng giúp bạn kiểm soát tài chính cá nhân hiệu quả và xây dựng nền tảng vững chắc cho tương lai.",
        createdAt: "12/01/2026",
        content: `
            <p>Quản lý tài chính cá nhân là kỹ năng sống quan trọng nhưng hiếm khi được dạy ở trường học. Hãy cùng khám phá 7 nguyên tắc vàng giúp bạn làm chủ dòng tiền của mình.</p>

            <h2>1. Nguyên tắc 50/30/20</h2>
            <p>Đây là quy tắc đơn giản nhất để phân bổ thu nhập:</p>
            <ul>
                <li>50% cho nhu cầu thiết yếu (nhà ở, ăn uống, đi lại)</li>
                <li>30% cho mong muốn cá nhân (giải trí, sở thích)</li>
                <li>20% cho tiết kiệm và đầu tư</li>
            </ul>

            <h2>2. Trả cho bản thân trước tiên</h2>
            <blockquote>"Hãy trả cho chính mình trước khi trả cho bất kỳ ai khác"</blockquote>
            <p>Ngay khi nhận lương, hãy chuyển khoản tự động 10-20% vào tài khoản tiết kiệm riêng biệt.</p>

            <h2>3. Xây dựng quỹ khẩn cấp</h2>
            <p>Mục tiêu: Tiết kiệm đủ chi phí sinh hoạt cho 3-6 tháng. Quỹ này giúp bạn yên tâm khi gặp biến cố bất ngờ.</p>

            <h2>4. Tránh nợ tiêu dùng</h2>
            <p>Thẻ tín dụng là công cụ tốt nếu bạn biết cách sử dụng. Quy tắc vàng: Chỉ chi tiêu những gì bạn có thể trả được ngay lập tức.</p>

            <h2>5. Đầu tư vào bản thân</h2>
            <p>Đây là khoản đầu tư sinh lời cao nhất. Học hỏi kỹ năng mới, tham gia khóa học, đọc sách - tất cả đều tăng giá trị của bạn.</p>

            <h2>6. Theo dõi chi tiêu hàng ngày</h2>
            <p>Không thể quản lý những gì bạn không đo lường được. Hãy ghi chép mọi khoản chi tiêu trong ít nhất 1 tháng.</p>

            <h2>7. Đặt mục tiêu tài chính rõ ràng</h2>
            <p>Mục tiêu càng cụ thể, động lực thực hiện càng lớn. Thay vì "tôi muốn giàu có", hãy nói "tôi sẽ tiết kiệm 100 triệu trong 2 năm tới".</p>
        `
    },
    {
        id: 3,
        title: "Giải mã luật hấp dẫn trong tài chính - Webinar miễn phí",
        slug: "giai-ma-luat-hap-dan-tai-chinh",
        type: "video",
        category: "Video đào tạo",
        author: "Mong Coaching",
        thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        excerpt: "Buổi chia sẻ trực tiếp từ Mong Coaching về cách áp dụng luật hấp dẫn để thu hút nguồn tài chính dồi dào.",
        createdAt: "10/01/2026",
        content: `
            <p>Trong buổi webinar đặc biệt này, Mong Coaching sẽ chia sẻ những bí mật về Luật Hấp Dẫn và cách áp dụng nó vào lĩnh vực tài chính.</p>
            
            <h2>Nội dung chính</h2>
            <ul>
                <li>Hiểu đúng về Luật Hấp Dẫn</li>
                <li>Tại sao tâm thức quyết định tài chính</li>
                <li>3 bước thực hành hàng ngày</li>
                <li>Câu chuyện thực tế từ học viên</li>
            </ul>

            <p>Hãy xem video để khám phá thêm!</p>
        `
    },
    {
        id: 4,
        title: "Từ nợ nần chồng chất đến tự do tài chính - Câu chuyện của chị Mai",
        slug: "tu-no-nan-den-tu-do-tai-chinh",
        type: "case-study",
        category: "Kết quả học viên",
        author: "Mong Coaching",
        thumbnailUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=600&fit=crop",
        excerpt: "Hành trình phi thường của chị Mai trong việc vượt qua khủng hoảng tài chính và xây dựng lại cuộc sống thịnh vượng.",
        createdAt: "08/01/2026",
        content: `
            <p>Năm 2023 là năm khó khăn nhất trong cuộc đời tôi. Tôi mang khoản nợ 300 triệu đồng, công việc không ổn định, và quan trọng nhất - tôi đã mất hết niềm tin vào bản thân.</p>

            <h2>Gặp gỡ Mali Edu</h2>
            <p>Tôi tình cờ xem được một video của Mong Coaching trên Facebook. Lúc đầu tôi khá hoài nghi, nhưng có gì đó trong lời nói của cô ấy khiến tôi muốn thử.</p>

            <blockquote>"Nợ nần không phải là kết thúc, mà là điểm bắt đầu cho một cuộc sống mới"</blockquote>

            <h2>Lộ trình chuyển hóa</h2>
            <p>Tôi bắt đầu với khóa "Khởi Thông Dòng Tiền". Mỗi buổi học đều mở ra một góc nhìn mới:</p>
            
            <ul>
                <li><strong>Tháng 1-2:</strong> Chữa lành những niềm tin sai lầm về tiền bạc</li>
                <li><strong>Tháng 3-4:</strong> Xây dựng kế hoạch trả nợ khoa học</li>
                <li><strong>Tháng 5-6:</strong> Tạo thêm nguồn thu nhập phụ</li>
                <li><strong>Tháng 7-12:</strong> Đẩy nhanh tiến độ trả nợ</li>
            </ul>

            <h2>Kết quả ngày hôm nay</h2>
            <p>Sau 18 tháng, tôi đã trả hết nợ và tích lũy được 50 triệu tiết kiệm. Nhưng giá trị lớn nhất không phải là con số, mà là sự tự tin và niềm tin tôi lấy lại được.</p>

            <p>Cảm ơn Mali Edu, cảm ơn Mong Coaching đã giúp tôi tìm lại chính mình!</p>
        `
    },
    {
        id: 5,
        title: "5 bước xây dựng kế hoạch tài chính dài hạn",
        slug: "5-buoc-xay-dung-ke-hoach-tai-chinh",
        type: "article",
        category: "Kiến thức tài chính",
        author: "Mali Edu Team",
        thumbnailUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop",
        excerpt: "Hướng dẫn chi tiết từng bước để bạn có thể tự tay lập kế hoạch tài chính cá nhân bền vững và hiệu quả.",
        createdAt: "05/01/2026",
        content: `
            <p>Lập kế hoạch tài chính không khó như bạn nghĩ. Hãy làm theo 5 bước đơn giản này để bắt đầu hành trình tự do tài chính của bạn.</p>

            <h2>Bước 1: Đánh giá tình hình hiện tại</h2>
            <p>Trước khi đi, bạn cần biết mình đang đứng ở đâu:</p>
            <ul>
                <li>Tổng tài sản: Tiền mặt, tiết kiệm, bất động sản, cổ phiếu...</li>
                <li>Tổng nợ: Nợ thẻ tín dụng, vay mua nhà, vay tiêu dùng...</li>
                <li>Thu nhập hàng tháng: Lương, thu nhập thụ động</li>
                <li>Chi tiêu hàng tháng: Phân loại chi tiết</li>
            </ul>

            <h2>Bước 2: Xác định mục tiêu tài chính</h2>
            <p>Chia mục tiêu thành 3 nhóm:</p>
            <ul>
                <li><strong>Ngắn hạn (1-2 năm):</strong> Quỹ khẩn cấp, trả hết nợ xấu</li>
                <li><strong>Trung hạn (3-5 năm):</strong> Mua nhà, xe, du học</li>
                <li><strong>Dài hạn (10+ năm):</strong> Hưu trí, tự do tài chính</li>
            </ul>

            <blockquote>"Mục tiêu không có deadline chỉ là giấc mơ"</blockquote>

            <h2>Bước 3: Tạo ngân sách chi tiết</h2>
            <p>Sử dụng công thức phân bổ thu nhập phù hợp với hoàn cảnh của bạn. Đảm bảo luôn có phần dành cho tiết kiệm và đầu tư.</p>

            <h2>Bước 4: Lựa chọn công cụ đầu tư</h2>
            <p>Tùy theo độ rủi ro bạn chấp nhận:</p>
            <ul>
                <li>Thấp: Tiết kiệm, trái phiếu chính phủ</li>
                <li>Trung bình: Quỹ đầu tư, vàng</li>
                <li>Cao: Cổ phiếu, bất động sản, crypto</li>
            </ul>

            <h2>Bước 5: Theo dõi và điều chỉnh</h2>
            <p>Kế hoạch tốt nhất là kế hoạch linh hoạt. Rà soát lại mỗi quý, điều chỉnh nếu cần thiết.</p>

            <p>Hãy bắt đầu ngay hôm nay - tương lai của bạn sẽ cảm ơn hiện tại!</p>
        `
    },
    {
        id: 6,
        title: "Khóa học 'Khởi Thông Dòng Tiền' - Review từ học viên",
        slug: "khoi-thong-dong-tien-review",
        type: "video",
        category: "Video đào tạo",
        author: "Mali Edu Team",
        thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        excerpt: "Những chia sẻ chân thật từ học viên đã tham gia khóa học và những thay đổi tích cực họ trải nghiệm.",
        createdAt: "03/01/2026",
        content: `
            <p>Xem video để nghe những chia sẻ chân thực từ học viên đã trải nghiệm khóa học "Khởi Thông Dòng Tiền".</p>

            <h2>Điểm nổi bật của khóa học</h2>
            <ul>
                <li>Phương pháp chữa lành tâm thức tài chính</li>
                <li>Công cụ quản lý tiền bạc hiệu quả</li>
                <li>Cộng đồng hỗ trợ nhiệt tình</li>
                <li>Theo dõi tiến độ cá nhân hóa</li>
            </ul>

            <p>Đã có hơn 5,000 học viên thay đổi cuộc sống nhờ khóa học này!</p>
        `
    },
    {
        id: 7,
        title: "Tâm linh và Tài chính: Mối liên kết bí ẩn",
        slug: "tam-linh-va-tai-chinh",
        type: "article",
        category: "Tâm linh & Tài chính",
        author: "Mong Coaching",
        thumbnailUrl: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=800&h=600&fit=crop",
        excerpt: "Khám phá mối quan hệ sâu sắc giữa tâm thức, năng lượng và khả năng thu hút tài lộc trong cuộc sống.",
        createdAt: "01/01/2026",
        content: `
            <p>Nhiều người ngạc nhiên khi nghe về mối liên hệ giữa tâm linh và tài chính. Nhưng thực tế, đây là hai mặt của cùng một đồng xu.</p>

            <h2>Năng lượng thu hút tài lộc</h2>
            <p>Theo quan điểm tâm linh, mọi thứ đều là năng lượng - kể cả tiền bạc. Khi bạn mang trong mình năng lượng thiếu hụt, sợ hãi, bạn sẽ đẩy tiền ra xa mình.</p>

            <blockquote>"Bạn không thu hút những gì bạn muốn, bạn thu hút những gì bạn là"</blockquote>

            <h2>Những niềm tin hạn chế phổ biến</h2>
            <ul>
                <li>"Tiền là nguồn gốc của mọi tội lỗi"</li>
                <li>"Người giàu thường ích kỷ"</li>
                <li>"Tôi không xứng đáng giàu có"</li>
                <li>"Kiếm tiền phải vất vả mới có giá trị"</li>
            </ul>

            <h2>Chữa lành mối quan hệ với tiền</h2>
            <p>Hãy bắt đầu bằng việc nhìn nhận tiền bạc như một người bạn, một công cụ giúp bạn sống cuộc đời ý nghĩa hơn:</p>
            <ol>
                <li>Cảm ơn mỗi đồng tiền đến với bạn</li>
                <li>Chúc phúc cho tiền khi bạn chi tiêu</li>
                <li>Tin tưởng rằng nguồn tài chính luôn dồi dào</li>
                <li>Chia sẻ và cho đi với tâm hỷ xả</li>
            </ol>

            <h2>Thực hành hàng ngày</h2>
            <p>Mỗi ngày, dành 5-10 phút để thiền định về sự thịnh vượng. Hình dung dòng tiền chảy vào cuộc sống bạn một cách tự nhiên và dễ dàng.</p>

            <p>Khi bạn thay đổi năng lượng bên trong, thế giới bên ngoài sẽ phản chiếu lại sự thay đổi đó!</p>
        `
    },
    {
        id: 8,
        title: "Vượt qua giới hạn tài chính bằng công nghệ dựng lại nỗi đau",
        slug: "vuot-qua-gioi-han-tai-chinh",
        type: "case-study",
        category: "Kết quả học viên",
        author: "Mong Coaching",
        thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&h=600&fit=crop",
        excerpt: "Anh Tuấn đã phá vỡ những rào cản tâm lý về tiền bạc và đạt được mức thu nhập vượt xa mong đợi.",
        createdAt: "28/12/2025",
        content: `
            <p>Tôi lớn lên trong một gia đình khá giả, nhưng sau khi cha tôi phá sản, mọi thứ đổi thay. Tôi mang trong mình nỗi sợ hãi sâu sắc về việc mất tiền.</p>

            <h2>Rào cản vô hình</h2>
            <p>Dù đã có công việc ổn định với thu nhập khá, tôi luôn cảm thấy không đủ. Tôi sợ đầu tư, sợ mạo hiểm, và quan trọng nhất - tôi không tin mình xứng đáng với sự giàu có.</p>

            <blockquote>"Giới hạn lớn nhất của bạn không phải là hoàn cảnh, mà là niềm tin của bạn"</blockquote>

            <h2>Công nghệ Timeline Therapy</h2>
            <p>Trong khóa học của Mali Edu, tôi được trải nghiệm công nghệ Timeline Therapy - một phương pháp giúp "dựng lại" những trải nghiệm đau thương trong quá khứ.</p>

            <p>Thông qua các bài tập, tôi đã:</p>
            <ul>
                <li>Nhận diện nguồn gốc của nỗi sợ</li>
                <li>Tha thứ cho cha và chính mình</li>
                <li>Tái lập chương trình tiềm thức mới</li>
                <li>Xây dựng niềm tin tích cực về tài chính</li>
            </ul>

            <h2>Bước ngoặt</h2>
            <p>Sau khi chữa lành xong, tôi bắt đầu thấy những cơ hội mà trước đây tôi không bao giờ để ý. Tôi quyết định khởi nghiệp, điều mà tôi chưa bao giờ dám nghĩ đến.</p>

            <h2>Kết quả hiện tại</h2>
            <p>Doanh nghiệp của tôi hiện đang phát triển vượt kế hoạch. Thu nhập gấp 5 lần so với khi đi làm. Nhưng quan trọng hơn, tôi đã vượt qua được nỗi sợ hãi ám ảnh suốt nhiều năm.</p>

            <p>Cảm ơn Mali Edu đã giúp tôi tìm ra con người thật sự của mình!</p>
        `
    },
    {
        id: 9,
        title: "Live Q&A: Giải đáp thắc mắc về đầu tư và tiết kiệm",
        slug: "qa-dau-tu-tiet-kiem",
        type: "video",
        category: "Video đào tạo",
        author: "Mong Coaching",
        thumbnailUrl: "https://images.unsplash.com/photo-1560472355-536de3962603?w=800&h=600&fit=crop",
        videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        excerpt: "Buổi trả lời trực tiếp các câu hỏi thường gặp về đầu tư thông minh và phương pháp tiết kiệm hiệu quả.",
        createdAt: "25/12/2025",
        content: `
            <p>Buổi Live Q&A đặc biệt với Mong Coaching - Giải đáp mọi thắc mắc về đầu tư và tiết kiệm.</p>

            <h2>Các chủ đề được đề cập</h2>
            <ul>
                <li>Nên bắt đầu đầu tư từ khi nào?</li>
                <li>Phân bổ tài sản như thế nào?</li>
                <li>Cách tiết kiệm hiệu quả nhất</li>
                <li>Sai lầm thường gặp của người mới</li>
                <li>Chiến lược đầu tư dài hạn</li>
            </ul>

            <p>Xem video để nhận được những lời khuyên quý báu!</p>
        `
    }
];

// Helper function to get post by slug
export const getPostBySlug = (slug) => {
    return SAMPLE_POSTS.find(post => post.slug === slug);
};

// Helper function to get related posts
export const getRelatedPosts = (currentPostId, limit = 3) => {
    return SAMPLE_POSTS
        .filter(post => post.id !== currentPostId)
        .sort(() => Math.random() - 0.5)
        .slice(0, limit);
};
