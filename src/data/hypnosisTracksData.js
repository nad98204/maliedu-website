import { Sparkles, Unlock, Coins, Moon, HeartHandshake, Crown } from 'lucide-react';

export const HYPNOSIS_CATEGORIES = [
    { id: 'all', label: 'Tất cả phân khúc', icon: Sparkles },
    { id: 'free', label: '🎁 Trải nghiệm 0đ', icon: Unlock },
    { id: 'wealth', label: '💰 Hút tài chính', icon: Coins },
    { id: 'sleep', label: '🌙 Ngủ sâu & An yên', icon: Moon },
    { id: 'healing', label: '❤️ Chữa lành nội tâm', icon: HeartHandshake },
    { id: 'vip', label: '👑 Combo Cao Cấp', icon: Crown },
];

export const DEFAULT_HYPNOSIS_EXPERTS = [
    {
        id: 'coach-mong',
        name: 'Master Coach Mong',
        title: 'Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu',
        role: 'Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        bio: 'Nhà sáng lập Mali Edu. Chuyên gia có nhiều năm kinh nghiệm nghiên cứu Thôi miên Trị liệu (Hypnotherapy) và Lập trình Ngôn ngữ Tư duy (NLP), đã giúp đỡ hàng ngàn học viên khơi thông dòng tiền và chữa lành nội tâm.',
        credentials: [
            'Master Practitioner NLP & Hypnotherapy Quốc Tế',
            'Chất giọng trầm ấm, năng lượng định tâm cao',
            'Đồng hành cùng hơn 10.000+ học viên chuyển hóa'
        ]
    },
    {
        id: 'coach-tue-nghi',
        name: 'Coach Tuệ Nghi',
        title: 'Chuyên gia Chữa Lành Tâm Thức & Giấc Ngủ',
        role: 'Chuyên gia Chữa Lành Tâm Thức & Giấc Ngủ',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
        bio: 'Chuyên gia trị liệu tâm lý và thôi miên hồi quy. Giọng đọc thanh thoát, dịu dàng giúp tái tạo năng lượng bình an và đưa cơ thể vào trạng thái thư giãn sâu.',
        credentials: [
            'Chứng chỉ Thôi Miên Trị Liệu Quốc Tế (NGH)',
            'Chuyên gia Âm Thanh Trị Liệu Sóng Não (Sound Healing)',
            'Hơn 5 năm giảng dạy thiền và chữa lành cảm xúc'
        ]
    },
    {
        id: 'master-minh-tam',
        name: 'Master Minh Tâm',
        title: 'Bậc Thầy Kích Hoạt Năng Lượng & Mục Tiêu',
        role: 'Bậc Thầy Kích Hoạt Năng Lượng & Mục Tiêu',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        bio: 'Bậc thầy thôi miên hiệu suất cao và huấn luyện lãnh đạo. Chuyên sâu về cài đặt ám thị bứt phá niềm tin giới hạn, nâng cao bản lĩnh hành động và tự tin xuất chúng.',
        credentials: [
            'Certified NLP Master Coach',
            'Chuyên gia thôi miên ứng dụng kinh doanh & thành công',
            'Diễn giả truyền cảm hứng năng lượng cao'
        ]
    }
];

