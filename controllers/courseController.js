const universityProfiles = {
    "UEH": {
        name: "Đại học Kinh tế TP.HCM (UEH)",
        color: "#4F46E5",
        bg: "rgba(79, 70, 229, 0.1)",
        gradient: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
        courses: [
            { title: "Hành vi người tiêu dùng", icon: "fa-bullseye", link: "course-ueh.html", courseId: "ueh_hvntd", totalLessons: 6, next: "Chương 2: Mô hình Howard-Sheth", aiHint: "Cần ôn tập gấp" },
            { title: "Quản trị Marketing", icon: "fa-chart-simple", link: "course-ueh-marketing.html", courseId: "ueh_marketing", totalLessons: 9, next: "Chương 1: Định vị thương hiệu", aiHint: null },
            { title: "Kinh tế Vĩ mô", icon: "fa-earth-asia", link: "course-ueh-macro.html", courseId: "ueh_macro", totalLessons: 6, next: "Chương 1: GDP & Lạm phát", aiHint: null },
            { title: "Nguyên lý kế toán", icon: "fa-file-invoice", link: "course-ueh-accounting.html", courseId: "ueh_accounting", totalLessons: 6, next: "Chương 3: Bảng cân đối kế toán", aiHint: "Khá khó" },
            { title: "Toán tài chính", icon: "fa-calculator", link: "course-ueh-math.html", courseId: "ueh_math", totalLessons: 6, next: "Chương 2: Lãi kép", aiHint: null },
            { title: "Quản trị nguồn nhân lực", icon: "fa-users", link: "course-ueh-hr.html", courseId: "ueh_hr", totalLessons: 6, next: "Chương 2: Tuyển dụng", aiHint: "Sắp thi" }
        ]
    },
    "BK": {
        name: "Đại học Bách Khoa (HCMUT)",
        color: "#0284C7",
        bg: "rgba(2, 132, 199, 0.1)",
        gradient: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
        courses: [
            { title: "Đại số tuyến tính", icon: "fa-square-root-variable", link: "course-bk.html", courseId: "bk_giai_tich", totalLessons: 2, next: "Mục 1: Tài liệu Giáo trình Học tập", aiHint: "Giáo trình PDF chuẩn" },
            { title: "Vật lý Đại cương 1", icon: "fa-atom", link: "course-bk-physics.html", courseId: "bk_physics", totalLessons: 9, next: "Chương 1: Động học chất điểm", aiHint: null },
            { title: "Giải tích 1", icon: "fa-chart-area", link: "course-bk-calculus.html", courseId: "bk_calculus_1", totalLessons: 7, next: "Chương 1: Phép tính vi phân hàm 1 biến", aiHint: "Quan trọng" },
            { title: "Hóa đại cương", icon: "fa-flask", link: "course-bk-chemistry.html", courseId: "bk_chemistry", totalLessons: 6, next: "Chương 1: Cấu tạo nguyên tử", aiHint: null },
            { title: "Nhập môn lập trình", icon: "fa-laptop-code", link: "course-bk-programming.html", courseId: "bk_programming", totalLessons: 7, next: "Chương 1: Con trỏ & Bộ nhớ", aiHint: "Cơ bản" }
        ]
    },
    "FTU": {
        name: "Đại học Ngoại thương (FTU)",
        color: "#E11D48",
        bg: "rgba(225, 29, 72, 0.1)",
        gradient: "linear-gradient(135deg, #FF758C 0%, #FF7EB3 100%)",
        courses: [
            { title: "Kinh tế Vi mô", icon: "fa-chart-pie", link: "course-ftu.html", courseId: "ftu_vamo", totalLessons: 6, next: "Chương 3: Độc quyền bán", aiHint: "Sẵn sàng cho bài thi" },
            { title: "Thanh toán Quốc tế", icon: "fa-money-bill-transfer", link: "course-ftu-payment.html", courseId: "ftu_international-payment", totalLessons: 6, next: "Chương 1: Phương thức tín dụng L/C", aiHint: null },
            { title: "Logistics & Chuỗi cung ứng", icon: "fa-truck-fast", link: "course-ftu-logistics.html", courseId: "ftu_logistics", totalLessons: 5, next: "Chương 1: Tổng quan Vận tải & Logistics", aiHint: "Đang học" },
            { title: "Giao dịch thương mại quốc tế", icon: "fa-handshake", link: "course-ftu-trade.html", courseId: "ftu_trade", totalLessons: 5, next: "Chương 1: Incoterms 2020", aiHint: null },
            { title: "Tiếng Anh chuyên ngành", icon: "fa-language", link: "course-ftu-english.html", courseId: "ftu_english", totalLessons: 5, next: "Unit 1: Business Correspondence", aiHint: null }
        ]
    },
    "NEU": {
        name: "Đại học Kinh tế Quốc dân (NEU)",
        color: "#15803D",
        bg: "rgba(21, 128, 61, 0.1)",
        gradient: "linear-gradient(135deg, #22C55E 0%, #166534 100%)",
        courses: [
            { title: "Kinh tế học cơ bản", icon: "fa-chart-line", link: "course-neu-economics.html", courseId: "neu_basic-economics", totalLessons: 6, next: "Chương 1: Cung và cầu", aiHint: null },
            { title: "Toán kinh tế", icon: "fa-calculator", link: "course-neu-math.html", courseId: "neu_econometrics", totalLessons: 3, next: "Chương 1: Ma trận & I/O", aiHint: null },
            { title: "Xác suất thống kê", icon: "fa-dice", link: "course-neu-stats.html", courseId: "neu_statistics", totalLessons: 3, next: "Chương 1: Ước lượng mẫu", aiHint: "Sắp thi" },
            { title: "Tài chính doanh nghiệp", icon: "fa-building-columns", link: "course-neu-finance.html", courseId: "neu_corporate_finance", totalLessons: 3, next: "Chương 1: Giá trị tiền tệ", aiHint: null },
            { title: "Kế toán quản trị", icon: "fa-file-invoice-dollar", link: "course-neu-accounting.html", courseId: "neu_managerial_accounting", totalLessons: 3, next: "Chương 1: Phân loại chi phí", aiHint: null }
        ]
    },
    "HCMUS": {
        name: "Đại học Khoa học Tự nhiên (HCMUS)",
        color: "#0369A1",
        bg: "rgba(3, 105, 161, 0.1)",
        gradient: "linear-gradient(135deg, #38BDF8 0%, #075985 100%)",
        courses: [
            { title: "Lập trình cơ bản (C++)", icon: "fa-code", link: "course-hcmus-programming.html", courseId: "hcmus_programming", totalLessons: 3, next: "Chương 1: Cú pháp C/C++", aiHint: null },
            { title: "Toán rời rạc", icon: "fa-diagram-project", link: "course-hcmus-discrete.html", courseId: "hcmus_discrete-math", totalLessons: 3, next: "Chương 1: Logic mệnh đề", aiHint: null },
            { title: "Cấu trúc dữ liệu & Giải thuật", icon: "fa-network-wired", link: "course-hcmus-dsa.html", courseId: "hcmus_dsa", totalLessons: 3, next: "Chương 1: Danh sách liên kết", aiHint: "Quan trọng" },
            { title: "Hệ Cơ sở dữ liệu", icon: "fa-database", link: "course-hcmus-db.html", courseId: "hcmus_database", totalLessons: 3, next: "Chương 1: Mô hình ERD", aiHint: null },
            { title: "Mạng máy tính", icon: "fa-server", link: "course-hcmus-networks.html", courseId: "hcmus_networks", totalLessons: 3, next: "Chương 1: Mô hình OSI", aiHint: "Cần thực hành" }
        ]
    },
    "TDTU": {
        name: "Đại học Tôn Đức Thắng (TDTU)",
        color: "#B45309",
        bg: "rgba(180, 83, 9, 0.1)",
        gradient: "linear-gradient(135deg, #F59E0B 0%, #92400E 100%)",
        courses: [
            { title: "Kỹ năng học đại học", icon: "fa-graduation-cap", link: "course-tdtu-skills.html", courseId: "tdtu_study-skills", totalLessons: 3, next: "Chương 1: Quản lý thời gian", aiHint: null },
            { title: "Tin học ứng dụng", icon: "fa-laptop-code", link: "course-tdtu-it.html", courseId: "tdtu_applied-it", totalLessons: 3, next: "Chương 1: Excel nâng cao", aiHint: null },
            { title: "Anh văn giao tiếp quốc tế", icon: "fa-comments", link: "course-tdtu-english.html", courseId: "tdtu_english_comm", totalLessons: 3, next: "Unit 1: Daily Conversations", aiHint: "Thực hành nhiều" },
            { title: "Khởi nghiệp & ĐMST", icon: "fa-lightbulb", link: "course-tdtu-startup.html", courseId: "tdtu_startup", totalLessons: 3, next: "Chương 1: Mô hình BMC", aiHint: null },
            { title: "Giáo dục thể chất", icon: "fa-person-running", link: "course-tdtu-pe.html", courseId: "tdtu_pe", totalLessons: 3, next: "Phần 1: Khởi động & Thể lực", aiHint: null }
        ]
    }
};

