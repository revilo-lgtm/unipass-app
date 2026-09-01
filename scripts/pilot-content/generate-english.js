'use strict';

const { topicFromLesson, chapterShort, wordCount } = require('./pilot-writer');

/** @type {Record<string, string[]>} */
const LESSON_BODIES = {
	'chapter-1-lesson-1': [
		`Bài mở đầu môn Anh văn giao tiếp quốc tế tại TDTU tập trung vào Everyday Conversational English & Pronunciation — kỹ năng nền tảng trước khi bạn tham gia thảo luận học thuật hay thuyết trình. Sinh viên thường hiểu ngữ pháp nhưng vẫn "đơ" trong hội thoại tự nhiên vì thiếu cụm từ chức năng và phát âm chưa rõ. Bài này giúp bạn giao tiếp hàng ngày trên campus — chào hỏi, hỏi đường, mời rủ — đồng thời luyện các cặp âm tiếng Anh mà người Việt hay nhầm. Mục tiêu: nói được 45–60 giây giới thiệu bản thân và xử lý tình huống giao tiếp ngắn mà không cần dịch trong đầu.`,

		`Core speaking functions for campus life:

1. Introducing yourself
"I'm [Name], a [year] student majoring in [major]."
"I'm from [city] and I joined TDTU because of its international programs."

2. Asking for information
"Excuse me, could you tell me where…?"
"Do you happen to know when…?"
"Sorry to bother you — is this the right building for…?"

3. Agreeing and disagreeing politely
"I see your point, but…"
"That's a fair point. However, I'd add that…"
"I'm not sure I agree entirely because…"

4. Inviting and responding
"Would you like to grab coffee after class?"
"I'd love to, but I have a lab session."
"That sounds great — what time works for you?"

Pronunciation focus (IPA):
• /iː/ vs /ɪ/ — "sheep" /ʃiːp/ vs "ship" /ʃɪp/
• /æ/ vs /ʌ/ — "cat" /kæt/ vs "cut" /kʌt/
• /ɜː/ — "bird" /bɜːd/, "work" /wɜːk/

Shadowing method: listen to a short clip → repeat immediately → match rhythm and sentence stress. Record yourself and compare with the original.

Useful vocabulary: sophomore, major, campus, cafeteria, deadline, clarify, appreciate, convenient.`,

		`Dialogue — Lost on campus:
Student: Excuse me, could you tell me where Building A7 is?
Staff: Sure. Go straight past the library, turn left at the fountain, and it's the third building on your right.
Student: Thank you so much. Is there a faster way from the dormitory side?
Staff: You can cut through the parking lot behind the cafeteria — it saves about five minutes.
Student: Perfect. I really appreciate your help.
Staff: No problem. Good luck with your class!

Dialogue — Meeting a classmate:
A: Hi, I'm Linh. Are you in the International Communication class too?
B: Yes, I'm Minh. Nice to meet you. Which year are you in?
A: Second year, Business Administration. What about you?
B: Same major, third year. Would you like to practice speaking together after Thursday's seminar?
A: I'd love to. Let's exchange Zalo numbers.

Pronunciation drill — read aloud and mark stressed syllables:
"International students participate in weekly conversation clubs."
"Vietnamese learners often confuse the short /ɪ/ and long /iː/ sounds."
"Clear pronunciation helps listeners focus on your ideas, not your accent."`,

		`Nắm cụm từ chức năng trước khi học từ vựng hiếm — chúng tái sử dụng được trong mọi tình huống campus.
Shadowing (nghe và lặp lại ngay) cải thiện nhịp điệu nhanh hơn đọc thầm.
Khi không hiểu, hỏi lại bằng "Could you repeat that?" thay vì giả vờ hiểu.
Luyện 10 phút mỗi ngày nói to — hiệu quả hơn ôn tập 2 giờ cuối tuần.`,
	],

	'chapter-2-lesson-1': [
		`Unit 2: Academic Discussion & Giving Opinions chuyển từ small talk sang thảo luận học thuật — bày tỏ quan điểm, đưa lý do, phản hồi bạn cùng lớp trong môi trường seminar tiếng Anh. Kỹ năng này xuất hiện ở dự án nhóm, tranh biện lớp và bài thi exit test TDTU, nơi giám khảo đánh giá fluency, coherence và interaction. Bài lý thuyết này trang bị khung ngôn ngữ formal register, chiến lược disagree lịch sự và từ vựng học thuật cơ bản cho viết đoạn văn ngắn (topic sentence + support + example).`,

		`Opinion language (formal register):

Stating a view:
"In my view, hybrid learning offers flexibility without losing face-to-face interaction."
"From my perspective, the policy needs clearer guidelines."
"I would argue that grades alone do not measure intelligence."

Supporting with reasons:
"This is because students with part-time jobs lack time for mandatory activities."
"For instance, a 2024 campus survey showed 62% prefer recorded lectures for review."
"Research suggests that peer discussion improves retention more than passive listening."

Balancing and hedging:
"While it is true that social media can distract, nevertheless it also connects study groups."
"It seems that younger students adapt faster to digital tools."
"There is some evidence that AI-assisted writing requires new assessment rules."

Discussion moves:
Building on: "I'd like to add that…" / "That connects to the issue of…"
Politely disagreeing: "I'm not entirely convinced because…" / "I see your point, but have you considered…?"
Summarising: "So far we've agreed that… but we still need to decide…"
Inviting peers: "What do you think, [name]?" / "Does anyone have a different view?"

Academic writing stems (short paragraph):
Topic sentence → reason → example → mini-conclusion.
Avoid: "I think yes." Prefer: "I believe the advantages outweigh the disadvantages because…"

Key vocabulary: analyze, evaluate, compare, justify, implications, factors, trend, furthermore, however, consequently.`,

		`Sample seminar discussion — Online vs offline learning:

A: In my view, hybrid learning offers the best balance. Students gain flexibility while still attending key face-to-face sessions for lab work and presentations.
B: I see your point, but not every student has reliable internet at home. That could widen the gap between urban and rural learners.
A: That's fair. Perhaps universities should provide subsidized data packages or campus Wi-Fi hours.
C: Could I add that recorded lectures help students review difficult concepts at their own pace?
B: True. However, we should also discuss whether passive watching replaces active participation.
A: So far we've agreed that flexibility matters, but we still need to decide how to support students with limited access.

Phrase upgrade exercise:
Weak: "I think phones are bad in class."
Strong: "I would argue that unrestricted smartphone use during lectures reduces concentration, although phones can be valuable learning tools when used intentionally for research."

Short academic paragraph model:
"Universities should encourage community service without making it mandatory. While volunteering develops empathy and practical skills, some students already work part-time to support their families. Instead, integrating service options into existing courses would respect diverse student circumstances."`,

		`Dùng khung opinion + reason + example cho mỗi lượt phát biểu 30–60 giây.
Disagree bằng lý do, không tấn công cá nhân — examiner đánh giá interaction quality.
Tóm tắt tiến độ nhóm ("So far we've agreed…") thể hiện kỹ năng facilitation.
Academic register: tránh slang nhưng giữ giọng tự nhiên — không cần câu quá phức tạp.`,
	],

	'chapter-2-lesson-2': [
		`Bài tập & vận dụng Unit 2 — áp dụng ngôn ngữ thảo luận học thuật vào nhiệm vụ nhóm có thời gian. Bạn sẽ tranh luận cả hai phe chủ đề liên quan campus, dùng linking phrases chính xác và góp ý cho bạn (peer feedback). Bài này mô phỏng group discussion trong lớp và phần thi nói nơi bạn phải phản hồi ý kiến người khác, không chỉ đọc monologue. Chuẩn bị: giấy ghi chú tối thiểu, bật timer, ghi âm một vòng để đếm filler words.`,

		`Practice tasks for group discussion:

Task A — Two-minute opinion speech
Topic: "Should TDTU require community service hours for graduation?"
Structure: clear position → two reasons → brief example → one-sentence conclusion.
Time limit: 120 seconds maximum.

Task B — Agree/disagree response cards
Card 1: "Social media helps students learn." — Partner responds with partial agreement using "While… nevertheless…"
Card 2: "Grades measure intelligence accurately." — Partner politely disagrees with "I'm not entirely convinced because…"
Card 3: "AI tools should be banned in homework." — Partner builds on: "That connects to the issue of academic integrity because…"

Peer feedback checklist:
□ Clear thesis stated in the first 10 seconds
□ At least one linking phrase (Furthermore, However, In addition)
□ Turn length 30–60 seconds — not a three-minute monologue
□ Eye contact and verbal acknowledgment ("I see your point")
□ Invites another speaker ("What do you think, [name]?")

Group discussion roles:
Facilitator — keeps time, invites quiet members.
Note-taker — records agreed points and open questions.
Speaker 1 / Speaker 2 — alternate positions on the topic.

Email etiquette (follow-up after discussion):
Subject: Group Project — Meeting Summary 12 March
"Dear team, Thank you for today's discussion. We agreed on [point A] and [point B]. Next step: each member drafts one paragraph by Friday. Please confirm your availability for a 30-minute Zoom on Monday."`,

		`Model two-minute opinion (excerpt):
"I would argue that community service should be encouraged but not mandatory. While volunteering develops empathy and practical skills, some students already work part-time to support their families and may lack time for regular off-campus activities. For instance, my classmate works evenings at a café and cannot commit to weekend projects. Instead, the university could integrate service options into existing courses or offer flexible hour banks. In conclusion, flexibility respects diverse student circumstances while still promoting civic engagement."

Pair drill — AI tools in homework:
Student A: "I believe AI writing tools should be allowed with clear rules because they help students brainstorm and check grammar."
Student B: "That connects to the issue of academic integrity because examiners need to assess original thinking, not machine-generated text."
Student A: "Fair point. Perhaps courses could require students to submit drafts showing their revision process."
Switch roles after three minutes.

Timed debate scorecard (1–5):
Clarity of thesis | Use of linking phrases | Response to partner | Time management`,

		`Luyện cả hai phe (for/against) để linh hoạt dưới áp lực thi.
Interaction quality quan trọng ngang grammar — examiner ghi nhận turn-taking.
Dùng checklist peer feedback sau mỗi vòng; ghi âm weekly để theo dõi filler ("uh", "like", "you know").
Email tóm tắt sau họp nhóm thể hiện kỹ năng giao tiếp chuyên nghiệp ngoài lớp.`,
	],

	'chapter-3-lesson-1': [
		`Unit 3: Presentation Skills & Cross-cultural Communication trang bị cách cấu trúc bài nói 6–8 phút, thiết kế slide hiệu quả và điều chỉnh phong cách giao tiếp khi làm việc với đối tác quốc tế. Sinh viên TDTU thường xuyên thuyết trình bằng tiếng Anh ở capstone review, club pitch và workshop employability. Bài lý thuyết này bao gồm signposting, xử lý Q&A và email etiquette trong bối cảnh văn hóa high-context (Việt Nam) vs low-context (Mỹ, Đức).`,

		`Presentation structure (6–8 minutes):

1. Hook — question, statistic, or short story
"Did you know that a single plastic bottle takes up to 450 years to decompose?"

2. Overview — preview main points
"Today I'll cover three points: why refill stations matter, estimated waste reduction, and actions students can take this semester."

3. Body — 2–3 main points with evidence
Use signposting: "First…", "Moving on to my second point…", "Finally…"

4. Summary — recap key message in one sentence
"Expanding refill stations is a low-cost step toward a cleaner campus."

5. Q&A closing
"Thank you for listening. I'm happy to take questions."

Delivery tips:
• Pace: slightly slower than conversation; pause after key statistics.
• Eye contact: scan the room, not the screen.
• Slides: one main idea per slide; font 24pt or larger; high contrast (WCAG).

Cross-cultural communication:
High-context cultures (Vietnam, Japan): indirect refusal, harmony, respect for hierarchy. "Maybe later" may mean "no."
Low-context cultures (US, Germany): direct feedback, explicit deadlines. Short emails are normal, not rude.

Email etiquette for international partners:
• Clear subject line: "Revised Report — Deadline Confirmation"
• Opening: "Dear [Name], I hope this email finds you well."
• Direct request with date: "Could you confirm receipt by Thursday 5 p.m.?"
• Avoid idioms: write "please revise" not "give it another shot."
• Close professionally: "Best regards, [Name], [Title/Program]"`,

		`Opening script — Sustainable campus initiative:
"Did you know that TDTU students discard over 15,000 plastic bottles on campus each month? Today I'll explain why we should expand water refill stations, how much waste we could reduce based on our student survey, and three simple habits you can start this week."

Handling Q&A:
Q: "Your data is from 2023. Is it still valid?"
A: "That's a fair question. The trend has continued according to our follow-up survey last month, though I agree we need updated official figures from facilities management."
Q: "Isn't installation too expensive?"
A: "The initial cost is significant, but one refill station replaces roughly 2,000 bottles per semester — the break-even point is about 18 months."

Cross-cultural email scenario:
Original (German partner, direct): "The report is unacceptable. Revise by Friday."
Vietnamese reading: rude and personal.
Professional response: "Thank you for your feedback. I will revise sections 2 and 3 and send an updated version by Friday 5 p.m. Could you specify which data points need correction?"
Diplomatic rewrite of direct message: "Please submit a revised report addressing the issues noted below by Friday."`,

		`Hook + cấu trúc rõ + slide tối giản = delivery chuyên nghiệp.
Signposting giúp audience và examiner theo dõi logic — đừng nhảy ý đột ngột.
Ma sát văn hóa thường do phong cách, không phải ý xấu — xác nhận bằng văn bản sau họp.
Rehearse aloud với timer; nhắm 10% dưới giới hạn thời gian để dành Q&A.`,
	],

	'chapter-3-lesson-2': [
		`Bài tập & vận dụng Unit 3 — thực hành mini-presentation 5 phút, nhận đánh giá từ bạn và chỉnh sửa một slide cho rõ ràng. Bạn cũng luyện kịch bản cross-cultural: diễn giải email trực tiếp, phản hồi lịch sự khi deadline mơ hồ ("Maybe later"). Rubric self/peer giúp bạn thấy điểm yếu ở content, organization, delivery hay visuals trước khi lên trình bày chính thức.`,

		`Mini-presentation assignment (5 minutes):

Topic choices:
(1) One habit that improved your English this semester
(2) A TDTU club or activity you recommend to freshmen
(3) One simple sustainability action students can take this week

Required elements:
• Hook in the first 20 seconds
• Three body points with one example each
• Summary sentence
• At least one visual slide (not a paragraph wall)

Rubric (self and peer):
Content 40% — accurate, relevant examples
Organization 25% — clear hook, body, summary
Delivery 20% — pace, eye contact, audible voice
Visuals 15% — readable text, one idea per slide

Rehearsal protocol:
Run 1 — record full delivery; note time and filler words.
Run 2 — cut weakest example if over time.
Run 3 — add pause before conclusion; target 10% under limit.

Culture response worksheet:
Situation 1: Partner says "Maybe later" to your deadline → follow up politely with a specific date and alternative.
Situation 2: Supervisor replies "Interesting idea" without approval → ask "What changes would you suggest before we proceed?"
Situation 3: Direct email feels harsh → reply with revision plan, not emotional escalation.

Professional email after presentation:
Subject: Thank you — Sustainability Club Info Session
"Dear Ms. Lan, Thank you for attending yesterday's session. As discussed, I am attaching the slide deck and a one-page summary of refill station locations. Please let me know if you need additional data for the student council proposal."`,

		`Sample slide — good vs bad:

Bad slide (avoid):
Title: "Everything about sustainability"
Body: 80-word paragraph explaining plastic waste, student surveys, cost analysis, and club plans in one block.

Good slide:
Title: "Benefit 2: Time Management"
Bullet 1: "Pomodoro blocks (25 min focus) reduce procrastination"
Bullet 2: "Students in our pilot group finished assignments 18% faster"
Simple icon or chart — you explain details aloud.

Rehearsal log example:
Run 1: 6:40 — cut long anecdote in section 2.
Run 2: 5:15 — added pause before "In conclusion."
Run 3: 4:55 — ready for class delivery.

Peer feedback exchange:
Reviewer A: "Your hook was strong, but slide 3 had too much text — I stopped listening to read."
Reviewer B: "You answered the Q&A confidently; try slowing down when stating statistics."`,

		`Cắt nội dung trước khi nói nhanh — examiner đánh giá clarity, không phải tốc độ.
Một ý một slide; bạn là presenter, slide chỉ hỗ trợ.
Theo dõi tín hiệu văn hóa mơ hồ ("Maybe later", "Interesting") bằng email xác nhận cụ thể.
Rehearsal log theo dõi tiến bộ qua từng lần chạy thử.`,
	],

	'chapter-4-lesson-1': [
		`Mock Interview with AI Examiner for TDTU Exit Test — bài ôn tập cho phần thi nói exit test. Giám khảo thường hỏi giới thiệu bản thân, thói quen học, kế hoạch tương lai và một câu tình huống. Câu trả lời cần trôi chảy, có cấu trúc, dài 45–90 giây mỗi câu — không học thuộc script robot. Bài này cung cấp khung STAR cho câu hỏi kinh nghiệm, mẫu Q&A và chiến lược làm rõ câu hỏi khi không nghe rõ.`,

		`Common exit test question types:

1. Self-introduction
Background, major, year, why you chose TDTU.

2. Daily life and study habits
Hobbies, routines, how you practice English outside class.

3. Academic experience
Favorite subject, group work, challenges overcome.

4. Future plans
Career goals, skills you want to develop in the next two years.

5. Situational / behavioral
"What would you do if…?" / "Describe a time when…"

Answer framework — STAR for experience questions:
Situation — set the context briefly
Task — what you needed to achieve
Action — specific steps you took
Result — outcome and what you learned

Language strategies:
• Extend answers: reason + example, not one-word replies.
• Buy thinking time: "That's an interesting question. Let me think for a moment."
• Clarify: "Could you please rephrase the question?" — better than guessing.
• End positively even when describing difficulty.

Exam conditions simulation:
45–90 seconds per answer | quiet room | no phone | record video to check posture and eye contact`,

		`Sample Q&A — exit test speaking:

Q: Tell me about yourself.
A: "My name is Minh, and I'm a third-year Information Technology student at TDTU. I chose this major because I enjoy solving practical problems with software. Outside class, I volunteer at the English club, which helps me practice speaking every week. I'm also learning how to work in international teams because I hope to join a global tech company after graduation."

Q: Describe a challenge you faced in teamwork.
A (STAR): "In our database project last semester, two members missed deadlines and we risked submitting late (Situation/Task). I suggested we split tasks in Trello and hold short daily check-ins on Zalo so everyone could report progress (Action). We submitted on time and received a B+, and I learned that early communication prevents conflict (Result)."

Q: What would you do if you disagreed with a teammate during a group presentation?
A: "I would listen to their view first, then explain my concern with a specific example. If we still disagree, I'd suggest we test both options with a quick audience poll or ask the lecturer for guidance. The goal is a clear presentation, not winning the argument."

Mock follow-up:
"What did you learn from that experience?"
→ "I learned that clear roles and short check-ins save time more than last-minute crisis meetings."`,

		`Chuẩn bị câu trả lời linh hoạt, không thuộc lòng cố định — giám khảo có thể interrupt hoặc hỏi follow-up.
STAR cho kinh nghiệm quá khứ; opinion + reason cho câu giả định.
Luyện với timer và quay video để kiểm tra body language và filler words.
Hỏi lại lịch sự khi không hiểu câu hỏi — tốt hơn trả lời sai ý.`,
	],
};

/**
 * Generate pilot-quality bodies for tdtu_english_comm lessons.
 * @param {object} lesson — lesson row from tdtu_english_comm.json
 * @returns {string[]} four section bodies [GIỚI THIỆU, LÝ THUYẾT, VÍ DỤ, TÓM TẮT]
 */
function generateEnglishLesson(lesson) {
	const { lesson_id: id, course_id: courseId } = lesson;

	if (courseId !== 'tdtu_english_comm') {
		throw new Error(`generateEnglishLesson only supports tdtu_english_comm, got ${courseId}`);
	}

	const bodies = LESSON_BODIES[id];
	if (!bodies) {
		const topic = topicFromLesson(lesson);
		const ch = chapterShort(lesson.chapter_title);
		throw new Error(`No pilot content for lesson ${id} (${topic} / ${ch})`);
	}

	const total = bodies.reduce((sum, b) => sum + wordCount(b), 0);
	if (total < 400 || total > 700) {
		console.warn(`[generate-english] ${id} (${topicFromLesson(lesson)}): ${total} words (target 400–700)`);
	}

	return bodies;
}

module.exports = generateEnglishLesson;
