/**
 * UniPass Course Portal Engine
 * Tự động đồng bộ 100% Khung chương trình, Tiêu đề, Mô tả, Số bài học từ Backend SQLite.
 * Tự động chèn phần Bài tập trắc nghiệm AI ở cuối mỗi chương với giao diện Premium:
 * - Nếu chương có 1 PDF: Sinh câu hỏi từ 1 PDF đó.
 * - Nếu chương có >= 2 PDF: Tổng hợp sinh câu hỏi từ tất cả PDF của chương đó.
 * - Nếu chương chưa có PDF nào: Vô hiệu hóa nút và hiển thị trạng thái chưa mở.
 */

(function () {
    // 1. Kiểm tra xác thực người dùng
    const currentUser = window.Auth ? window.Auth.current() : null;
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Xác định Course ID hiện tại từ URL hoặc tên file
    const pathName = window.location.pathname.split('/').pop() || 'course-ueh.html';
    const returnUrl = pathName + window.location.search;
    const courseMap = {
        'course-ueh.html': 'ueh_hvntd',
        'course-ueh-marketing.html': 'ueh_marketing',
        'course-ueh-macro.html': 'ueh_macro',
        'course-ueh-accounting.html': 'ueh_accounting',
        'course-ueh-math.html': 'ueh_math',
        'course-ueh-hr.html': 'ueh_hr',

        'course-bk.html': 'bk_giai_tich',
        'course-bk-physics.html': 'bk_physics',
        'course-bk-calculus.html': 'bk_calculus_1',
        'course-bk-chemistry.html': 'bk_chemistry',
        'course-bk-programming.html': 'bk_programming',

        'course-ftu.html': 'ftu_vamo',
        'course-ftu-payment.html': 'ftu_international-payment',
        'course-ftu-logistics.html': 'ftu_logistics',
        'course-ftu-trade.html': 'ftu_trade',
        'course-ftu-english.html': 'ftu_english',

        'course-neu-economics.html': 'neu_basic-economics',
        'course-neu-math.html': 'neu_econometrics',
        'course-neu-stats.html': 'neu_statistics',
        'course-neu-finance.html': 'neu_corporate_finance',
        'course-neu-accounting.html': 'neu_managerial_accounting',

        'course-hcmus-programming.html': 'hcmus_programming',
        'course-hcmus-discrete.html': 'hcmus_discrete-math',
        'course-hcmus-dsa.html': 'hcmus_dsa',
        'course-hcmus-db.html': 'hcmus_database',
        'course-hcmus-networks.html': 'hcmus_networks',

        'course-tdtu-skills.html': 'tdtu_study-skills',
        'course-tdtu-it.html': 'tdtu_applied-it',
        'course-tdtu-english.html': 'tdtu_english_comm',
        'course-tdtu-startup.html': 'tdtu_startup',
        'course-tdtu-pe.html': 'tdtu_pe'
    };

    const urlParams = new URLSearchParams(window.location.search);
    const queryCourse = urlParams.get('course') || urlParams.get('id');
    const COURSE_ID = window.COURSE_ID || queryCourse || courseMap[pathName] || 'ueh_hvntd';
    const normCourseId = COURSE_ID.replace(/-/g, '_');

    // 3. Inject CSS Styles
    const portalStyles = `
        .lesson-list li { transition: all 0.2s ease; cursor: default; }
        .lesson-list li.has-pdf-document { cursor: pointer; }
        .lesson-list li.has-pdf-document:hover { background: var(--surface-hover); border-color: var(--primary-light); transform: translateX(4px); }
        
        .lesson-list li.is-complete > div > span:first-child,
        .lesson-list li.is-complete > span:first-child { text-decoration: line-through; opacity: 0.65; }
        
        /* Premium AI Quiz Card Styling */
        .lesson-quiz-auto {
            display: flex !important;
            align-items: center !important;
            gap: 14px !important;
            padding: 12px 16px !important;
            border-radius: 14px !important;
            margin-top: 10px !important;
            transition: all 0.25s ease !important;
        }

        .lesson-quiz-auto.has-exam {
            background: linear-gradient(135deg, rgba(236, 72, 153, 0.05) 0%, rgba(129, 140, 248, 0.05) 100%) !important;
            border: 1px solid rgba(236, 72, 153, 0.3) !important;
            box-shadow: 0 2px 8px rgba(236, 72, 153, 0.06) !important;
        }

        .lesson-quiz-auto.has-exam:hover {
            background: linear-gradient(135deg, rgba(236, 72, 153, 0.09) 0%, rgba(129, 140, 248, 0.09) 100%) !important;
            border-color: rgba(236, 72, 153, 0.5) !important;
            box-shadow: 0 4px 14px rgba(236, 72, 153, 0.12) !important;
            transform: translateY(-1px) !important;
        }

        .lesson-quiz-auto.disabled {
            background: rgba(148, 163, 184, 0.05) !important;
            border: 1px dashed rgba(148, 163, 184, 0.3) !important;
            opacity: 0.7 !important;
            cursor: not-allowed !important;
        }

        .ai-quiz-icon-badge {
            width: 38px;
            height: 38px;
            border-radius: 10px;
            background: linear-gradient(135deg, #EC4899 0%, #BE185D 100%);
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
            box-shadow: 0 3px 8px rgba(236, 72, 153, 0.3);
        }

        .lesson-quiz-auto.disabled .ai-quiz-icon-badge {
            background: #94A3B8;
            box-shadow: none;
        }

        .ai-quiz-info {
            flex: 1;
            min-width: 0;
        }

        .ai-quiz-title {
            display: flex;
            align-items: center;
            gap: 8px;
            font-weight: 700;
            font-size: 14px;
            color: var(--text-main, #1e293b);
            line-height: 1.3;
        }

        .ai-quiz-chip {
            font-size: 10.5px;
            font-weight: 800;
            padding: 2px 7px;
            border-radius: 6px;
            background: rgba(236, 72, 153, 0.15);
            color: #EC4899;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .ai-quiz-desc {
            font-size: 12px;
            color: var(--text-muted, #64748b);
            margin-top: 3px;
            line-height: 1.4;
        }

        .ai-quiz-actions {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }

        .btn-start-chapter-quiz {
            background: linear-gradient(135deg, #EC4899 0%, #BE185D 100%) !important;
            color: #ffffff !important;
            border: none !important;
            border-radius: 9px !important;
            padding: 7px 16px !important;
            font-weight: 700 !important;
            font-size: 13px !important;
            cursor: pointer !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 7px !important;
            white-space: nowrap !important;
            box-shadow: 0 2px 8px rgba(236, 72, 153, 0.3) !important;
            transition: all 0.2s ease !important;
        }

        .btn-start-chapter-quiz:hover:not(:disabled) {
            transform: scale(1.03) !important;
            box-shadow: 0 4px 12px rgba(236, 72, 153, 0.45) !important;
        }

        .btn-start-chapter-quiz:disabled {
            opacity: 0.75 !important;
            cursor: wait !important;
        }

        .btn-quiz-locked {
            background: var(--border-color, #e2e8f0) !important;
            color: var(--text-muted, #64748b) !important;
            border: none !important;
            border-radius: 9px !important;
            padding: 6px 14px !important;
            font-weight: 600 !important;
            font-size: 12.5px !important;
            cursor: not-allowed !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            white-space: nowrap !important;
        }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = portalStyles;
    document.head.appendChild(styleEl);

    let allPdfs = [];
    let coursePdfs = [];
    let currentSyllabus = null;

    const uniNames = {
        'BK': 'Đại học Bách Khoa TP.HCM (HCMUT)',
        'UEH': 'Đại học Kinh tế TP.HCM (UEH)',
        'FTU': 'Đại học Ngoại thương (FTU)',
        'NEU': 'Đại học Kinh tế Quốc dân (NEU)',
        'HCMUS': 'Đại học Khoa học Tự nhiên (HCMUS)',
        'TDTU': 'Đại học Tôn Đức Thắng (TDTU)'
    };

    // 4. Ghi nhận thời gian truy cập khóa học
    async function trackCourseVisit() {
        try {
            const token = localStorage.getItem('unipass_token') || '';
            fetch(`/api/user/course-access/${COURSE_ID}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {});
        } catch(e){}
    }

    // 5. Tải danh sách PDF và Khung chương trình thực tế từ Backend Database
    async function loadDynamicSyllabus() {
        trackCourseVisit();
        try {
            const token = localStorage.getItem('unipass_token') || '';
            const [syllabusRes, pdfsRes] = await Promise.all([
                fetch(`/api/courses/syllabus/${encodeURIComponent(COURSE_ID)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch('/api/course-pdfs')
            ]);

            if (!syllabusRes.ok) {
                if (syllabusRes.status === 404) {
                    const hero = document.querySelector('.course-hero');
                    if (hero) {
                        hero.innerHTML = `
                            <div class="hero-content" style="text-align: center; padding: 50px 20px;">
                                <i class="fa-solid fa-triangle-exclamation" style="font-size: 52px; color: var(--danger); margin-bottom: 16px; display: inline-block;"></i>
                                <h1 style="font-size: 26px; font-weight: 800; margin-bottom: 8px;">Môn học không tồn tại hoặc đã bị xóa</h1>
                                <p style="color: var(--text-muted); margin-bottom: 24px; font-size: 15px;">Môn học này đã được xóa khỏi hệ thống UniPass hoặc đường dẫn không hợp lệ.</p>
                                <a href="student-courses.html" class="btn btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px; text-decoration: none; border-radius: 30px; font-weight: 700;">
                                    <i class="fa-solid fa-arrow-left"></i> Quay lại Khóa học của tôi
                                </a>
                            </div>
                        `;
                    }
                    const mainContent = document.querySelector('.course-main, .container, main');
                    if (mainContent && mainContent !== hero) {
                        const syllabus = document.querySelector('.syllabus');
                        if (syllabus) syllabus.style.display = 'none';
                        const sidebar = document.querySelector('.course-sidebar');
                        if (sidebar) sidebar.style.display = 'none';
                    }
                }
                return;
            }

            if (pdfsRes.ok) {
                const pdfsData = await pdfsRes.json();
                allPdfs = pdfsData.documents || [];
                coursePdfs = allPdfs.filter(d => {
                    const dNorm = String(d.course || '').replace(/-/g, '_');
                    return dNorm === normCourseId || d.course === COURSE_ID;
                });
            }
            
            const data = await syllabusRes.json();
            currentSyllabus = data;
            const course = data.course || {};
            const chapters = data.chapters || [];

            // 1. Cập nhật Tiêu đề và Mô tả từ Database
            const heroH1 = document.querySelector('.course-hero h1');
            if (heroH1 && course.title) heroH1.textContent = course.title;
            const heroP = document.querySelector('.course-hero p');
            if (heroP && course.description) heroP.textContent = course.description;

            if (course.title) {
                document.title = `${course.title} | UniPass`;
            }

            // 2. Cập nhật Breadcrumb
            const breadcrumb = document.querySelector('.breadcrumb');
            if (breadcrumb && course.title) {
                breadcrumb.innerHTML = `<a href="dashboard.html">Trang chủ</a> &gt; <a href="student-courses.html">Lộ trình của tôi</a> &gt; ${escapeHtml(course.title)}`;
            }

            // 3. Render Khung chương trình (Syllabus) kèm phần bài tập tự động cuối mỗi chương
            let totalLessonsCount = 0;
            const syllabusContainer = document.querySelector('.syllabus');

            if (chapters.length > 0) {
                if (syllabusContainer) {
                    let html = '';
                    chapters.forEach((ch, idx) => {
                        const isActive = idx === 0 ? 'active' : '';
                        const chapterNum = ch.chapter_order || (idx + 1);

                        // Tìm tất cả các PDF thuộc chương này (tìm trong allPdfs)
                        const chapterPdfList = allPdfs.filter(p => {
                            // Match qua document_id gán trong lesson của chương này
                            const matchLessonDoc = ch.lessons && ch.lessons.some(l => String(l.document_id) === String(p.id));
                            if (matchLessonDoc) return true;

                            // Match qua course ID và lessonId / tên chương
                            const dNorm = String(p.course || '').replace(/-/g, '_');
                            if (dNorm !== normCourseId && p.course !== COURSE_ID) return false;

                            const pLessonId = String(p.lessonId || '').toLowerCase();
                            if (pLessonId.includes(`chapter-${chapterNum}-`) || pLessonId.includes(`chapter_${chapterNum}_`) || pLessonId === `chapter-${chapterNum}`) {
                                return true;
                            }

                            const pLessonTitle = String(p.lessonTitle || '').toLowerCase();
                            const chTitleLower = String(ch.title || '').toLowerCase();
                            if (pLessonTitle.includes(`chương ${chapterNum}`) || pLessonTitle.includes(`chuong ${chapterNum}`)) {
                                return true;
                            }
                            if (chTitleLower && pLessonTitle && chTitleLower.includes(pLessonTitle)) {
                                return true;
                            }
                            return false;
                        });

                        // Lọc các bài học dạng 'doc'
                        const docLessons = (ch.lessons || []).filter(l => l.type !== 'quiz');
                        
                        let lessonsHtml = '';
                        docLessons.forEach(l => {
                            totalLessonsCount++;
                            const explicitDocId = l.document_id || '';
                            const matchingPdf = allPdfs.find(p => {
                                if (explicitDocId && String(p.id) === String(explicitDocId)) return true;
                                const dNorm = String(p.course || '').replace(/-/g, '_');
                                if (dNorm !== normCourseId && p.course !== COURSE_ID) return false;
                                const pLessonId = String(p.lessonId || '').toLowerCase();
                                const exactLessonId = `chapter-${chapterNum}-lesson-${l.lesson_order || 1}`;
                                return pLessonId === exactLessonId;
                            });

                            const hasPdf = Boolean(matchingPdf);
                            const metaText = l.meta_text ? `<span style="display:block; font-size:12px; color:var(--text-muted); margin-top:2px;">${escapeHtml(l.meta_text)}</span>` : '';
                            const docIdAttr = matchingPdf ? matchingPdf.id : explicitDocId;

                            lessonsHtml += `
                                <li data-lesson-id="${l.lesson_id || ('lesson_' + l.id)}" data-doc-id="${docIdAttr}" data-ch-pk="${ch.id || ''}" data-ls-pk="${l.id || ''}" class="${hasPdf ? 'has-pdf-document' : ''}" style="${hasPdf ? 'cursor:pointer;' : ''}">
                                    <div style="flex:1;">
                                        <span style="font-weight:600;"><i class="fa-solid fa-file-lines" style="color:var(--primary); margin-right:6px;"></i> ${escapeHtml(l.title)}</span>
                                        ${metaText}
                                    </div>
                                    <span class="lesson-type type-doc" style="${hasPdf ? 'background: rgba(79, 70, 229, 0.12); color: var(--primary); font-weight: 700;' : ''}">
                                        <i class="fa-solid ${hasPdf ? 'fa-book-open' : 'fa-file-lines'}"></i> ${hasPdf ? 'Đọc tài liệu' : 'Tài liệu'}
                                    </span>
                                    <label class="lesson-complete"><input type="checkbox"> Đã học</label>
                                </li>
                            `;
                        });

                        // Thêm mục Bài tập trắc nghiệm AI TỰ ĐỘNG ở cuối chương
                        totalLessonsCount++;
                        const hasPdfs = chapterPdfList.length > 0;
                        const quizLessonId = `quiz_chapter_${ch.id || chapterNum}`;

                        if (hasPdfs) {
                            // ĐÃ CÓ ít nhất 1 file PDF
                            const pdfDesc = chapterPdfList.length === 1 
                                ? `Tự động sinh đề từ 1 tài liệu PDF: <strong>${escapeHtml(chapterPdfList[0].originalName || chapterPdfList[0].name || '')}</strong>`
                                : `Tổng hợp đề thi từ <strong>${chapterPdfList.length} tài liệu PDF</strong> trong chương`;

                            lessonsHtml += `
                                <li class="lesson-quiz-auto has-exam" data-chapter-id="${ch.id || ''}" data-chapter-num="${chapterNum}" data-chapter-title="${escapeHtml(ch.title)}" data-lesson-id="${quizLessonId}">
                                    <div class="ai-quiz-icon-badge">
                                        <i class="fa-solid fa-bolt"></i>
                                    </div>
                                    <div class="ai-quiz-info">
                                        <div class="ai-quiz-title">
                                            <span class="ai-quiz-chip">AI RAG Exam</span>
                                            <span>Phòng thi trắc nghiệm & Tổng ôn tập AI</span>
                                        </div>
                                        <div class="ai-quiz-desc">${pdfDesc}</div>
                                    </div>
                                    <div class="ai-quiz-actions">
                                        <button type="button" class="btn-start-chapter-quiz">
                                            <i class="fa-solid fa-play"></i> <span>Bắt đầu thi</span>
                                        </button>
                                        <label class="lesson-complete"><input type="checkbox"> <span>Đã học</span></label>
                                    </div>
                                </li>
                            `;
                        } else {
                            // CHƯA CÓ PDF nào
                            lessonsHtml += `
                                <li class="lesson-quiz-auto disabled" data-chapter-id="${ch.id || ''}" data-chapter-num="${chapterNum}" data-chapter-title="${escapeHtml(ch.title)}" data-lesson-id="${quizLessonId}">
                                    <div class="ai-quiz-icon-badge">
                                        <i class="fa-solid fa-lock"></i>
                                    </div>
                                    <div class="ai-quiz-info">
                                        <div class="ai-quiz-title">
                                            <span class="ai-quiz-chip" style="background: rgba(148, 163, 184, 0.15); color: #94A3B8;">AI Exam</span>
                                            <span style="color: var(--text-muted);">Bài tập trắc nghiệm AI</span>
                                        </div>
                                        <div class="ai-quiz-desc">Chương này hiện chưa có file PDF nào để sinh đề thi</div>
                                    </div>
                                    <div class="ai-quiz-actions">
                                        <button type="button" class="btn-quiz-locked" disabled>
                                            <i class="fa-solid fa-lock"></i> <span>Chưa mở</span>
                                        </button>
                                        <label class="lesson-complete" style="opacity: 0.4;"><input type="checkbox" disabled> <span>Đã học</span></label>
                                    </div>
                                </li>
                            `;
                        }

                        const totalChapterItems = docLessons.length + 1;
                        const lessonCountText = `${totalChapterItems} Bài học`;

                        html += `
                            <div class="accordion-item ${isActive}">
                                <div class="accordion-header">
                                    <div class="chapter-title"><i class="fa-solid fa-folder-open"></i> ${escapeHtml(ch.title)}</div>
                                    <div class="chapter-meta">${lessonCountText} <i class="fa-solid fa-chevron-down" style="margin-left: 8px;"></i></div>
                                </div>
                                <div class="accordion-content">
                                    <ul class="lesson-list">
                                        ${lessonsHtml}
                                    </ul>
                                </div>
                            </div>
                        `;
                    });

                    syllabusContainer.innerHTML = html;

                    // Gán toggle Accordion
                    syllabusContainer.querySelectorAll('.accordion-header').forEach(header => {
                        header.onclick = () => {
                            const item = header.parentElement;
                            item.classList.toggle('active');
                        };
                    });
                }
            } else if (syllabusContainer) {
                syllabusContainer.innerHTML = `
                    <div style="text-align: center; padding: 48px 20px; color: var(--text-muted); background: var(--surface); border-radius: 16px; border: 1px dashed var(--border-color);">
                        <i class="fa-solid fa-folder-open" style="font-size: 32px; color: var(--text-muted); margin-bottom: 12px; display: block;"></i>
                        <h3 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">Môn học đang được chuẩn bị giáo trình</h3>
                        <p style="font-size: 13.5px; margin: 0;">Giảng viên đang biên soạn nội dung và cập nhật bài học cho môn này.</p>
                    </div>
                `;
            }

            // 4. Cập nhật Badges thống kê ở Hero Header
            const statContainer = document.querySelector('.course-stats');
            if (statContainer) {
                const uniFullName = uniNames[course.university] || (course.university ? `Đại học ${course.university}` : 'Trường Đại học');
                statContainer.innerHTML = `
                    <div class="stat-item"><i class="fa-solid fa-university"></i> ${escapeHtml(uniFullName)}</div>
                    <div class="stat-item"><i class="fa-solid fa-folder-open"></i> ${chapters.length} Chương học</div>
                    <div class="stat-item"><i class="fa-solid fa-layer-group"></i> ${totalLessonsCount} Bài học trọng tâm</div>
                `;
            }

            setupLessonsInteraction();
            await syncSavedProgress();
        } catch (e) {
            console.warn('Lỗi tải khung chương trình động:', e);
            const syllabusContainer = document.querySelector('.syllabus');
            if (syllabusContainer) {
                syllabusContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--danger);">
                        <i class="fa-solid fa-circle-exclamation" style="font-size: 28px; margin-bottom: 10px; display: block;"></i>
                        <div>Không thể tải dữ liệu môn học lúc này. Vui lòng tải lại trang.</div>
                    </div>
                `;
            }
        }
    }

    // 6. Gán tương tác click xem PDF & làm bài thi AI
    function setupLessonsInteraction() {
        const accordionItems = document.querySelectorAll('.accordion-item');
        accordionItems.forEach((accordionItem, chapterIdx) => {
            const chapterHeader = accordionItem.querySelector('.chapter-title');
            const chapterTitle = chapterHeader ? chapterHeader.textContent.trim() : '';
            const chapterNumMatch = chapterTitle.match(/Chương\s*(\d+)/i) || chapterTitle.match(/Phần\s*(\d+)/i) || chapterTitle.match(/Unit\s*(\d+)/i);
            const chapterNum = chapterNumMatch ? parseInt(chapterNumMatch[1]) : (chapterIdx + 1);

            const docItems = accordionItem.querySelectorAll('.lesson-list li:not(.lesson-quiz-auto)');
            docItems.forEach((li, lessonIdx) => {
                const lessonNum = lessonIdx + 1;
                const exactLessonId = `chapter-${chapterNum}-lesson-${lessonNum}`;
                const explicitDocId = li.dataset.docId || '';
                const chPk = li.dataset.chPk || '';
                const lsPk = li.dataset.lsPk || '';
                const dbLessonId = (chPk && lsPk) ? `${chPk}-lesson-${lsPk}` : '';

                const matchingPdf = allPdfs.find(p => {
                    if (explicitDocId && String(p.id) === String(explicitDocId)) return true;
                    const dNorm = String(p.course || '').replace(/-/g, '_');
                    if (dNorm !== normCourseId && p.course !== COURSE_ID) return false;
                    const pLessonId = String(p.lessonId || '').toLowerCase();
                    return pLessonId === exactLessonId || (dbLessonId && pLessonId === dbLessonId);
                });

                if (matchingPdf) {
                    li.classList.add('has-pdf-document');
                    li.style.cursor = 'pointer';

                    li.onclick = async (e) => {
                        if (e.target.tagName === 'INPUT' || e.target.closest('.lesson-complete')) return;
                        await updateLessonProgress(li, true);
                        const lessonTitle = li.querySelector('span')?.textContent?.trim() || matchingPdf.originalName || 'Bài học';
                        const chapterHeader = accordionItem.querySelector('.chapter-title')?.textContent?.trim() || '';
                        const courseTitle = currentSyllabus?.course?.title || '';
                        const fullTitle = chapterHeader ? `${chapterHeader}: ${lessonTitle}` : lessonTitle;
                        
                        window.location.href = `pdf-viewer.html?id=${encodeURIComponent(matchingPdf.id)}&course=${encodeURIComponent(courseTitle)}&chapter=${encodeURIComponent(chapterHeader)}&lesson=${encodeURIComponent(lessonTitle)}&title=${encodeURIComponent(fullTitle)}&returnTo=${encodeURIComponent(returnUrl)}`;
                    };
                }
            });
        });

        // Tương tác với nút Bắt đầu thi trắc nghiệm AI ở cuối mỗi chương
        document.querySelectorAll('.btn-start-chapter-quiz').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();

                const item = btn.closest('.lesson-quiz-auto');
                const chapterId = item?.dataset.chapterId;
                const chapterNum = item?.dataset.chapterNum;
                const chapterTitle = item?.dataset.chapterTitle || `Chương ${chapterNum}`;

                const origHtml = btn.innerHTML;
                btn.disabled = true;
                
                // Hiển thị phần trăm tiến trình mượt mà (Dynamic Progress Percentage)
                let progressVal = 12;
                btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang tạo đề ${progressVal}%</span>`;
                const progressTimer = setInterval(() => {
                    if (progressVal < 92) {
                        progressVal += Math.floor(Math.random() * 8) + 4;
                        if (progressVal > 92) progressVal = 92;
                        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Đang tạo đề ${progressVal}%</span>`;
                    }
                }, 320);

                try {
                    const courseTitle = currentSyllabus?.course?.title || 'Môn học';
                    const university = currentSyllabus?.course?.university || 'BK';

                    const res = await fetch('/api/ai/generate-exam', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer ' + (localStorage.getItem('unipass_token') || '')
                        },
                        body: JSON.stringify({
                            examTitle: `Bài tập trắc nghiệm AI - ${chapterTitle}`,
                            subject: courseTitle,
                            university: university,
                            courseId: COURSE_ID,
                            chapterTitle: chapterTitle,
                            chapterId: chapterId,
                            chapterNum: chapterNum,
                            targetScope: 'chapter',
                            timeLimitMinutes: 45
                        })
                    });

                    if (!res.ok) {
                        const errData = await res.json().catch(() => ({}));
                        throw new Error(errData.message || 'Lỗi sinh đề thi từ AI.');
                    }

                    const examData = await res.json();
                    if (!examData || !examData.questions || examData.questions.length === 0) {
                        throw new Error('AI không thể sinh câu hỏi cho chương này.');
                    }

                    if (item) {
                        await updateLessonProgress(item, true);
                    }

                    clearInterval(progressTimer);
                    btn.innerHTML = `<i class="fa-solid fa-check"></i> <span>Hoàn tất 100%!</span>`;
                    // Lưu dữ liệu đề thi và chuyển sang phòng thi exam-room.html
                    sessionStorage.setItem('current_exam_data', JSON.stringify(examData));
                    sessionStorage.setItem('exam_return_url', returnUrl);
                    window.location.href = `exam-room.html?returnTo=${encodeURIComponent(returnUrl)}`;

                } catch (err) {
                    clearInterval(progressTimer);
                    if (window.showAlert) window.showAlert(err.message, 'error');
                    else alert(err.message);
                    btn.disabled = false;
                    btn.innerHTML = origHtml;
                }
            });
        });
    }

    // 7. Cập nhật tiến độ hoàn thành bài học vào Server
    async function updateLessonProgress(li, isCompleted) {
        if (!li) return;
        const lessonId = li.dataset.lessonId || (li.id ? li.id.replace('lesson-', '') : '');
        if (!lessonId) return;

        const checkbox = li.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = isCompleted;

        if (isCompleted) {
            li.classList.add('is-complete');
        } else {
            li.classList.remove('is-complete');
        }

        try {
            const token = localStorage.getItem('unipass_token') || '';
            await fetch(`/api/course-progress/${COURSE_ID}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ lessonId, completed: isCompleted })
            });

            recalcProgressUI();
        } catch (err) {
            console.error('Error updating progress:', err);
        }
    }

    function recalcProgressUI() {
        const allLessonLis = document.querySelectorAll('.lesson-list li[data-lesson-id]');
        const total = allLessonLis.length || 1;
        const completedLis = document.querySelectorAll('.lesson-list li[data-lesson-id] input[type="checkbox"]:checked');
        const completedCount = Math.min(completedLis.length, total);
        const percent = Math.min(100, Math.round((completedCount / total) * 100));

        const progressSummary = document.getElementById('course-progress-summary');
        if (progressSummary) {
            progressSummary.textContent = `Đã hoàn thành: ${completedCount}/${total} bài (${percent}%)`;
        }

        const sidebarProgressPercent = document.getElementById('sidebar-progress-percent');
        if (sidebarProgressPercent) sidebarProgressPercent.textContent = `${percent}%`;

        const sidebarProgressBar = document.getElementById('sidebar-progress-bar');
        if (sidebarProgressBar) sidebarProgressBar.style.width = `${percent}%`;
    }

    // 8. Đồng bộ trạng thái đã học từ Server Database
    async function syncSavedProgress() {
        try {
            const token = localStorage.getItem('unipass_token') || '';
            const res = await fetch(`/api/course-progress/${COURSE_ID}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return;
            const data = await res.json();
            const completedSet = new Set(data.completedLessonIds || []);

            const allLessonLis = document.querySelectorAll('.lesson-list li[data-lesson-id]');
            allLessonLis.forEach(li => {
                const lessonId = li.dataset.lessonId || (li.id ? li.id.replace('lesson-', '') : '');
                const cb = li.querySelector('input[type="checkbox"]');
                if (lessonId && completedSet.has(lessonId)) {
                    li.classList.add('is-complete');
                    if (cb) cb.checked = true;
                } else {
                    li.classList.remove('is-complete');
                    if (cb) cb.checked = false;
                }
            });

            recalcProgressUI();
        } catch (e) {
            console.error('Error syncing saved progress:', e);
        }
    }

    // 9. Bắt sự kiện Checkbox Toggle
    document.addEventListener('change', async (e) => {
        if (e.target.matches('.lesson-complete input[type="checkbox"]')) {
            const li = e.target.closest('li[data-lesson-id]');
            if (li) {
                await updateLessonProgress(li, e.target.checked);
            }
        }
    });

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // Khởi chạy
    document.addEventListener('DOMContentLoaded', loadDynamicSyllabus);
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
        loadDynamicSyllabus();
    }
})();