exports.universityProfiles = universityProfiles;

function catalogMetaById() {
    const map = {};
    Object.keys(universityProfiles).forEach(uni => {
        (universityProfiles[uni].courses || []).forEach(course => {
            map[course.courseId] = { ...course, university: uni };
        });
    });
    return map;
}

function coursePageLink(courseId) {
    return `course.html?id=${encodeURIComponent(courseId)}`;
}

function uniFromEmail(email) {
    const emailDomain = String(email || '').toLowerCase().split('@')[1] || '';
    return {
        'st.ueh.edu.vn': 'UEH',
        'hcmut.edu.vn': 'BK',
        'ftu.edu.vn': 'FTU',
        'st.neu.edu.vn': 'NEU',
        'hcmus.edu.vn': 'HCMUS',
        'tdtu.edu.vn': 'TDTU'
    }[emailDomain] || 'UEH';
}

exports.coursePageLink = coursePageLink;
exports.catalogMetaById = catalogMetaById;

exports.getCourses = async (req, res) => {
    try {
        const assignedUni = uniFromEmail(req.user && req.user.Email);
        const baseProfile = universityProfiles[assignedUni] || universityProfiles.UEH;
        const db = await (require('../config/database')).getDb();
        const userId = req.user ? req.user.User_ID : '';
        const catalog = catalogMetaById();

        const lessonCountRows = await db.all("SELECT course_id, COUNT(*) as count FROM course_lessons WHERE type != 'quiz' GROUP BY course_id");
        const chapterCountRows = await db.all('SELECT course_id, COUNT(*) as count FROM course_chapters GROUP BY course_id');
        const lessonCountMap = {};
        for (const row of lessonCountRows) { lessonCountMap[row.course_id] = row.count; }
        const chapterCountMap = {};
        for (const row of chapterCountRows) { chapterCountMap[row.course_id] = row.count; }

        const dbCourses = await db.all(
            'SELECT course_id, title, description, university FROM course_details WHERE university = ? ORDER BY title ASC',
            [assignedUni]
        );

        const progressRows = await db.all('SELECT course_id, lesson_id, completed_at FROM course_progress WHERE user_id = ?', [userId]);
        const progressMap = {};
        for (const row of progressRows) {
            if (!progressMap[row.course_id]) progressMap[row.course_id] = [];
            progressMap[row.course_id].push(row.lesson_id);
        }

        const recentReads = await db.all('SELECT course_id, lesson_title, last_read_at FROM reading_history WHERE user_id = ? ORDER BY datetime(last_read_at) DESC', [userId]);
        const recentReadMap = {};
        for (const r of recentReads) {
            if (!recentReadMap[r.course_id]) recentReadMap[r.course_id] = r;
        }

        const liveCourses = dbCourses.map(row => {
            const courseId = row.course_id;
            const meta = catalog[courseId] || {};
            const completedList = progressMap[courseId] || [];
            const realTotalLessons = ((lessonCountMap[courseId] || 0) + (chapterCountMap[courseId] || 0)) || 1;
            const completedCount = Math.min(completedList.length, realTotalLessons);
            const percentage = Math.min(100, Math.round((completedCount / realTotalLessons) * 100));

            let nextText = row.description || 'Chưa có chương học';
            if (percentage === 100) {
                nextText = '🎉 Đã hoàn thành 100% môn học';
            } else if (completedCount > 0) {
                nextText = `Đã hoàn thành ${completedCount}/${realTotalLessons} bài • Học tiếp bài sau`;
            } else if (recentReadMap[courseId]) {
                nextText = `Đang học: ${recentReadMap[courseId].lesson_title || 'Tài liệu môn học'}`;
            } else if (!(chapterCountMap[courseId] > 0)) {
                nextText = 'Chưa có chương — admin thêm ở khung chương trình';
            }

            return {
                title: row.title,
                icon: meta.icon || 'fa-book',
                link: coursePageLink(courseId),
                courseId,
                totalLessons: realTotalLessons,
                completedCount,
                percentage,
                next: nextText,
                aiHint: meta.aiHint || null
            };
        });

        const profile = {
            ...baseProfile,
            courses: liveCourses
        };

        return res.status(200).json({ profile, uni: assignedUni });
    } catch (error) {
        console.error('Error getting student courses:', error);
        return res.status(500).json({ message: 'Lỗi nạp khóa học.' });
    }
};