export const INITIAL_TRACKS = [
    {
        id: 'tm-1',
        title: 'Thôi Miên Cài Đặt Tiềm Thức Hút Tiền Trong Giấc Ngủ',
        benefit: 'Cài đặt niềm tin giàu có vào tầng tiềm thức sâu nhất mỗi đêm khi ngủ',
        category: 'wealth',
        segment: 'Tiền bạc & Thịnh vượng',
        isFree: true,
        duration: '32:15',
        durationSec: 1935,
        listens: 18450,
        author: 'Master Coach Mong',
        authorId: 'coach-mong',
        authorTitle: 'Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        coverImage: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/water/rain_heavy.ogg',
        tags: ['Dòng Tiền', 'Ban Đêm'],
        brainwave: 'Sóng não Theta (5.5Hz) & Tần số Solfeggio 888Hz',
        frequency: '888Hz Tần số kích hoạt may mắn & tài lộc dồi dào',
        recommendedCycle: 'Nghe liên tục 21 đêm trước khi ngủ',
        bestTime: '15 - 30 phút trước khi chìm vào giấc ngủ đêm',
        targetAudience: 'Người kinh doanh, người hay lo lắng về tiền bạc, muốn mở rộng dung lượng tài chính.',
        detailedGuide: `🌟 HƯỚNG DẪN LẮNG NGHE CHUYÊN SÂU TỪ MASTER COACH MONG:

1. Chuẩn bị trường năng lượng trước khi nghe:
- Uống 1 ngụm nước ấm nhỏ trước khi nằm xuống 10 phút.
- Đặt điện thoại ở chế độ "Không làm phiền" (Do Not Disturb) để tránh gián đoạn sóng não.
- Tắt đèn, giữ phòng thoáng đãng, thơm dịu (tinh dầu trầm hoặc oải hương nếu có).

2. Kỹ thuật thở kích hoạt sóng não Theta:
- Nằm ngửa tự nhiên, hai tay thả lỏng buông xuôi dọc cơ thể.
- Hít vào chậm bằng mũi trong 4 giây, cảm nhận bụng phồng lên.
- Giữ nhẹ hơi thở trong 2 giây.
- Thở ra bằng miệng thật êm trong 6 giây, tưởng tượng mọi căng thẳng tài chính đang tan biến. Lặp lại chu kỳ thở này 3-5 lần.

3. Hiện tượng thường gặp khi đi vào thôi miên:
- Cảm giác cơ thể nặng trĩu hoặc bồng bềnh nhẹ tênh: Đây là dấu hiệu cơ bắp hoàn toàn buông lỏng và vỏ não chủ động đang nhường chỗ cho tiềm thức.
- Ngủ quên sau 10-15 phút: Đây là trạng thái hoàn hảo nhất. Tiềm thức không bao giờ ngủ, các câu ám thị thịnh vượng sẽ được cài đặt trực tiếp vào tầng tiềm thức sâu nhất.

4. Ghi chú chuyển hóa từ Chuyên gia:
- Hãy duy trì lắng nghe tối thiểu 21 đêm liên tiếp. Sau khi thức dậy mỗi sáng, hãy giữ trạng thái mỉm cười và cảm nhận lòng biết ơn với mọi điều nhỏ bé trong ngày.`,
        guidePreparation: `1. Chuẩn bị không gian & thiết bị:
- Tắt đèn, giữ phòng ngủ thoáng mát (22 - 25°C), thơm dịu (tinh dầu trầm hoặc oải hương).
- Đeo tai nghe stereo 2 bên để công nghệ sóng não (Binaural Beats) tác động đồng pha vào hai bán cầu não.
- Bật chế độ "Không làm phiền" (Do Not Disturb) trên điện thoại để tránh bị gián đoạn.
- Uống 1 ngụm nước ấm nhỏ trước khi nằm xuống 10 phút để thanh lọc điện giải.

2. Kỹ thuật thở kích hoạt sóng não Theta:
- Nằm ngửa tự nhiên, hai tay buông lỏng dọc thân người.
- Hít vào chậm bằng mũi trong 4 giây, cảm nhận bụng phồng lên.
- Giữ nhẹ hơi thở trong 2 - 4 giây.
- Thở ra bằng miệng thật êm trong 6 - 8 giây, tưởng tượng mọi căng thẳng tài chính đang tan biến.
- Lặp lại chu kỳ thở này 3-5 lần cho đến khi cơ bắp buông lỏng hoàn toàn.`,
        guideRoutine: `1. Khung giờ vàng để đón nhận ám thị:
- 15 - 30 phút trước khi chìm vào giấc ngủ đêm (khi rào cản phân tích của vỏ não hạ xuống, tiềm thức mở toang cửa sổ để tiếp nhận).
- Buổi sáng sớm khi vừa thức dậy (10 phút đầu ngày khi còn mơ màng giữa Alpha và Theta).

2. Lộ trình 21 ngày tái lập trình tiềm thức:
- Tuần 1 (Ngày 1 - 7): Thanh lọc các nỗi sợ vô thức về nợ nần, thiếu thốn và các vết thương tài chính từ quá khứ.
- Tuần 2 (Ngày 8 - 14): Cài đặt 10 niềm tin giàu có của triệu phú vào tầng tiềm thức sâu nhất.
- Tuần 3 (Ngày 15 - 21): Đồng hóa năng lượng, mở rộng dung lượng đón nhận và kích hoạt sự thu hút dòng tiền thực tế.
- Lời dặn: Duy trì liên tục tối thiểu 21 đêm không ngắt quãng.`,
        guidePhenomena: `Các hiện tượng tâm thức thường gặp & Giải thích khoa học:

1. Ngủ quên sau 10 - 15 phút:
- Hoàn toàn tự nhiên và rất tốt! Tiềm thức không bao giờ ngủ, khi ý thức tạm ngủ thì tiềm thức tiếp nhận 100% ám thị mà không bị sự nghi ngờ hay phán xét cản trở.

2. Cơ thể nặng trĩu hoặc bồng bềnh nhẹ tênh:
- Dấu hiệu cơ bắp hoàn toàn buông lỏng và vỏ não chủ động đang nhường chỗ cho tiềm thức (trạng thái Trance thôi miên sâu).

3. Cảm giác tê rần ở trán (luân xa 6):
- Tần số 888Hz và sóng não Theta kích thích các thụ thể thần kinh vỏ não trước trán, khơi thông trực giác về tài chính.

4. Cảm xúc trỗi dậy, thở phào nhẹ nhõm:
- Hiện tượng thanh lọc cảm xúc (Catharsis), những gánh nặng tiền bạc vô thức đang được giải phóng.`,
        guideBonus: `1. Kỹ thuật Neo cảm xúc (NLP Anchoring):
- Khi nghe đến đoạn cảm giác giàu có và biết ơn dâng trào mạnh mẽ, hãy chạm nhẹ đầu ngón cái và ngón trỏ vào nhau giữ 3-5 giây. Ban ngày khi cần tự tin tài chính, chỉ cần bấm 2 ngón tay lại để triệu hồi cảm giác này.

2. Bài tập thực hành buổi sáng:
- Mỗi sáng thức dậy, dành 3 phút viết ra 3 điều biết ơn về dòng tiền và đọc to: "Tôi biết ơn vì tiền bạc đang chảy vào cuộc đời tôi từ nhiều nguồn bất ngờ và hạnh phúc."

3. Lời nhắn từ Master Coach Mong:
- "Hãy kiên trì như người gieo hạt giống. Đừng đào hạt lên xem mỗi ngày, hãy tưới tẩm bằng niềm tin và cảm xúc tích cực mỗi đêm!"`,
        effects: [
            'Cài đặt 10 tư duy thịnh vượng của triệu phú vào tầng tiềm thức sâu nhất mỗi đêm khi ngủ.',
            'Xóa bỏ nỗi sợ vô thức về nợ nần, thiếu thốn và rào cản tài chính từ quá khứ.',
            'Đưa hệ thần kinh từ căng thẳng (Beta) sang thư giãn sâu (Theta), giúp ngủ ngon không mộng mị.',
            'Kích hoạt tần số rung động đón nhận dòng tiền bất ngờ và thu hút cơ hội mới vào ban ngày.'
        ],
        howToUse: [
            { step: 'Bước 1: Đeo tai nghe stereo', desc: 'Đeo tai nghe 2 bên để công nghệ sóng não (Binaural Beats) tác động đồng pha vào hai bán cầu não.' },
            { step: 'Bước 2: Nằm thả lỏng trên giường', desc: 'Chọn tư thế nằm thoải mái nhất, ánh sáng dịu hoặc tắt đèn, hít sâu thở chậm 3 nhịp.' },
            { step: 'Bước 3: Để tâm trí trôi theo giọng dẫn', desc: 'Không cần cố gắng phân tích câu từ. Hãy buông lỏng toàn thân để giọng dẫn của Coach Mong đưa bạn vào giấc ngủ.' },
            { step: 'Bước 4: Chu kỳ 21 đêm', desc: 'Duy trì nghe đều đặn 21 đêm liên tiếp để các rãnh tư duy mới được củng cố bền vững.' }
        ],
        precautions: [
            '⚠️ TUYỆT ĐỐI KHÔNG nghe khi đang lái xe hoặc vận hành máy móc thiết bị nguy hiểm.',
            'Nếu bạn ngủ quên trong lúc nghe: Đây là hiện tượng hoàn toàn tự nhiên và rất tốt, tiềm thức vẫn hấp thu 100% ám thị.',
            'Chỉnh âm lượng vừa phải (40% - 60%), không nghe quá to.'
        ]
    },
    {
        id: 'tm-2',
        title: 'Sóng Não Delta - Ru Ngủ Sâu & Tái Tạo Tế Bào',
        benefit: 'Kích hoạt trạng thái thư giãn tuyệt đối, xua tan căng thẳng và ngủ ngon giấc',
        category: 'sleep',
        segment: 'Giấc ngủ & Thư giãn',
        isFree: true,
        duration: '45:00',
        durationSec: 2700,
        listens: 24800,
        author: 'Coach Tuệ Nghi',
        authorId: 'coach-tue-nghi',
        authorTitle: 'Chuyên gia Chữa Lành Tâm Thức & Giấc Ngủ',
        authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
        coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/water/river_stream.ogg',
        tags: ['Giấc Ngủ', 'Sóng Não Delta'],
        brainwave: 'Sóng não Delta (1.5 - 3Hz) & Tần số Solfeggio 528Hz',
        frequency: '528Hz Tần số tái tạo DNA & phục hồi năng lượng',
        recommendedCycle: 'Nghe mỗi tối trước khi ngủ',
        bestTime: 'Ngay khi nằm lên giường chuẩn bị ngủ',
        targetAudience: 'Người bị mất ngủ, ngủ không sâu giấc, hay thức giấc nửa đêm hoặc mệt mỏi sau ngày dài.',
        detailedGuide: `🌙 HƯỚNG DẪN PHỤC HỒI & RU NGỦ CHUYÊN SÂU TỪ COACH TUỆ NGHI:

1. Nguyên lý tác động của Sóng Não Delta & Tần số 528Hz:
- Bản thu kết hợp công nghệ âm thanh 2 tai (Binaural Beats) ở tần số Delta (1.5 - 3Hz) cùng tần số Solfeggio 528Hz - tần số tái tạo năng lượng sinh học và chữa lành tế bào.
- Não bộ sẽ được dẫn dắt tự nhiên từ nhịp Beta (lo âu, suy nghĩ) chuyển dần sang Alpha (thư giãn) và chìm hẳn vào Delta (ngủ sâu, phục hồi).

2. Tư thế & Cách đặt thiết bị tối ưu:
- Nếu đeo tai nghe: Sử dụng tai nghe chụp êm hoặc tai nghe nhét vừa vặn, mức âm lượng 30% - 40% (chỉ cần vừa nghe thấy giọng thì thầm).
- Nếu dùng loa ngoài: Đặt điện thoại cách đầu giường khoảng 1 - 1.5 mét, mức âm lượng vừa phải đủ lấp đầy không gian phòng ngủ.

3. Quy trình 3 bước buông xả trước khi ngủ:
- Bước 1: Khép hờ mắt, buông lỏng hoàn toàn cơ mặt, vầng trán và khóe mắt.
- Bước 2: Thả lỏng bờ vai và các ngón tay. Mỗi lần thở ra, cảm nhận cơ thể đang lún sâu xuống chiếc nệm êm ái.
- Bước 3: Đừng cố gắng phân tích lời nói hay giai điệu. Hãy để giọng dẫn đưa bạn xuôi theo dòng chảy bình an của vũ trụ.

4. Lưu ý cho người khó ngủ kinh niên:
- Hãy kiên trì nghe liên tục trong 7-14 ngày để đồng hồ sinh học được tái lập trình. Bạn sẽ thức dậy với cảm giác đầu óc trong trẻo, cơ thể nhẹ nhàng và tràn đầy năng lượng tươi mới.`,
        guidePreparation: `1. Chuẩn bị không gian phòng ngủ:
- Giữ phòng tối hoàn toàn hoặc dùng bịt mắt ngủ mềm mại, hạ nhiệt độ phòng mát mẻ.
- Tắt thông báo điện thoại, đặt mức âm lượng tai nghe 30% - 40% (chỉ cần nghe thì thầm êm ái).
- Tránh tiếp xúc màn hình xanh (điện thoại, laptop) trước khi nghe ít nhất 15 phút.

2. Kỹ thuật thở 4-7-8 kích hoạt sóng não Delta:
- Đặt đầu lưỡi chạm nhẹ sau răng cửa trên.
- Hít sâu bằng mũi trong 4 giây.
- Giữ hơi thở tĩnh lặng trong 7 giây.
- Thở ra thật chậm bằng miệng trong 8 giây tạo tiếng xì êm dịu.
- Lặp lại 4 chu kỳ thở để kích hoạt hệ thần kinh phó giao cảm, đưa cơ thể chìm vào giấc ngủ tự nhiên.`,
        guideRoutine: `1. Khung giờ vàng:
- Ngay khi nằm lên giường chuẩn bị ngủ (22:00 - 23:30 là khung giờ lý tưởng nhất của gan và túi mật thải độc).

2. Lộ trình thực hành phục hồi giấc ngủ:
- Ngày 1 - 3: Giúp não bộ cắt đứt thói quen suy nghĩ miên man khi nằm xuống giường.
- Ngày 4 - 7: Nhịp sinh học được ổn định, thời gian chìm vào giấc ngủ rút ngắn xuống dưới 15 phút.
- Ngày 8 - 21: Phục hồi chu kỳ giấc ngủ sâu (Deep Sleep & REM), tế bào và hệ miễn dịch được tái tạo toàn diện mỗi đêm.`,
        guidePhenomena: `Các hiện tượng thường gặp & Giải đáp khoa học:

1. Ngủ quên sau 5 - 10 phút:
- Hoàn toàn bình thường! Sóng Delta có tác dụng ru ngủ cực mạnh. Bạn không cần phải cố gắng nghe hết bài, việc ngủ thiếp đi chứng tỏ sóng não đã đồng bộ thành công.

2. Giấc mơ sống động hơn hoặc mơ thấy điều kỳ lạ:
- Khi sóng não Delta được kích hoạt sâu, tiềm thức đang dọn dẹp các mớ hỗn độn thông tin ban ngày (hiện tượng xả rác tâm trí). Sau vài đêm, giấc ngủ sẽ hoàn toàn êm đềm không mộng mị.

3. Thức dậy sớm hơn bình thường nhưng không thấy mệt:
- Chất lượng giấc ngủ sâu tăng lên giúp cơ thể phục hồi nhanh gấp 2 lần, bạn thức dậy với tinh thần sảng khoái và tỉnh táo.`,
        guideBonus: `1. Bài tập buông xả trước khi ngủ:
- Hãy nói thầm với chính mình: "Ngày hôm nay đã trọn vẹn. Tôi buông bỏ mọi việc và trao cơ thể cho giấc ngủ chữa lành."

2. Lời dặn từ Coach Tuệ Nghi:
- "Đừng ép mình phải ngủ ngay lập tức. Hãy tận hưởng từng âm thanh êm dịu và để cơ thể tự khắc trôi vào trạng thái ngủ say ngọt ngào nhất."`,
        effects: [
            'Cắt đứt ngay lập tức những suy nghĩ miên man và âu lo dồn ứ sau ngày dài làm việc.',
            'Kích thích cơ thể sản sinh Melatonin tự nhiên, giúp chìm vào giấc ngủ êm ái sau 10-15 phút.',
            'Kích hoạt cơ chế tự chữa lành của các tế bào và hệ miễn dịch ở tầng sóng Delta sâu.',
            'Thức dậy buổi sáng với tâm trạng nhẹ nhõm, sảng khoái và tràn đầy sinh lực.'
        ],
        howToUse: [
            { step: 'Bước 1: Chuẩn bị phòng ngủ', desc: 'Tắt đèn, giữ phòng thoáng mát, ngắt chuông thông báo điện thoại.' },
            { step: 'Bước 2: Đeo tai nghe hoặc mở loa ngoài vừa phải', desc: 'Đeo tai nghe mềm hoặc để loa đầu giường ở mức âm lượng 35% - 50%.' },
            { step: 'Bước 3: Buông lỏng toàn bộ cơ bắp', desc: 'Thả lỏng từ vầng trán, cơ mặt, bờ vai xuống đến các ngón chân.' },
            { step: 'Bước 4: Để tâm trí trôi vào giấc ngủ', desc: 'Không cần cố gắng thức để nghe hết bài, hãy để âm thanh tự động đưa bạn vào giấc ngủ sâu.' }
        ],
        precautions: [
            '⚠️ CẤM TUYỆT ĐỐI nghe khi đang lái xe hoặc làm việc cần tỉnh táo.',
            'Nếu không muốn đeo tai nghe suốt đêm, bạn có thể bật loa ngoài ở mức nhỏ vừa nghe.'
        ]
    },
    {
        id: 'tm-3',
        title: 'Ám Thị 21 Ngày Khơi Thông Tắc Nghẽn Năng Lượng Tiền',
        benefit: 'Tháo gỡ toàn bộ ký ức tiêu cực và nỗi sợ về tiền từ quá khứ',
        category: 'wealth',
        segment: 'Trị liệu chuyên sâu',
        isFree: false,
        price: '199.000đ',
        duration: '38:40',
        durationSec: 2320,
        listens: 9620,
        author: 'Master Coach Mong',
        coverImage: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: '', // Paid samples require a real protected upload before publication.
        tags: ['Cao Cấp', 'Khơi Thông'],
        brainwave: 'Sóng não Theta (5Hz) & Tần số Solfeggio 432Hz',
        frequency: '432Hz Hòa hợp rung động tự nhiên & Vũ trụ',
        recommendedCycle: '21 ngày liên tục vào sáng sớm hoặc tối',
        bestTime: 'Sáng sớm khi mới thức dậy hoặc tối trước khi ngủ',
        targetAudience: 'Người gặp bế tắc doanh thu, nỗ lực nhiều nhưng tiền vào rồi lại ra, có ký ức sợ thiếu tiền.',
        detailedGuide: `💎 HƯỚNG DẪN KHƠI THÔNG DÒNG TIỀN CHUYÊN SÂU TỪ MASTER COACH MONG:

1. Lộ trình 21 ngày chuyển hóa tiềm thức tài chính:
- Giai đoạn 1 (Ngày 1 - 7): Thanh lọc các ký ức tiêu cực, vết thương tài chính và cảm giác sợ hãi thiếu thốn từ quá khứ.
- Giai đoạn 2 (Ngày 8 - 14): Tái cấu trúc tư duy, cài đặt niềm tin xứng đáng đón nhận sự thịnh vượng dồi dào.
- Giai đoạn 3 (Ngày 15 - 21): Đồng pha tần số rung động với trường năng lượng tiền bạc, kích hoạt sự thu hút may mắn tự nhiên.

2. Thời điểm lắng nghe hiệu quả nhất:
- Buổi sáng: Ngay khi vừa thức dậy, khi tâm trí còn trong trạng thái mơ màng (nửa tỉnh nửa mê).
- Buổi tối: 15-20 phút trước khi chìm vào giấc ngủ.

3. Bài tập thực hành song hành (Tăng hiệu quả x3 lần):
- Mỗi sáng sau khi nghe, hãy mở sổ tay và viết xuống: "Tôi biết ơn vì tiền bạc đang chảy vào cuộc đời tôi từ nhiều nguồn bất ngờ và hạnh phúc."
- Khi chi tiêu bất kỳ khoản tiền nào, hãy gửi gắm lời chúc phúc đến người nhận tiền và tin tưởng dòng tiền sẽ quay trở lại gấp nhiều lần.`,
        guidePreparation: `1. Chuẩn bị trường năng lượng thịnh vượng:
- Đeo tai nghe stereo chất lượng cao để cảm nhận trường sóng Solfeggio 432Hz cộng hưởng tự nhiên.
- Chuẩn bị một cốc nước ấm, một cuốn sổ tay nhỏ và một cây bút bên cạnh giường.
- Tắt mọi thông báo, giữ tâm thái háo hức và biết ơn như một đứa trẻ chuẩn bị nhận quà.

2. Kỹ thuật thở khai mở luân xa tim & đón nhận:
- Đặt bàn tay phải lên ngực trái (trái tim), bàn tay trái ngửa ra tự nhiên trên đùi hoặc nệm.
- Hít sâu vào trong 4 giây, hình dung luồng ánh sáng vàng kim đang tràn ngập lồng ngực.
- Giữ hơi thở trong 3 giây và nói thầm: "Tôi xứng đáng với sự giàu có dồi dào".
- Thở ra chậm trong 6 giây, buông bỏ mọi nỗi sợ thiếu thốn. Lặp lại 3 lần.`,
        guideRoutine: `1. Khung giờ vàng:
- Sáng sớm (khi vừa mở mắt): Lúc này tiềm thức chưa bị các âu lo thực tế chen vào, bài thôi miên sẽ cài đặt tần số đón nhận tài lộc cho toàn bộ ngày làm việc.
- Tối trước khi ngủ: Củng cố niềm tin thịnh vượng trong suốt giấc ngủ đêm.

2. Lộ trình 21 ngày:
- Tuần 1: Nhận diện và gột rửa các vết thương tiền bạc quá khứ (ký ức nợ nần, cãi vã vì tiền).
- Tuần 2: Chuyển đổi từ tâm thức "chật vật tranh giành" sang tâm thức "dòng tiền tự do tuôn chảy".
- Tuần 3: Kích hoạt luật hấp dẫn, đón nhận các cơ hội kinh doanh, quý nhân và dòng tiền bất ngờ.`,
        guidePhenomena: `Các hiện tượng chuyển hóa tâm thức:

1. Thấy nhẹ nhõm, không còn cảm giác thắt nghẹn ở ngực khi nghĩ về các khoản chi:
- Dấu hiệu luân xa tim và các rào cản sợ hãi đã được giải phóng.

2. Xuất hiện những ý tưởng kinh doanh mới bất chợt trong ngày:
- Sóng Theta kích thích trực giác kinh doanh và sự kết nối giữa các vùng não sáng tạo.

3. Dòng tiền nhỏ bắt đầu quay trở lại (được tặng quà, khách hàng cũ mua lại):
- Sự phản hồi của vũ trụ khi tần số rung động bên trong bạn đã thay đổi sang trạng thái dư dả.`,
        guideBonus: `1. Bài tập chuyển hóa dòng tiền ra vào:
- Mỗi khi thanh toán hóa đơn hoặc chuyển tiền, hãy mỉm cười và thầm chúc phúc: "Số tiền này đi để làm giàu cho xã hội và sẽ quay về với tôi gấp mười lần."

2. Lời dặn từ Master Coach Mong:
- "Tiền bạc là một dạng năng lượng yêu thương. Khi bên trong bạn tràn đầy sự trân trọng và không còn sợ hãi, dòng tiền sẽ tự khắc tìm đến bạn một cách tự nhiên nhất."`,
        effects: [
            'Tháo gỡ các tắc nghẽn vô thức và niềm tin sai lệch về tiền bạc từ thời thơ ấu.',
            'Chuyển đổi tâm thức từ "chật vật kiếm tiền" sang "đón nhận dòng tiền hạnh phúc".',
            'Khai thông lòng biết ơn và sự trân trọng đối với mọi dòng tiền vào và ra.',
            'Mở rộng dung lượng đón nhận tài chính, tự tin đón nhận các khoản thu nhập lớn hơn.'
        ]
    },
    {
        id: 'tm-4',
        title: 'Thôi Miên Chữa Lành Đứa Trẻ Bên Trong & An Yên',
        benefit: 'Ôm ấp và hòa giải với đứa trẻ bên trong để giải tỏa nỗi đau quá khứ',
        category: 'healing',
        segment: 'Chữa lành cảm xúc',
        isFree: true,
        duration: '28:10',
        durationSec: 1690,
        listens: 15300,
        author: 'Coach Tuệ Nghi',
        authorId: 'coach-tue-nghi',
        authorTitle: 'Chuyên gia Chữa Lành Tâm Thức & Giấc Ngủ',
        authorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
        coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg',
        tags: ['Chữa Lành', 'Bình An'],
        brainwave: 'Sóng não Alpha - Theta & Tần số 528Hz Yêu Thương',
        frequency: '528Hz Tần số hòa giải cảm xúc & yêu thương bản thể',
        effects: [
            'Kết nối, ôm ấp và hòa giải với đứa trẻ tổn thương bên trong bạn.',
            'Chữa lành cảm giác bị bỏ rơi, sợ bị từ chối hoặc cảm giác "mình không xứng đáng".',
            'Giải phóng những cảm xúc tiêu cực, tủi hờn và giận dữ bị đè nén nhiều năm.',
            'Khôi phục cảm giác bình an tự thân và tình yêu thương vô điều kiện với chính mình.'
        ]
    },
    {
        id: 'tm-5',
        title: 'Bản Thôi Miên Bậc Thầy: Bứt Phá Mục Tiêu & Tự Tin',
        benefit: 'Kích hoạt sự quyết đoán và năng lượng bản thể lãnh đạo hành động',
        category: 'wealth',
        segment: 'Hiệu suất cao',
        isFree: false,
        price: '299.000đ',
        originalPrice: '599.000đ',
        duration: '52:00',
        durationSec: 3120,
        listens: 11400,
        author: 'Master Minh Tâm',
        authorId: 'master-minh-tam',
        authorTitle: 'Bậc Thầy Kích Hoạt Năng Lượng & Mục Tiêu',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: '', // Paid samples require a real protected upload before publication.
        tags: ['Mục Tiêu', 'Tự Tin'],
        brainwave: 'Sóng não Alpha (10Hz) & Tần số 417Hz Xóa bỏ rào cản',
        frequency: '417Hz Hóa giải trở ngại & kích hoạt nội lực',
        effects: [
            'Kích hoạt sự quyết đoán và dũng khí hành động mạnh mẽ, chấm dứt thói quen trì hoãn.',
            'Củng cố niềm tin tuyệt đối vào năng lực bản thân và mục tiêu đã đặt ra.',
            'Gia tăng sự tập trung đỉnh cao và khả năng chịu áp lực khi giải quyết mục tiêu lớn.',
            'Định hình phong thái tự tin, bản lĩnh và thần thái của một nhà lãnh đạo.'
        ]
    },
    {
        id: 'tm-6',
        title: 'Thôi Miên Buổi Sáng - Đón Nhận May Mắn & Phép Màu',
        benefit: '15 phút kích hoạt trường năng lượng cao thu hút quý nhân và cơ hội',
        category: 'healing',
        segment: 'Khởi đầu ngày mới',
        isFree: true,
        duration: '16:20',
        durationSec: 980,
        listens: 21900,
        author: 'Master Minh Tâm',
        authorId: 'master-minh-tam',
        authorTitle: 'Bậc Thầy Kích Hoạt Năng Lượng & Mục Tiêu',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
        coverImage: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: 'https://actions.google.com/sounds/v1/weather/thunderstorm.ogg',
        tags: ['Buổi Sáng', 'Năng Lượng'],
        brainwave: 'Sóng não Alpha (10Hz) & Tần số 639Hz Gắn kết & Phép màu',
        frequency: '639Hz Thu hút cơ duyên & sự hòa hợp quý nhân',
        effects: [
            'Kích hoạt trường năng lượng đỉnh cao và tâm trạng hào hứng ngay trong 15 phút đầu ngày.',
            'Cài đặt tâm thế biết ơn và sẵn sàng đón nhận những điều kỳ diệu.',
            'Thu hút các cơ duyên may mắn, thuận lợi và quý nhân hỗ trợ trong công việc.',
            'Giữ vững năng lượng tích cực xuyên suốt cả ngày dài làm việc.'
        ]
    },
    {
        id: 'tm-7',
        title: 'Combo 21 Ngày Tái Lập Trình Tiềm Thức Toàn Diện',
        benefit: 'Trọn bộ 5 bài thôi miên Sáng - Tối - Đêm trị liệu chuyên sâu có lộ trình',
        category: 'vip',
        segment: 'Trọn gói chuyển hóa',
        isFree: false,
        price: '499.000đ',
        originalPrice: '990.000đ',
        duration: '180:00 (5 bài)',
        durationSec: 10800,
        listens: 8350,
        author: 'Master Coach Mong',
        authorId: 'coach-mong',
        authorTitle: 'Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80',
        coverImageSquare: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&h=600&q=80',
        coverImageBanner: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&h=675&q=80',
        audioUrl: '', // Paid samples require a real protected upload before publication.
        tags: ['Combo VIP', '21 Ngày', 'Trọn Gói'],
        brainwave: 'Hệ thống đa tầng sóng: Alpha - Theta - Delta chuẩn hóa',
        frequency: 'Chuỗi tần số Solfeggio 432Hz - 528Hz - 888Hz',
        effects: [
            'Trọn bộ 5 bài thôi miên Sáng - Trưa - Tối - Đêm khép kín lộ trình 21 ngày.',
            'Tái cấu trúc toàn diện từ Tâm thức Tiền bạc, Giấc ngủ sâu đến Chữa lành nội tâm.',
            'Được thiết kế theo chuỗi liên hoàn giúp củng cố liên kết thần kinh nhanh gấp 3 lần.',
            'Tặng kèm bản hướng dẫn chi tiết theo dõi thói quen và sổ tay cảm xúc 21 ngày.'
        ]
    },
];