exports.getPublicCourses = async (req, res) => {
    try {
        const db = await (require('../config/database')).getDb();
        const catalog = catalogMetaById();
        const rows = await db.all('SELECT course_id, title, description, university FROM course_details ORDER BY university ASC, title ASC');
        const uniList = Object.keys(universityProfiles).map(code => ({
            code: code,
            name: universityProfiles[code].name,
            color: universityProfiles[code].color,
            bg: universityProfiles[code].bg,
            gradient: universityProfiles[code].gradient,
            courses: rows.filter(row => String(row.university || '').toUpperCase() === code).map(row => ({
                title: row.title,
                icon: (catalog[row.course_id] && catalog[row.course_id].icon) || 'fa-book',
                link: coursePageLink(row.course_id),
                courseId: row.course_id,
                totalLessons: 0,
                next: row.description || '',
                aiHint: null
            }))
        }));
        return res.status(200).json({ universities: uniList });
    } catch (err) {
        return res.status(500).json({ message: "Lỗi nạp danh sách khóa học." });
    }
};

exports.getPricingPlans = async (req, res) => {
    const plans = [
        {
            id: "monthly",
            name: "Gói 1 Tháng",
            badge: null,
            isPopular: false,
            price: "79.000đ",
            period: "/ tháng (30 ngày)",
            days: 30,
            amount: 79000,
            features: [
                "Truy cập 100% giáo trình & bài giảng các môn học",
                "100 lượt hỏi Trợ giảng AI RAG / tháng",
                "Thi thử 50 câu trắc nghiệm ngẫu nhiên từ PDF",
                "Tải slide bài giảng kèm Watermark bảo mật"
            ],
            btnText: "Đăng ký Gói 1 Tháng",
            btnClass: "btn-outline"
        },
        {
            id: "semester",
            name: "Gói Nửa Năm (Học Kỳ)",
            badge: "Phổ biến nhất",
            isPopular: true,
            price: "149.000đ",
            period: "/ kỳ (6 tháng)",
            days: 180,
            amount: 149000,
            features: [
                "Mở khóa toàn bộ môn học thuộc trường trong cả kỳ",
                "Không giới hạn hỏi Trợ giảng AI RAG 24/7",
                "Tạo đề thi 50 câu không giới hạn theo từng chương",
                "Phân tích lỗ hổng kiến thức AI Gap Analysis",
                "Đồng bộ tiến độ học tập đa thiết bị"
            ],
            btnText: "Đăng ký Gói Nửa Năm",
            btnClass: "btn-gradient"
        },
        {
            id: "yearly",
            name: "Gói 1 Năm VIP",
            badge: "Tiết kiệm 75%",
            isPopular: false,
            price: "249.000đ",
            period: "/ năm (12 tháng)",
            days: 365,
            amount: 249000,
            features: [
                "Toàn quyền truy cập mọi môn học của cả 6 trường ĐH",
                "Ưu tiên xử lý tốc độ cao AI RAG 24/7",
                "Mở khóa kho đề thi chính thức qua các năm",
                "Mở khóa Exam Radar & Nhóm học tập AI Study Group",
                "Hỗ trợ cố vấn học tập 1-1 chuyên sâu"
            ],
            btnText: "Đăng ký Gói 1 Năm VIP",
            btnClass: "btn-outline"
        }
    ];
    return res.status(200).json({ plans });
};