export const getTrackDetails = (track, allTracks = []) => {
    if (!track) return null;

    let defaultBrainwave = 'Sóng não Theta (4 - 7Hz) & Tần số 432Hz';
    let defaultFrequency = '432Hz Harmonic Solfeggio';
    let defaultRecommendedCycle = 'Nghe liên tục 21 - 30 ngày';
    let defaultBestTime = '15 - 30 phút trước khi ngủ tối hoặc sáng sớm khi vừa thức dậy';
    let defaultTargetAudience = 'Người muốn tái lập trình tư duy, giải tỏa áp lực và thu hút nguồn năng lượng thịnh vượng.';

    if (track.category === 'sleep') {
        defaultBrainwave = 'Sóng não Delta (0.5 - 3.5Hz) ru ngủ sâu';
        defaultFrequency = '528Hz Solfeggio Tái tạo tế bào & Thư giãn thần kinh';
        defaultBestTime = 'Nằm trên giường ngay trước khi chìm vào giấc ngủ';
        defaultTargetAudience = 'Người bị mất ngủ, ngủ chập chờn, hay thức giấc nửa đêm hoặc mệt mỏi sau ngày dài căng thẳng.';
    } else if (track.category === 'wealth') {
        defaultBrainwave = 'Sóng não Theta (5 - 7Hz) ám thị thịnh vượng';
        defaultFrequency = '888Hz Tần số hút cơ hội & dòng tiền dồi dào';
        defaultBestTime = 'Buổi tối khi chuẩn bị ngủ hoặc sáng sớm khi bắt đầu ngày mới';
        defaultTargetAudience = 'Người kinh doanh, người có nỗi sợ tài chính, cảm giác bế tắc dòng tiền hoặc muốn mở rộng dung lượng đón nhận.';
    } else if (track.category === 'healing') {
        defaultBrainwave = 'Sóng não Alpha - Theta hòa hợp cảm xúc';
        defaultFrequency = '528Hz Tần số tình yêu thương & chữa lành';
        defaultBestTime = 'Bất cứ khi nào bạn thấy bất an, căng thẳng hoặc trước giờ ngủ';
        defaultTargetAudience = 'Người mang tổn thương quá khứ, stress, nhiều cảm xúc tiêu cực hoặc tự ti về bản thân.';
    } else if (track.category === 'vip') {
        defaultBrainwave = 'Hệ thống đa tầng sóng não (Alpha - Theta - Delta)';
        defaultFrequency = 'Chuỗi tần số Solfeggio 432Hz - 528Hz - 888Hz';
        defaultBestTime = 'Lộ trình khép kín: Sáng tỉnh thức - Chiều định tâm - Đêm ngủ sâu';
        defaultTargetAudience = 'Học viên muốn chuyển hóa toàn diện Tâm - Thân - Trí với lộ trình bài bản chuyên sâu.';
    }

    const defaultEffects = Array.isArray(track.effects) && track.effects.length > 0 ? track.effects : [
        track.benefit || 'Cài đặt ám thị tích cực vào tầng tiềm thức sâu nhất.',
        'Hạ thấp sóng não từ Beta (căng thẳng) về trạng thái Theta/Delta an yên, thư giãn sâu.',
        'Tháo gỡ những niềm tin giới hạn, sợ hãi và năng lượng tiêu cực tích tụ lâu ngày.',
        'Kích hoạt trường năng lượng tích cực, thu hút cơ hội và sự bình an trong tâm hồn.'
    ];

    const defaultHowToUse = Array.isArray(track.howToUse) && track.howToUse.length > 0 ? track.howToUse : [
        {
            step: 'Bước 1: Đeo tai nghe stereo',
            desc: 'Khuyến nghị dùng tai nghe chất lượng tốt (chụp tai hoặc in-ear) để cảm nhận trọn vẹn dải sóng âm thanh 2 tai (Binaural Beats).'
        },
        {
            step: 'Bước 2: Không gian tĩnh lặng',
            desc: 'Chọn góc yên tĩnh, ánh sáng dịu hoặc tắt đèn, nằm hoặc ngồi ở tư thế thoải mái nhất, thả lỏng toàn bộ cơ bắp.'
        },
        {
            step: 'Bước 3: Điều chỉnh âm lượng vừa phải',
            desc: 'Để âm lượng ở mức 40% - 60%, không nghe quá to để thính giác và não bộ hoàn toàn thư thái.'
        },
        {
            step: 'Bước 4: Thả lỏng và để tiềm thức đón nhận',
            desc: 'Nhắm mắt, hít sâu thở chậm. Bạn không cần cố gắng phân tích câu từ, chỉ cần để giọng dẫn đưa tâm trí trôi vào giấc ngủ hoặc trạng thái tĩnh lặng.'
        },
        {
            step: 'Bước 5: Chu kỳ 21 ngày liên tục',
            desc: 'Não bộ cần ít nhất 21 ngày để hình thành liên kết thần kinh mới. Hãy duy trì đều đặn mỗi ngày để nhận kết quả rõ rệt nhất.'
        }
    ];

    const defaultPrecautions = Array.isArray(track.precautions) && track.precautions.length > 0 ? track.precautions : [
        '⚠️ TUYỆT ĐỐI KHÔNG nghe khi đang lái xe hoặc vận hành máy móc thiết bị nguy hiểm (vì giọng dẫn và sóng não sẽ gây buồn ngủ, đưa cơ thể vào trạng thái thư giãn sâu).',
        'Không nghe khi đang làm những công việc đòi hỏi sự tỉnh táo và tập trung cao độ.',
        'Nếu bạn ngủ thiếp đi trong lúc nghe: Đây là điều hoàn toàn bình thường và rất tốt, tiềm thức của bạn vẫn đang lắng nghe và hấp thu trọn vẹn thông điệp.',
        'Không nên gượng ép: Nếu tâm trí có suy nghĩ lan man, chỉ cần nhẹ nhàng kéo sự chú ý trở lại hơi thở và giọng dẫn.'
    ];

    // Khớp chuyên gia từ danh sách hoặc từ dữ liệu track
    const matchedExpert = DEFAULT_HYPNOSIS_EXPERTS.find(
        exp => exp.id === track.authorId || exp.name.toLowerCase() === String(track.author || '').trim().toLowerCase()
    );

    const authorInfo = track.authorInfo || {
        name: track.author || matchedExpert?.name || 'Master Coach Mong',
        title: track.authorTitle || matchedExpert?.title || 'Chuyên gia Trị liệu Tiềm thức',
        role: track.authorTitle || track.authorRole || matchedExpert?.role || 'Chuyên gia Trị liệu Tiềm thức & Sáng lập Mali Edu',
        bio: track.authorBio || matchedExpert?.bio || 'Chuyên gia có nhiều năm kinh nghiệm nghiên cứu Thôi miên Trị liệu (Hypnotherapy) và Lập trình Ngôn ngữ Tư duy (NLP), đã giúp đỡ hàng ngàn học viên khơi thông dòng tiền và chữa lành nội tâm.',
        avatar: track.authorAvatar || matchedExpert?.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
        credentials: (Array.isArray(track.authorCredentials) && track.authorCredentials.length > 0)
            ? track.authorCredentials
            : (matchedExpert?.credentials || [
                'Master Practitioner NLP & Hypnotherapy Quốc Tế',
                'Chất giọng trầm ấm, năng lượng định tâm cao',
                'Đồng hành cùng hơn 10.000+ học viên chuyển hóa'
            ])
    };

    const relatedTracks = allTracks
        .filter(t => t.id !== track.id && (t.category === track.category || t.isFree))
        .slice(0, 3);

    // Default In-Depth Guides for Purchased tab (Chuyên sâu)
    const defaultGuidePreparation = track.guidePreparation || (
        track.category === 'sleep'
            ? `1. Chuẩn bị không gian phòng ngủ:
- Giữ phòng tối hoàn toàn hoặc dùng bịt mắt ngủ mềm mại, hạ nhiệt độ phòng mát mẻ (22 - 25°C).
- Tắt thông báo điện thoại, đặt mức âm lượng tai nghe 30% - 40% (chỉ cần nghe thì thầm êm ái).
- Tránh tiếp xúc màn hình xanh (điện thoại, laptop) trước khi nghe ít nhất 15 phút.

2. Kỹ thuật thở 4-7-8 kích hoạt sóng não Delta:
- Đặt đầu lưỡi chạm nhẹ sau răng cửa trên.
- Hít sâu bằng mũi trong 4 giây.
- Giữ hơi thở tĩnh lặng trong 7 giây.
- Thở ra thật chậm bằng miệng trong 8 giây tạo tiếng xì êm dịu.
- Lặp lại 4 chu kỳ thở để kích hoạt hệ thần kinh phó giao cảm, đưa cơ thể chìm vào giấc ngủ tự nhiên.`
            : `1. Chuẩn bị không gian & thiết bị:
- Tắt đèn, giữ phòng ngủ thoáng mát (22 - 25°C), thơm dịu (tinh dầu trầm hoặc oải hương nếu có).
- Đeo tai nghe stereo 2 bên để công nghệ sóng não (Binaural Beats) tác động đồng pha vào hai bán cầu não.
- Bật chế độ "Không làm phiền" (Do Not Disturb) trên điện thoại để tránh bị gián đoạn.
- Uống 1 ngụm nước ấm nhỏ trước khi nằm xuống 10 phút để thanh lọc điện giải.

2. Kỹ thuật thở kích hoạt sóng não Theta:
- Nằm ngửa tự nhiên, hai tay buông lỏng dọc thân người.
- Hít vào chậm bằng mũi trong 4 giây, cảm nhận bụng phồng lên.
- Giữ nhẹ hơi thở trong 2 - 4 giây.
- Thở ra bằng miệng thật êm trong 6 - 8 giây, giải tỏa toàn bộ căng thẳng ra khỏi các lỗ chân lông.
- Lặp lại chu kỳ thở này 3-5 lần cho đến khi toàn thân lún sâu vào sự tĩnh lặng.`
    );

    const defaultGuideRoutine = track.guideRoutine || `1. Khung giờ vàng để đón nhận ám thị:
- 15 - 30 phút trước khi chìm vào giấc ngủ đêm (khi rào cản phân tích của vỏ não hạ xuống, tiềm thức mở toang cửa sổ để tiếp nhận).
- Hoặc buổi sáng sớm khi vừa thức dậy (10 phút đầu ngày khi sóng não còn dao động giữa Alpha và Theta).

2. Lộ trình 21 ngày tái lập trình tiềm thức:
- Tuần 1 (Ngày 1 - 7): Thanh lọc căng thẳng và các phản xạ sợ hãi tiêu cực tích tụ lâu ngày.
- Tuần 2 (Ngày 8 - 14): Cài đặt rãnh tư duy mới và những niềm tin tích cực vào tầng tiềm thức sâu nhất.
- Tuần 3 (Ngày 15 - 21): Đồng hóa năng lượng, củng cố mạng neuron mới và kích hoạt sự thu hút thực tế.
- Lời dặn: Hãy kiên trì duy trì liên tục tối thiểu 21 ngày không ngắt quãng để tạo rãnh neuron thần kinh bền vững.`;

    const defaultGuidePhenomena = track.guidePhenomena || `Các hiện tượng tâm thức thường gặp & Giải thích khoa học:

1. Ngủ quên sau 10 - 15 phút:
- Hoàn toàn tự nhiên và rất tốt! Tiềm thức không bao giờ ngủ, khi ý thức tạm ngủ thì tiềm thức tiếp nhận 100% ám thị mà không bị sự nghi ngờ hay phán xét cản trở.

2. Cơ thể nặng trĩu hoặc bồng bềnh nhẹ tênh:
- Dấu hiệu cơ bắp hoàn toàn buông lỏng và vỏ não chủ động đang nhường chỗ cho tiềm thức (trạng thái Trance thôi miên sâu).

3. Cảm giác tê rần ở trán (luân xa 6) hoặc đỉnh đầu:
- Tần số âm thanh và sóng não kích thích tuần hoàn máu và thụ thể thần kinh tại vỏ não trước trán, khơi thông trực giác và cảm giác bình an.

4. Cảm xúc trỗi dậy, thở phào nhẹ nhõm:
- Hiện tượng thanh lọc cảm xúc (Catharsis), những u uất hoặc tắc nghẽn vô thức dồn nén từ lâu đang được giải phóng êm ái.`;

    const defaultGuideBonus = track.guideBonus || `1. Kỹ thuật Neo cảm xúc (NLP Anchoring):
- Khi nghe đến đoạn cảm xúc tích cực dâng trào mạnh mẽ, hãy chạm nhẹ đầu ngón cái và ngón trỏ vào nhau giữ trong 3 - 5 giây. Ban ngày khi cần định tâm, chỉ cần bấm 2 ngón tay lại để kích hoạt trạng thái bình an, tự tin.

2. Bài tập thực hành buổi sáng (3 phút):
- Ngay sau khi thức dậy, hãy dành 3 phút viết ra 3 điều biết ơn và 3 câu khẳng định tương ứng với mục tiêu của bạn.

3. Lời dặn từ Master Coach:
- "Hãy kiên trì gieo hạt giống tốt vào tiềm thức mỗi đêm. Hãy tin tưởng vào trí tuệ bên trong bạn và để chuyển hóa diễn ra một cách tự nhiên nhất."`;

    return {
        ...track,
        brainwave: track.brainwave || defaultBrainwave,
        frequency: track.frequency || defaultFrequency,
        recommendedCycle: track.recommendedCycle || defaultRecommendedCycle,
        bestTime: track.bestTime || defaultBestTime,
        targetAudience: track.targetAudience || defaultTargetAudience,
        audioQuality: track.audioQuality || '320kbps Studio Lossless (Không nén)',
        effects: defaultEffects,
        howToUse: defaultHowToUse,
        precautions: defaultPrecautions,
        guidePreparation: defaultGuidePreparation,
        guideRoutine: defaultGuideRoutine,
        guidePhenomena: defaultGuidePhenomena,
        guideBonus: defaultGuideBonus,
        detailedGuide: track.detailedGuide || '',
        coverImageSquare: track.coverImageSquare || track.coverImage,
        coverImageBanner: track.coverImageBanner || track.coverImageSquare || track.coverImage,
        coverImage: track.coverImageSquare || track.coverImage,
        authorInfo,
        relatedTracks
    };
};
