'use strict';

const {
	topicFromLesson,
	chapterShort,
	isExamChapter,
	isPracticeLesson,
	isTheoryLesson,
} = require('./pilot-writer');

/** @type {Record<string, string[]>} */
const LESSONS = {
	'bk_chemistry:chapter-1-lesson-1': [
		`Hóa đại cương Bách Khoa bắt đầu từ mô hình nguyên tử hiện đại: electron không quay quanh hạt nhân theo quỹ đạo cố định mà chiếm các orbital — vùng không gian xác suất tìm thấy electron. Bốn số lượng tử (n, l, m, s) mô tả trạng thái electron; cấu hình electron giải thích tính chất hóa học, số hóa trị và khả năng tạo liên kết. Thuyết orbital phân tử (MO) mở rộng sang phân tử, giải thích vì sao O₂ có tính từ dù có liên kết đôi. Đây là nền tảng cho nhiệt hóa, điện hóa và động học ở các chương sau.`,
		`Bốn số lượng tử:
• n (số lượng tử chính): lớp electron, n = 1, 2, 3…; n càng lớn năng lượng càng cao.
• l (số lượng tử phụ): hình dạng orbital, 0 ≤ l ≤ n−1 (s: l=0, p: l=1, d: l=2, f: l=3).
• m (số lượng tử từ): hướng orbital, −l ≤ m ≤ l.
• s (spin): ±½.

Số orbital trên lớp n là n²; tối đa 2n² electron/lớp. Thứ tự điền electron (Klechkowski): 1s → 2s → 2p → 3s → 3p → 4s → 3d → 4p. Quy tắc Hund: trên các orbital cùng năng lượng, electron phân bố song song spin trước khi ghép cặp.

Thuyết MO: AO kết hợp → MO liên kết (σ, π) và phản liên kết (σ*, π*). Số thứ tự liên kết = (e⁻ liên kết − e⁻ phản liên kết)/2. O₂: cấu hình MO có 2 e⁻ đơn ở π*2p → paramagnetic.`,
		`Ví dụ 1 — Cấu hình Fe (Z=26):
Theo Klechkowski: 1s²2s²2p⁶3s²3p⁶4s²3d⁶.
Ion Fe²⁺: mất electron 4s trước → Fe²⁺: 1s²2s²2p⁶3s²3p⁶3d⁶.

Ví dụ 2 — Lớp n=3:
Có 3 subshell: 3s (2e), 3p (6e), 3d (10e) → tối đa 18 electron.

Ví dụ 3 — O₂ và MO:
(σ1s)²(σ*1s)²(σ2s)²(σ*2s)²(σ2p)²(π2p)⁴(π*2p)²
e⁻ liên kết = 8, e⁻ phản liên kết = 4 → số thứ tự liên kết = 2.
Có 2 e⁻ đơn ở π* → từ tính (thí nghiệm hút nam châm).

Bài tập: Viết cấu hình Cr (Z=24). Đáp án: 1s²2s²2p⁶3s²3p⁶4s¹3d⁵ (ngoại lệ bán ổn định).`,
		`Bốn số lượng tử xác định orbital và electron; Klechkowski + Hund cho cấu hình electron.
Thuyết MO giải thích liên kết đa, số thứ tự liên kết và tính từ/paramagnetic.
Nhớ ngoại lệ Cr (4s¹3d⁵), Cu (4s¹3d¹⁰) và quy tắc mất electron 4s trước 3d khi tạo ion kim loại.`,
	],
	'bk_chemistry:chapter-1-lesson-2': [
		`Nhiệt hóa học định lượng mức năng lượng thay đổi trong phản ứng. Định luật Hess cho phép tính ΔH° tổng từ tổng các bước trung gian — không phụ thuộc đường đi. Năng lượng tự do Gibbs G = H − TS kết hợp enthalpy và entropy, xác định tính tự phát: ΔG < 0 → phản ứng xảy ra tự phát ở điều kiện cho trước. Hai khái niệm này liên kết chặt với cân bằng hóa học, pin điện hóa và điện phân ở các bài sau.`,
		`Enthalpy phản ứng: ΔH°rxn = ΣnΔH°f(sản phẩm) − ΣmΔH°f(phản ứng).
Định luật Hess: ΔH°rxn = ΣΔH°(các bước) nếu phương trình tổng = tổng phương trình con (cùng trạng thái vật chất).

Năng lượng tự do Gibbs: ΔG = ΔH − TΔS.
Ở điều kiện chuẩn: ΔG° = ΔH° − TΔS°.
ΔG < 0: tự phát; ΔG = 0: cân bằng; ΔG > 0: không tự phát.

Liên hệ cân bằng: ΔG° = −RT ln K.
Nhiệt độ làm thay đổi ΔG qua hạng TΔS — phản ứng tăng entropy (ΔS > 0) được ưu tiên hơn khi T cao.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Hiệu ứng nhiệt (Định luật Hess) & Năng lượng tự do Gibbs với Cấu tạo nguyên tử, 4 số lượng tử & Thuyết MO: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ 1 — Hess:
Cho: C(s) + O₂(g) → CO₂(g), ΔH₁ = −393,5 kJ/mol
CO(g) + ½O₂(g) → CO₂(g), ΔH₂ = −283,0 kJ/mol
Tính ΔH cho C(s) + ½O₂(g) → CO(g).
Phương trình 1 − phương trình 2: ΔH = −393,5 − (−283,0) = −110,5 kJ/mol.

Ví dụ 2 — Gibbs:
ΔH° = −100 kJ, ΔS° = −50 J/K, T = 298 K.
ΔG° = −100000 − 298×(−50) = −100000 + 14900 = −85,1 kJ < 0 → tự phát ở 25°C.

Ví dụ 3 — K từ ΔG°:
ΔG° = −RT ln K → K = exp(−ΔG°/RT).
Nếu ΔG° = −5,7 kJ, T = 298 K: K ≈ exp(5700/(8,314×298)) ≈ 9,8.`,
		`Hess: cộng/trừ phương trình nhiệt hóa để tính ΔH° không đo trực tiếp.\\\\\\\\\\\\\\\\nGibbs: ΔG° = ΔH° − TΔS°; ΔG° = −RT ln K — cầu nối nhiệt động và cân bằng.\\\\\\\\\\\\\\\\nPhản ứng thu nhiệt (ΔH < 0) thường tự phát lạnh; phản ứng tăng S cần T cao hơn để ΔG < 0.`,
	],
	'bk_chemistry:chapter-2-lesson-1': [
		`Cân bằng axit-bazơ là trụ cột của hóa dung dịch. Độ axit pH = −log[H⁺] đo nồng độ ion hiđro; pOH = −log[OH⁻]; ở 25°C: pH + pOH = 14. Dung dịch đệm — hỗn hợp axit yếu và bazơ đồng hành (hoặc ngược lại) — duy trì pH gần không đổi khi thêm axit/bazơ nhỏ. Phương trình Henderson-Hasselbalch là công cụ tính pH đệm, ứng dụng trong sinh học, y học và phòng thí nghiệm.`,
		`Axit mạnh: HA → H⁺ + A⁻ hoàn toàn; pH = −log C (xấp xỉ, C ≥ 10⁻⁶ M).
Axit yếu: HA ⇌ H⁺ + A⁻; Ka = [H⁺][A⁻]/[HA].
pH axit yếu: [H⁺] ≈ √(Ka·C).

Bazơ yếu: B + H₂O ⇌ BH⁺ + OH⁻; Kb.
pOH ≈ √(Kb·C); pH = 14 − pOH.

Muối thủy phân: muối axit mạnh + bazơ yếu → pH > 7; axit yếu + bazơ mạnh → pH < 7.

Đệm: pH = pKa + log([A⁻]/[HA]) (Henderson-Hasselbalch).
Dung lượng đệm tối đa khi pH ≈ pKa (tỷ lệ [A⁻]/[HA] ≈ 1).
Đệm hiệu quả trong khoảng pKa ± 1.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Cân bằng Axit - Bazơ, pH dung dịch đệm với Nhiệt hóa học & Năng lượng tự do Gibbs: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ 1 — Axit yếu CH₃COOH:
Ka = 1,8×10⁻⁵, C = 0,10 M.
[H⁺] = √(1,8×10⁻⁵ × 0,10) = 1,34×10⁻³ M → pH = 2,87.

Ví dụ 2 — Đệm CH₃COOH/CH₃COO⁻:
pKa = 4,74; [A⁻]/[HA] = 2/1.
pH = 4,74 + log(2) = 4,74 + 0,30 = 5,04.

Ví dụ 3 — Trung hòa:
25,0 mL HCl 0,100 M + 25,0 mL NaOH 0,100 M → muối NaCl, pH ≈ 7.
25,0 mL CH₃COOH 0,100 M + 12,5 mL NaOH 0,100 M → nửa trung hòa → đệm, pH ≈ pKa = 4,74.`,
		`pH đo [H⁺]; axit/bazơ yếu dùng Ka, Kb và xấp xỉ bậc hai.\\\\\\\\\\\\\\\\nĐệm: Henderson-Hasselbalch pH = pKa + log([base]/[acid]); hiệu quả nhất tại pH ≈ pKa.\\\\\\\\\\\\\\\\nMuối thủy phân và điểm tương đương quyết định pH sau trung hòa.`,
	],
	'bk_chemistry:chapter-2-lesson-2': [
		`Điện hóa học nghiên cứu chuyển hóa năng lượng hóa học ↔ điện. Pin điện hóa tạo dòng điện từ phản ứng tự phát (ΔG < 0); điện phân dùng dòng ngoài để buộc phản ứng không tự phát. Thế điện cực chuẩn E° đo xu hướng khử/oxi hóa so với điện cực chuẩn hiđro (SHE). Phương trình Nernst tính thế điện cực ở nồng độ hoạt động bất kỳ — cơ sở cho pin lithium, ắc quy chì và cảm biến pH.`,
		`Ký hiệu: Anode (−) oxi hóa; Cathode (+) khử.
E°cell = E°cathode − E°anode > 0 cho pin tự phát.
ΔG° = −nFE°cell (F = 96485 C/mol).

Quy tắc: E° cao → dễ bị khử (chất oxi hóa mạnh); E° thấp → dễ bị oxi hóa.

Phương trình Nernst (25°C):
E = E° − (0,0592/n) log Q
Q = tích nồng độ sản phẩm / tích nồng độ phản ứng (khí: thay bằng áp suất).

Liên hệ: E°cell = (RT/nF) ln K ≈ (0,0592/n) log K ở 25°C.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Pin điện hóa, Thế điện cực chuẩn và Phương trình Nernst với Nhiệt hóa học & Năng lượng tự do Gibbs: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ 1 — Pin Daniell:
Zn(s) | Zn²⁺ || Cu²⁺ | Cu(s)
Anode: Zn → Zn²⁺ + 2e⁻ (E° = −0,76 V)
Cathode: Cu²⁺ + 2e⁻ → Cu (E° = +0,34 V)
E°cell = 0,34 − (−0,76) = 1,10 V.

Ví dụ 2 — Nernst:
Cu²⁺/Cu: E° = 0,34 V, [Cu²⁺] = 0,010 M, n = 2.
E = 0,34 − (0,0592/2) log(1/0,010) = 0,34 − 0,0592 = 0,28 V.

Ví dụ 3 — ΔG°:
E°cell = 1,10 V, n = 2: ΔG° = −2 × 96485 × 1,10 = −212 kJ/mol.

Ví dụ bổ sung Pin điện hóa, Thế điện cực chuẩn và Phương trình Nernst: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Pin: anode oxi hóa (−), cathode khử (+); E°cell = E°cathode − E°anode.\\\\\\\\\\\\\\\\nNernst: E = E° − (0,0592/n)log Q — thế phụ thuộc nồng độ.\\\\\\\\\\\\\\\\nΔG° = −nFE°cell; E°cell liên hệ hằng số cân bằng K.`,
	],
	'bk_chemistry:chapter-3-lesson-1': [
		`Động hóa học nghiên cứu tốc độ phản ứng — không chỉ "có xảy ra" mà "xảy ra nhanh hay chậm". Tốc độ v = −(1/ν)d[A]/dt đo biến thiên nồng độ theo thời gian. Phương trình tốc độ v = k[A]ᵐ[B]ⁿ với bậc m, n xác định từ thí nghiệm. Hằng số tốc độ k phụ thuộc nhiệt độ theo phương trình Arrhenius: k = A·e^(−Ea/RT), trong đó Ea là năng lượng hoạt hóa — rào cản năng lượng để phản ứng xảy ra.`,
		`Bậc phản ứng: tổng m + n (bậc tổng).
Bậc 0: v = k (tốc độ không đổi).
Bậc 1: v = k[A]; t₁/₂ = 0,693/k (phân rã bậc nhất).
Bậc 2: v = k[A]²; t₁/₂ = 1/(k[A]₀).

Phương trình Arrhenius:
k = A·e^(−Ea/RT)
ln k = ln A − Ea/(RT)
Dạng tuyến tính: ln k vs 1/T → độ dốc = −Ea/R.

Quy tắc van't Hoff: tăng T 10°C → k tăng khoảng gấp đôi (xấp xỉ, phụ thuộc Ea).
Xúc tác: giảm Ea, tăng k, không đổi ΔG° hay vị trí cân bằng.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Động hóa học & Năng lượng hoạt hóa Arrhenius với Động hóa học & Năng lượng hoạt hóa Arrhenius: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ 1 — Bậc 1:
[A]₀ = 0,50 M, k = 0,0693 min⁻¹.
t₁/₂ = 0,693/0,0693 = 10,0 min.
Sau 20 min (2 chu kỳ): [A] = 0,50/4 = 0,125 M.

Ví dụ 2 — Arrhenius:
Ở T₁: k₁ = 2,0×10⁻³ s⁻¹; T₂ = T₁ + 10 K, k₂ = 4,0×10⁻³ s⁻¹.
k₂/k₁ = 2 → Ea ≈ RT₁T₂×ln2/(T₂−T₁) (tính số).

Ví dụ 3 — Xác định bậc:
Gấp đôi [A] → tốc độ gấp 4 → bậc theo A = 2.
v = k[A]²[B], gấp đôi [B] → v gấp đôi → bậc B = 1 → bậc tổng = 3.`,
		`Tốc độ v = k[A]ᵐ[B]ⁿ; bậc 1 có t₁/₂ = 0,693/k không phụ thuộc [A]₀.\\\\\\\\\\\\\\\\nArrhenius: k = A·e^(−Ea/RT); ln k vs 1/T cho Ea.\\\\\\\\\\\\\\\\nXúc tác giảm Ea, tăng tốc độ mà không thay đổi cân bằng.`,
	],
	'bk_chemistry:chapter-3-lesson-2': [
		`Bài tập vận dụng động hóa học: xác định bậc phản ứng từ dữ liệu thí nghiệm, tính t₁/₂, hằng số tốc độ k và năng lượng hoạt hóa Ea từ phương trình Arrhenius. Các bài dạng đề thi Hóa đại cương Bách Khoa thường kết hợp đồ thị ln k – 1/T và suy luận cơ chế phản ứng.`,
		`Phương pháp ban đầu: đo v ở các [A]₀ khác nhau, giữ [B] không đổi → suy bậc theo A.
Phương pháp tích phân: đồ thị ln[A] vs t thẳng → bậc 1; 1/[A] vs t thẳng → bậc 2.
Phương pháp suy giảm: đo t₁/₂ ở các [A]₀ → t₁/₂ không đổi (bậc 1) hay tỷ lệ nghịch (bậc 2).

Arrhenius hai điểm: ln(k₂/k₁) = (Ea/R)(1/T₁ − 1/T₂).
Đơn vị: Ea thường tính J/mol, R = 8,314 J/(mol·K).

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Động hóa học & Năng lượng hoạt hóa Arrhenius với Động hóa học & Năng lượng hoạt hóa Arrhenius: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài 1 — Xác định bậc:
Thí nghiệm: [A] (M) | v (M/s): 0,10 | 2,0×10⁻⁴; 0,20 | 8,0×10⁻⁴; 0,40 | 3,2×10⁻³.
Gấp đôi [A] → v gấp 4 → bậc 2. v = k[A]².

Bài 2 — Phân rã bậc 1:
k = 0,0231 min⁻¹, [A]₀ = 1,00 M.
t₁/₂ = 0,693/0,0231 = 30,0 min.
Sau 60 min: [A] = 1,00 × (1/2)² = 0,25 M.

Bài 3 — Ea từ Arrhenius:
T₁ = 300 K, k₁ = 1,0×10⁻⁴; T₂ = 310 K, k₂ = 2,0×10⁻⁴.
ln(2) = (Ea/8,314)(1/300 − 1/310) → Ea ≈ 53,6 kJ/mol.

Ví dụ bổ sung Động hóa học & Năng lượng hoạt hóa Arrhenius: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Bậc: so sánh tỷ lệ thay đổi v khi đổi nồng độ, hoặc dùng đồ thị tích phân.\\\\\\\\\\\\\\\\nt₁/₂ bậc 1 = 0,693/k; bậc 2 = 1/(k[A]₀).\\\\\\\\\\\\\\\\nEa từ ln(k₂/k₁) = (Ea/R)(1/T₁ − 1/T₂).`,
	],
	'bk_chemistry:chapter-4-lesson-1': [
		`Cân bằng hóa học xảy ra trong phản ứng thuận nghịch khi tốc độ thuận bằng tốc độ nghịch. Hằng số cân bằng K biểu thị tỷ lệ nồng độ (hoặc áp suất) sản phẩm/phản ứng ở cân bằng. Nguyên lý Le Châtelier: hệ cân bằng dịch chuyển để chống lại sự thay đổi nồng độ, áp suất hoặc nhiệt độ. Kết hợp với Ksp (tích số tan) giải thích kết tủa và hiệu ứng ion chung.`,
		`aA + bB ⇌ cC + dD
Kc = [C]ᶜ[D]ᵈ/([A]ᵃ[B]ᵇ) (chỉ số cân bằng).
Khí: Kp = Kc(RT)^Δn, Δn = (c+d) − (a+b).

Q (hệ số phản ứng): cùng dạng K nhưng nồng độ hiện tại.
Q < K → phản ứng thuận; Q > K → phản ứng nghịch; Q = K → cân bằng.

Le Châtelier:
• Tăng [chất] → dịch chuyển giảm chất đó.
• Tăng P (khí) → dịch về phía ít mol khí.
• Tăng T → dịch theo hướng thu nhiệt (ΔH > 0: thuận; ΔH < 0: nghịch).

Ksp: AxBy(s) ⇌ xA^y+ + yB^x−; Ksp = [A]^x[B]^y.
Q > Ksp → kết tủa.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Cân bằng dung dịch, pH & Điện hóa học với Cân bằng dung dịch, pH & Điện hóa học: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ 1 — Kc:
N₂ + 3H₂ ⇌ 2NH₃, Kc = 0,50. Ban đầu [N₂]=[H₂]=1,0 M, [NH₃]=0.
Q = 0 < K → phản ứng thuận. Ở cân bằng: [N₂]=0,68, [H₂]=2,04, [NH₃]=0,64 M (giải hệ).

Ví dụ 2 — Le Châtelier:
N₂O₄ ⇌ 2NO₂, ΔH > 0 (thu nhiệt).
Tăng T → tăng [NO₂]. Tăng P → dịch về N₂O₄ (ít mol khí).

Ví dụ 3 — Ksp AgCl:
Ksp = 1,8×10⁻¹⁰. Trong nước: [Ag⁺] = [Cl⁻] = √(Ksp) = 1,34×10⁻⁵ M.
Thêm NaCl 0,10 M: [Cl⁻] ≈ 0,10 → [Ag⁺] = Ksp/0,10 = 1,8×10⁻⁹ M (hiệu ứng ion chung).`,
		`K mô tả vị trí cân bằng; Q so với K xác định chiều phản ứng.\\\\\\\\\\\\\\\\nLe Châtelier: hệ chống lại biến đổi nồng độ, áp suất, nhiệt độ.\\\\\\\\\\\\\\\\nKsp và hiệu ứng ion chung điều khiển kết tủa trong dung dịch.`,
	],
	'bk_chemistry:chapter-4-lesson-2': [
		`Bài tập cân bằng hóa học: tính K, nồng độ cân bằng bằng bảng ICE (Initial–Change–Equilibrium), dự đoán dịch chuyển cân bằng theo Le Châtelier và bài toán kết tủa Ksp. Đây là dạng trọng tâm đề thi Hóa đại cương. Môn Hóa đại cương đánh giá khả năng vận dụng Cân bằng dung dịch, pH & Điện hóa học qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Bảng ICE:
• Initial: nồng độ ban đầu.
• Change: −ax, −bx, +cx, +dx (x = mức phản ứng).
• Equilibrium: initial + change.
Thay vào K, giải x (xấp xỉ nếu K nhỏ và x << initial).

Kết hợp Kp–Kc: Kp = Kc(RT)^Δn.
Liên hệ nhiệt động: ΔG° = −RT ln K.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Cân bằng dung dịch, pH & Điện hóa học với Cân bằng dung dịch, pH & Điện hóa học: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Cân bằng dung dịch, pH & Điện hóa học với Cân bằng dung dịch, pH & Điện hóa học: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài 1 — ICE:
HA ⇌ H⁺ + A⁻, Ka = 1,0×10⁻⁵, C₀ = 0,10 M.
ICE: 0,10−x | x | x; Ka = x²/(0,10−x) ≈ x²/0,10.
x = √(10⁻⁶) = 10⁻³ M → pH = 3,00.

Bài 2 — Kp:
2SO₂ + O₂ ⇌ 2SO₃, Kp = 2,0×10² ở 700 K.
P(SO₂)=0,50 atm, P(O₂)=0,25 atm, P(SO₃)=1,0 atm.
Qp = (1,0)²/(0,50²×0,25) = 16; Qp < Kp → phản ứng thuận.

Bài 3 — Ksp:
PbI₂, Ksp = 7,1×10⁻⁹. [I⁻] = 0,020 M (từ KI).
Q = [Pb²⁺][I⁻]²; cần [Pb²⁺] > Ksp/(0,020)² = 1,78×10⁻⁵ M mới kết tủa.

Ví dụ bổ sung Cân bằng dung dịch, pH & Điện hóa học: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`ICE: ghi Initial–Change–Equilibrium, thay vào K, giải x.\\\\\\\\\\\\\\\\nQ vs K: Q < K thuận, Q > K nghịch.\\\\\\\\\\\\\\\\nKsp: Q > Ksp thì kết tủa; ion chung làm giảm độ tan.`,
	],
	'bk_chemistry:chapter-5-lesson-1': [
		`Đề thi trắc nghiệm Hóa đại cương HCMUT (Bách Khoa) gồm khoảng 40–50 câu trong 60–90 phút, bao phủ toàn bộ chương trình: cấu tạo nguyên tử, nhiệt hóa, cân bằng, điện hóa, động học. Câu hỏi dạng tính toán chiếm 40–50%, phần còn lại lý thuyết và suy luận. Điểm đạt thường ≥ 5,0/10; câu khó phân loại ở mức 8–10 điểm.`,
		`Cấu trúc đề thường gặp:
• Phần 1 (10–15 câu): Cấu hình electron, số lượng tử, MO, bán kính, IE, EA.
• Phần 2 (10 câu): ΔH (Hess), ΔG, entropy, tự phát.
• Phần 3 (10 câu): pH, đệm, Ka/Kb, trung hòa.
• Phần 4 (10 câu): E°cell, Nernst, điện phân.
• Phần 5 (5–10 câu): Tốc độ, Arrhenius, K, Ksp, Le Châtelier.

Chiến lược: làm câu dễ trước; ghi công thức lên giấy nháp; kiểm tra đơn vị (kJ vs J, M vs mol/L).

Phản ứng oxi hóa-khử: số oxi hóa thay đổi; cân bằng electron. Nồng độ mol/L (M) là đơn vị chuẩn trong tính pH và K. Nhiệt độ Kelvin = °C + 273,15 — bắt buộc trong công thức nhiệt động. Độ tan Ksp liên hệ trực tiếp với kết tủa trong dung dịch muối kém tan.

Liên hệ Đề thi trắc nghiệm Hóa đại cương HCMUT với Đề thi trắc nghiệm Hóa đại cương HCMUT: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Câu mẫu 1 — Cấu hình:
Nguyên tố có Z=29, ion M²⁺ có bao nhiêu electron lẻ ở lớp 3d?
Cu: 4s¹3d¹⁰ → Cu²⁺: 3d⁹ → 1 electron lẻ 3d. Đáp án: 1.

Câu mẫu 2 — Gibbs:
ΔH° = +50 kJ, ΔS° = +200 J/K, T = 298 K.
ΔG° = 50000 − 298×200 = −9600 J < 0 → tự phát. Đáp án: Có.

Câu mẫu 3 — Nernst:
E°(Cu²⁺/Cu) = 0,34 V, [Cu²⁺] = 0,0010 M.
E = 0,34 − (0,0592/2)log(1/0,001) = 0,34 − 0,089 = 0,25 V.

Câu mẫu 4 — Ksp:
Ksp(Ag₂CrO₄) = 1,1×10⁻¹². [CrO₄²⁻] trong nước tinh khiết?
2Ag⁺ + CrO₄²⁻; Ksp = 4s³ → s = ∛(Ksp/4) ≈ 6,5×10⁻⁵ M.

Ví dụ bổ sung Đề thi trắc nghiệm Hóa đại cương HCMUT: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Đề BK: 40–50 câu, trọng tâm tính toán pH, nhiệt động, điện hóa, cân bằng.\\\\\\\\\\\\\\\\nÔn theo chủ đề + đề cũ; nhớ công thức Nernst, Henderson, Arrhenius, ICE.\\\\\\\\\\\\\\\\nQuản lý thời gian: ~1,5 phút/câu trắc nghiệm tính.`,
	],
	'bk_programming:chapter-1-lesson-1': [
		`Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O là nội dung cốt lõi trong chương «Biến, Kiểu dữ liệu, Toán tử & I/O» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O:
int, float, double, char; scanf/printf.
Toán tử ưu tiên; ép kiểu.
& cho scanf.
Áp dụng Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O trong Biến, Kiểu dữ liệu, Toán tử & I/O.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Biến, Kiểu dữ liệu, Toán tử & I/O, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O:
Diện tích r=5 → S=78,54.
a=5,b=2: a/b=2, a%b=1.
Bài tập mở rộng Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Kiểu dữ liệu, Biến, Toán tử và Nhập xuất chuẩn I/O:
scanf cần &; chia int→int.
Liên kết Biến, Kiểu dữ liệu, Toán tử & I/O.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-1-lesson-2': [
		`Cấu trúc rẽ nhánh if-else và Vòng lặp for, while là nội dung cốt lõi trong chương «Biến, Kiểu dữ liệu, Toán tử & I/O» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Cấu trúc rẽ nhánh if-else và Vòng lặp for, while trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Cấu trúc rẽ nhánh if-else và Vòng lặp for, while thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Cấu trúc rẽ nhánh if-else và Vòng lặp for, while:
int, float, double, char; scanf/printf.
Toán tử ưu tiên; ép kiểu.
& cho scanf.
Áp dụng Cấu trúc rẽ nhánh if-else và Vòng lặp for, while trong Biến, Kiểu dữ liệu, Toán tử & I/O.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Biến, Kiểu dữ liệu, Toán tử & I/O, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Cấu trúc rẽ nhánh if-else và Vòng lặp for, while:
Diện tích r=5 → S=78,54.
a=5,b=2: a/b=2, a%b=1.
Bài tập mở rộng Cấu trúc rẽ nhánh if-else và Vòng lặp for, while.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Cấu trúc rẽ nhánh if-else và Vòng lặp for, while:
scanf cần &; chia int→int.
Liên kết Biến, Kiểu dữ liệu, Toán tử & I/O.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-2-lesson-1': [
		`Truyền tham trị & Tham chiếu trong C/C++ là nội dung cốt lõi trong chương «Cấu trúc rẽ nhánh if-else & Vòng lặp» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Truyền tham trị & Tham chiếu trong C/C++ trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Truyền tham trị & Tham chiếu trong C/C++ thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Truyền tham trị & Tham chiếu trong C/C++:
if/else/switch; for/while.
break/continue.
Áp dụng Truyền tham trị & Tham chiếu trong C/C++ trong Cấu trúc rẽ nhánh if-else & Vòng lặp.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cấu trúc rẽ nhánh if-else & Vòng lặp, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Truyền tham trị & Tham chiếu trong C/C++ với Cấu trúc rẽ nhánh if-else & Vòng lặp: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Truyền tham trị & Tham chiếu trong C/C++:
Số nguyên tố: thử i đến √n.
Tổng 1..n=5050 (n=100).
Bài tập mở rộng Truyền tham trị & Tham chiếu trong C/C++.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Truyền tham trị & Tham chiếu trong C/C++:
Test biên n=0,1.
Liên kết Cấu trúc rẽ nhánh if-else & Vòng lặp.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-2-lesson-2': [
		`Con trỏ, Địa chỉ ô nhớ, Mảng và Struct là nội dung cốt lõi trong chương «Cấu trúc rẽ nhánh if-else & Vòng lặp» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Con trỏ, Địa chỉ ô nhớ, Mảng và Struct trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Con trỏ, Địa chỉ ô nhớ, Mảng và Struct thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Con trỏ, Địa chỉ ô nhớ, Mảng và Struct:
if/else/switch; for/while.
break/continue.
Áp dụng Con trỏ, Địa chỉ ô nhớ, Mảng và Struct trong Cấu trúc rẽ nhánh if-else & Vòng lặp.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cấu trúc rẽ nhánh if-else & Vòng lặp, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Con trỏ, Địa chỉ ô nhớ, Mảng và Struct với Cấu trúc rẽ nhánh if-else & Vòng lặp: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Con trỏ, Địa chỉ ô nhớ, Mảng và Struct:
Số nguyên tố: thử i đến √n.
Tổng 1..n=5050 (n=100).
Bài tập mở rộng Con trỏ, Địa chỉ ô nhớ, Mảng và Struct.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Con trỏ, Địa chỉ ô nhớ, Mảng và Struct:
Test biên n=0,1.
Liên kết Cấu trúc rẽ nhánh if-else & Vòng lặp.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-2-lesson-3': [
		`Cấp phát bộ nhớ động (new/delete, malloc/free) là nội dung cốt lõi trong chương «Cấu trúc rẽ nhánh if-else & Vòng lặp» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Cấp phát bộ nhớ động (new/delete, malloc/free) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Cấp phát bộ nhớ động (new/delete, malloc/free) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Cấp phát bộ nhớ động (new/delete, malloc/free):
if/else/switch; for/while.
break/continue.
Áp dụng Cấp phát bộ nhớ động (new/delete, malloc/free) trong Cấu trúc rẽ nhánh if-else & Vòng lặp.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cấu trúc rẽ nhánh if-else & Vòng lặp, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Cấp phát bộ nhớ động (new/delete, malloc/free) với Cấu trúc rẽ nhánh if-else & Vòng lặp: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Cấp phát bộ nhớ động (new/delete, malloc/free):
Số nguyên tố: thử i đến √n.
Tổng 1..n=5050 (n=100).
Bài tập mở rộng Cấp phát bộ nhớ động (new/delete, malloc/free).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Cấp phát bộ nhớ động (new/delete, malloc/free):
Test biên n=0,1.
Liên kết Cấu trúc rẽ nhánh if-else & Vòng lặp.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-3-lesson-1': [
		`Hàm, Đệ quy & Mảng 1D/2D là nội dung cốt lõi trong chương «Hàm, Đệ quy & Mảng 1D/2D» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Hàm, Đệ quy & Mảng 1D/2D trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Hàm, Đệ quy & Mảng 1D/2D thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Hàm, Đệ quy & Mảng 1D/2D:
Base case; binary search O(log n).
Mảng 2D hai vòng for.
Áp dụng Hàm, Đệ quy & Mảng 1D/2D trong Hàm, Đệ quy & Mảng 1D/2D.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Hàm, Đệ quy & Mảng 1D/2D, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Hàm, Đệ quy & Mảng 1D/2D với Hàm, Đệ quy & Mảng 1D/2D: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Hàm, Đệ quy & Mảng 1D/2D:
fact(5)=120; bs tìm 5.
Bài tập mở rộng Hàm, Đệ quy & Mảng 1D/2D.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Hàm, Đệ quy & Mảng 1D/2D:
Đệ quy + mảng sorted.
Liên kết Hàm, Đệ quy & Mảng 1D/2D.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-3-lesson-2': [
		`Bài tập vận dụng Hàm, Đệ quy & Mảng 1D/2D (Hàm, Đệ quy & Mảng 1D/2D). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Nhập môn lập trình đánh giá khả năng vận dụng Hàm, Đệ quy & Mảng 1D/2D qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Hàm, Đệ quy & Mảng 1D/2D:
Đọc đề Hàm, Đệ quy & Mảng 1D/2D.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Hàm, Đệ quy & Mảng 1D/2D với Hàm, Đệ quy & Mảng 1D/2D: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Hàm, Đệ quy & Mảng 1D/2D.
Bài 2 đổi số.
Bài 3 tổng hợp Hàm, Đệ quy & Mảng 1D/2D.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Hàm, Đệ quy & Mảng 1D/2D: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Hàm, Đệ quy & Mảng 1D/2D:
Luyện 5 bài Hàm, Đệ quy & Mảng 1D/2D.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-4-lesson-1': [
		`Con trỏ & Cấp phát bộ nhớ động là nội dung cốt lõi trong chương «Con trỏ & Cấp phát bộ nhớ động» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Con trỏ & Cấp phát bộ nhớ động trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Con trỏ & Cấp phát bộ nhớ động thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Con trỏ & Cấp phát bộ nhớ động:
*p dereference; arr[i]=*(arr+i).
struct . và ->
Áp dụng Con trỏ & Cấp phát bộ nhớ động trong Con trỏ & Cấp phát bộ nhớ động.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Con trỏ & Cấp phát bộ nhớ động, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Con trỏ & Cấp phát bộ nhớ động với Con trỏ & Cấp phát bộ nhớ động: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Con trỏ & Cấp phát bộ nhớ động:
Đảo mảng; struct SV.
Bài tập mở rộng Con trỏ & Cấp phát bộ nhớ động.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Con trỏ & Cấp phát bộ nhớ động:
Mảng ≡ con trỏ.
Liên kết Con trỏ & Cấp phát bộ nhớ động.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-4-lesson-2': [
		`Bài tập vận dụng Con trỏ & Cấp phát bộ nhớ động (Con trỏ & Cấp phát bộ nhớ động). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Con trỏ & Cấp phát bộ nhớ động:
Đọc đề Con trỏ & Cấp phát bộ nhớ động.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Con trỏ & Cấp phát bộ nhớ động với Con trỏ & Cấp phát bộ nhớ động: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Con trỏ & Cấp phát bộ nhớ động.
Bài 2 đổi số.
Bài 3 tổng hợp Con trỏ & Cấp phát bộ nhớ động.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Con trỏ & Cấp phát bộ nhớ động: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Con trỏ & Cấp phát bộ nhớ động:
Luyện 5 bài Con trỏ & Cấp phát bộ nhớ động.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-5-lesson-1': [
		`Chuỗi ký tự, Struct & File I/O là nội dung cốt lõi trong chương «Chuỗi ký tự, Struct & File I/O» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Chuỗi ký tự, Struct & File I/O trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Chuỗi ký tự, Struct & File I/O thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Chuỗi ký tự, Struct & File I/O:
Công thức và định nghĩa Chuỗi ký tự, Struct & File I/O.
Áp dụng Chuỗi ký tự, Struct & File I/O trong Chuỗi ký tự, Struct & File I/O.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Chuỗi ký tự, Struct & File I/O, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Chuỗi ký tự, Struct & File I/O với Chuỗi ký tự, Struct & File I/O: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Chuỗi ký tự, Struct & File I/O:
Ví dụ Chuỗi ký tự, Struct & File I/O với số liệu.
Bài tập mở rộng Chuỗi ký tự, Struct & File I/O.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Chuỗi ký tự, Struct & File I/O:
Thuộc Chuỗi ký tự, Struct & File I/O.
Liên kết Chuỗi ký tự, Struct & File I/O.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-5-lesson-2': [
		`Bài tập vận dụng Chuỗi ký tự, Struct & File I/O (Chuỗi ký tự, Struct & File I/O). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Nhập môn lập trình đánh giá khả năng vận dụng Chuỗi ký tự, Struct & File I/O qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Chuỗi ký tự, Struct & File I/O:
Đọc đề Chuỗi ký tự, Struct & File I/O.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Chuỗi ký tự, Struct & File I/O với Chuỗi ký tự, Struct & File I/O: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Chuỗi ký tự, Struct & File I/O.
Bài 2 đổi số.
Bài 3 tổng hợp Chuỗi ký tự, Struct & File I/O.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Chuỗi ký tự, Struct & File I/O: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Chuỗi ký tự, Struct & File I/O:
Luyện 5 bài Chuỗi ký tự, Struct & File I/O.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_programming:chapter-6-lesson-1': [
		`Bộ bài tập Coding thực hành Bách Khoa là nội dung cốt lõi trong chương «Bộ bài tập Coding thực hành Bách Khoa» (Nhập môn lập trình). Bài học giải thích khái niệm, ký hiệu và vai trò của Bộ bài tập Coding thực hành Bách Khoa trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Bộ bài tập Coding thực hành Bách Khoa thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Bộ bài tập Coding thực hành Bách Khoa:
Công thức và định nghĩa Bộ bài tập Coding thực hành Bách Khoa.
Áp dụng Bộ bài tập Coding thực hành Bách Khoa trong Bộ bài tập Coding thực hành Bách Khoa.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Bộ bài tập Coding thực hành Bách Khoa, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Biên dịch C tạo file thực thi; lỗi cú pháp bắt ở compile, lỗi logic ở runtime. Hằng số #define và const. Hàm main trả 0 khi thành công. Định dạng printf: %.2f làm tròn 2 chữ số thập phân. Mảng tĩnh kích thước cố định; mảng động khi n nhập từ bàn phím.

Liên hệ Bộ bài tập Coding thực hành Bách Khoa với Bộ bài tập Coding thực hành Bách Khoa: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Bộ bài tập Coding thực hành Bách Khoa:
Ví dụ Bộ bài tập Coding thực hành Bách Khoa với số liệu.
Bài tập mở rộng Bộ bài tập Coding thực hành Bách Khoa.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Bộ bài tập Coding thực hành Bách Khoa:
Thuộc Bộ bài tập Coding thực hành Bách Khoa.
Liên kết Bộ bài tập Coding thực hành Bách Khoa.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-1-lesson-1': [
		`Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến là nội dung cốt lõi trong chương «Động học & Động lực học chất điểm» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến:
Công thức và định nghĩa Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến.
Áp dụng Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến trong Động học & Động lực học chất điểm.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Động học & Động lực học chất điểm, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến:
Ví dụ Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến với số liệu.
Bài tập mở rộng Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến:
Thuộc Phương trình chuyển động, Vận tốc, Gia tiếp tuyến & pháp tuyến.
Liên kết Động học & Động lực học chất điểm.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-1-lesson-2': [
		`Các định luật Newton & Định lý động lượng là nội dung cốt lõi trong chương «Động học & Động lực học chất điểm» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Các định luật Newton & Định lý động lượng trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Các định luật Newton & Định lý động lượng thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Các định luật Newton & Định lý động lượng:
Công thức và định nghĩa Các định luật Newton & Định lý động lượng.
Áp dụng Các định luật Newton & Định lý động lượng trong Động học & Động lực học chất điểm.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Động học & Động lực học chất điểm, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Các định luật Newton & Định lý động lượng:
Ví dụ Các định luật Newton & Định lý động lượng với số liệu.
Bài tập mở rộng Các định luật Newton & Định lý động lượng.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Các định luật Newton & Định lý động lượng:
Thuộc Các định luật Newton & Định lý động lượng.
Liên kết Động học & Động lực học chất điểm.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-2-lesson-1': [
		`Mômen lực, Mômen quán tính & Định lý Huygens-Steiner là nội dung cốt lõi trong chương «Cơ học Vật rắn & Mômen quán tính» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Mômen lực, Mômen quán tính & Định lý Huygens-Steiner trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Mômen lực, Mômen quán tính & Định lý Huygens-Steiner thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Mômen lực, Mômen quán tính & Định lý Huygens-Steiner:
Công thức và định nghĩa Mômen lực, Mômen quán tính & Định lý Huygens-Steiner.
Áp dụng Mômen lực, Mômen quán tính & Định lý Huygens-Steiner trong Cơ học Vật rắn & Mômen quán tính.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cơ học Vật rắn & Mômen quán tính, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Mômen lực, Mômen quán tính & Định lý Huygens-Steiner:
Ví dụ Mômen lực, Mômen quán tính & Định lý Huygens-Steiner với số liệu.
Bài tập mở rộng Mômen lực, Mômen quán tính & Định lý Huygens-Steiner.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Mômen lực, Mômen quán tính & Định lý Huygens-Steiner:
Thuộc Mômen lực, Mômen quán tính & Định lý Huygens-Steiner.
Liên kết Cơ học Vật rắn & Mômen quán tính.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-2-lesson-2': [
		`Phương trình cơ bản chuyển động quay của vật rắn là nội dung cốt lõi trong chương «Cơ học Vật rắn & Mômen quán tính» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Phương trình cơ bản chuyển động quay của vật rắn trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Phương trình cơ bản chuyển động quay của vật rắn thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Phương trình cơ bản chuyển động quay của vật rắn:
Công thức và định nghĩa Phương trình cơ bản chuyển động quay của vật rắn.
Áp dụng Phương trình cơ bản chuyển động quay của vật rắn trong Cơ học Vật rắn & Mômen quán tính.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cơ học Vật rắn & Mômen quán tính, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Phương trình cơ bản chuyển động quay của vật rắn:
Ví dụ Phương trình cơ bản chuyển động quay của vật rắn với số liệu.
Bài tập mở rộng Phương trình cơ bản chuyển động quay của vật rắn.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Phương trình cơ bản chuyển động quay của vật rắn:
Thuộc Phương trình cơ bản chuyển động quay của vật rắn.
Liên kết Cơ học Vật rắn & Mômen quán tính.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-3-lesson-1': [
		`Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt là nội dung cốt lõi trong chương «Dao động cơ & Sóng cơ học» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt:
Công thức và định nghĩa Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt.
Áp dụng Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt trong Dao động cơ & Sóng cơ học.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Dao động cơ & Sóng cơ học, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt:
Ví dụ Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt với số liệu.
Bài tập mở rộng Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt:
Thuộc Nguyên lý 1: Đẳng nhiệt, đẳng tích, đẳng áp, đoạn nhiệt.
Liên kết Dao động cơ & Sóng cơ học.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-3-lesson-2': [
		`Nguyên lý 2: Chu trình Carnot & Tính toán Entropy là nội dung cốt lõi trong chương «Dao động cơ & Sóng cơ học» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Nguyên lý 2: Chu trình Carnot & Tính toán Entropy trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Nguyên lý 2: Chu trình Carnot & Tính toán Entropy thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Nguyên lý 2: Chu trình Carnot & Tính toán Entropy:
Công thức và định nghĩa Nguyên lý 2: Chu trình Carnot & Tính toán Entropy.
Áp dụng Nguyên lý 2: Chu trình Carnot & Tính toán Entropy trong Dao động cơ & Sóng cơ học.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Dao động cơ & Sóng cơ học, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Nguyên lý 2: Chu trình Carnot & Tính toán Entropy:
Ví dụ Nguyên lý 2: Chu trình Carnot & Tính toán Entropy với số liệu.
Bài tập mở rộng Nguyên lý 2: Chu trình Carnot & Tính toán Entropy.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Nguyên lý 2: Chu trình Carnot & Tính toán Entropy:
Thuộc Nguyên lý 2: Chu trình Carnot & Tính toán Entropy.
Liên kết Dao động cơ & Sóng cơ học.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-4-lesson-1': [
		`Nhiệt động lực học (Nguyên lý 1 & 2) là nội dung cốt lõi trong chương «Nhiệt động lực học (Nguyên lý 1 & 2)» (Vật lý Đại cương 1). Bài học giải thích khái niệm, ký hiệu và vai trò của Nhiệt động lực học (Nguyên lý 1 & 2) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Nhiệt động lực học (Nguyên lý 1 & 2) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Nhiệt động lực học (Nguyên lý 1 & 2):
Công thức và định nghĩa Nhiệt động lực học (Nguyên lý 1 & 2).
Áp dụng Nhiệt động lực học (Nguyên lý 1 & 2) trong Nhiệt động lực học (Nguyên lý 1 & 2).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Nhiệt động lực học (Nguyên lý 1 & 2), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Nhiệt động lực học (Nguyên lý 1 & 2):
Ví dụ Nhiệt động lực học (Nguyên lý 1 & 2) với số liệu.
Bài tập mở rộng Nhiệt động lực học (Nguyên lý 1 & 2).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Nhiệt động lực học (Nguyên lý 1 & 2):
Thuộc Nhiệt động lực học (Nguyên lý 1 & 2).
Liên kết Nhiệt động lực học (Nguyên lý 1 & 2).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-4-lesson-2': [
		`Bài tập vận dụng Nhiệt động lực học (Nguyên lý 1 & 2) (Nhiệt động lực học (Nguyên lý 1 & 2)). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Nhiệt động lực học (Nguyên lý 1 & 2):
Đọc đề Nhiệt động lực học (Nguyên lý 1 & 2).
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Hệ SI: mét, kilogram, giây. Vector: cộng theo quy tắc hình bình hành. Công W = F·d·cosθ. Công suất P = F·v. Moment động lượng L = r×p bảo toàn khi Στ_ext = 0. Dao động điều hòa: x = A cos(ωt + φ), T = 2π/ω.

Liên hệ Nhiệt động lực học (Nguyên lý 1 & 2) với Nhiệt động lực học (Nguyên lý 1 & 2): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Nhiệt động lực học (Nguyên lý 1 & 2).
Bài 2 đổi số.
Bài 3 tổng hợp Nhiệt động lực học (Nguyên lý 1 & 2).

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Nhiệt động lực học (Nguyên lý 1 & 2): thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Nhiệt động lực học (Nguyên lý 1 & 2):
Luyện 5 bài Nhiệt động lực học (Nguyên lý 1 & 2).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_physics:chapter-5-lesson-1': [
		`Ôn thi Vật lý Đại cương 1 — Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa (Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa). Đề thi đại học kỹ thuật thường gồm trắc nghiệm lý thuyết và bài tập tính toán/viết code. Thời gian 60–120 phút tùy môn. Sinh viên cần nắm công thức cốt lõi, luyện đề cũ và phân bổ thời gian hợp lý: làm câu quen trước, ghi công thức lên nháp, kiểm tra đơn vị trước khi chọn đáp án.`,
		`Cấu trúc đề và trọng tâm Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa:
Đề Vật lý Đại cương 1: lý thuyết + tính toán Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa.
Thời gian 60–120 phút.
Trọng tâm Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa.

Chiến lược: (1) quét nhanh toàn đề, đánh dấu câu dễ; (2) làm phần tính trước nếu tự tin; (3) dành 10 phút cuối kiểm tra đơn vị và câu chưa làm.

Hệ SI: mét, kilogram, giây. Vector: cộng theo quy tắc hình bình hành. Công W = F·d·cosθ. Công suất P = F·v. Moment động lượng L = r×p bảo toàn khi Στ_ext = 0. Dao động điều hòa: x = A cos(ωt + φ), T = 2π/ω.

Liên hệ Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa với Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Câu hỏi mẫu Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa:
Câu lý thuyết Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa.
Câu tính thay số.
Câu tổng hợp Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa.

Với mỗi câu mẫu, tự biến thể: đổi số liệu, thêm điều kiện, hoặc hỏi ngược (cho kết quả tìm đầu vào).

Ví dụ bổ sung Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa:
Ôn đề cũ Bộ đề thi trắc nghiệm Vật lý 1 Bách Khoa.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-1-lesson-1': [
		`Ma trận, Định thức & Hệ phương trình là nội dung cốt lõi trong chương «Ma trận, Định thức & Hệ phương trình» (Đại số tuyến tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Ma trận, Định thức & Hệ phương trình trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Ma trận, Định thức & Hệ phương trình thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Ma trận, Định thức & Hệ phương trình:
Công thức và định nghĩa Ma trận, Định thức & Hệ phương trình.
Áp dụng Ma trận, Định thức & Hệ phương trình trong Ma trận, Định thức & Hệ phương trình.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Ma trận, Định thức & Hệ phương trình, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Ma trận, Định thức & Hệ phương trình với Ma trận, Định thức & Hệ phương trình: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Ma trận, Định thức & Hệ phương trình:
Ví dụ Ma trận, Định thức & Hệ phương trình với số liệu.
Bài tập mở rộng Ma trận, Định thức & Hệ phương trình.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Ma trận, Định thức & Hệ phương trình:
Thuộc Ma trận, Định thức & Hệ phương trình.
Liên kết Ma trận, Định thức & Hệ phương trình.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-1-lesson-2': [
		`Bài tập vận dụng Ma trận, Định thức & Hệ phương trình (Ma trận, Định thức & Hệ phương trình). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Ma trận, Định thức & Hệ phương trình:
Đọc đề Ma trận, Định thức & Hệ phương trình.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Ma trận, Định thức & Hệ phương trình với Ma trận, Định thức & Hệ phương trình: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Ma trận, Định thức & Hệ phương trình.
Bài 2 đổi số.
Bài 3 tổng hợp Ma trận, Định thức & Hệ phương trình.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Ma trận, Định thức & Hệ phương trình: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Ma trận, Định thức & Hệ phương trình:
Luyện 5 bài Ma trận, Định thức & Hệ phương trình.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-2-lesson-1': [
		`Không gian Vector & Cơ sở, Số chiều là nội dung cốt lõi trong chương «Không gian Vector & Cơ sở, Số chiều» (Đại số tuyến tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Không gian Vector & Cơ sở, Số chiều trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Không gian Vector & Cơ sở, Số chiều thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Không gian Vector & Cơ sở, Số chiều:
Công thức và định nghĩa Không gian Vector & Cơ sở, Số chiều.
Áp dụng Không gian Vector & Cơ sở, Số chiều trong Không gian Vector & Cơ sở, Số chiều.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Không gian Vector & Cơ sở, Số chiều, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Không gian Vector & Cơ sở, Số chiều với Không gian Vector & Cơ sở, Số chiều: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Không gian Vector & Cơ sở, Số chiều:
Ví dụ Không gian Vector & Cơ sở, Số chiều với số liệu.
Bài tập mở rộng Không gian Vector & Cơ sở, Số chiều.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Không gian Vector & Cơ sở, Số chiều:
Thuộc Không gian Vector & Cơ sở, Số chiều.
Liên kết Không gian Vector & Cơ sở, Số chiều.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-2-lesson-2': [
		`Bài tập vận dụng Không gian Vector & Cơ sở, Số chiều (Không gian Vector & Cơ sở, Số chiều). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Không gian Vector & Cơ sở, Số chiều:
Đọc đề Không gian Vector & Cơ sở, Số chiều.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Không gian Vector & Cơ sở, Số chiều với Không gian Vector & Cơ sở, Số chiều: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Không gian Vector & Cơ sở, Số chiều.
Bài 2 đổi số.
Bài 3 tổng hợp Không gian Vector & Cơ sở, Số chiều.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Không gian Vector & Cơ sở, Số chiều: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Không gian Vector & Cơ sở, Số chiều:
Luyện 5 bài Không gian Vector & Cơ sở, Số chiều.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-3-lesson-1': [
		`Ánh xạ tuyến tính & Ma trận biểu diễn là nội dung cốt lõi trong chương «Ánh xạ tuyến tính & Ma trận biểu diễn» (Đại số tuyến tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Ánh xạ tuyến tính & Ma trận biểu diễn trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Ánh xạ tuyến tính & Ma trận biểu diễn thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Ánh xạ tuyến tính & Ma trận biểu diễn:
Công thức và định nghĩa Ánh xạ tuyến tính & Ma trận biểu diễn.
Áp dụng Ánh xạ tuyến tính & Ma trận biểu diễn trong Ánh xạ tuyến tính & Ma trận biểu diễn.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Ánh xạ tuyến tính & Ma trận biểu diễn, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Ánh xạ tuyến tính & Ma trận biểu diễn:
Ví dụ Ánh xạ tuyến tính & Ma trận biểu diễn với số liệu.
Bài tập mở rộng Ánh xạ tuyến tính & Ma trận biểu diễn.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Ánh xạ tuyến tính & Ma trận biểu diễn:
Thuộc Ánh xạ tuyến tính & Ma trận biểu diễn.
Liên kết Ánh xạ tuyến tính & Ma trận biểu diễn.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-3-lesson-2': [
		`Bài tập vận dụng Ánh xạ tuyến tính & Ma trận biểu diễn (Ánh xạ tuyến tính & Ma trận biểu diễn). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Ánh xạ tuyến tính & Ma trận biểu diễn:
Đọc đề Ánh xạ tuyến tính & Ma trận biểu diễn.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Ánh xạ tuyến tính & Ma trận biểu diễn với Ánh xạ tuyến tính & Ma trận biểu diễn: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Ánh xạ tuyến tính & Ma trận biểu diễn.
Bài 2 đổi số.
Bài 3 tổng hợp Ánh xạ tuyến tính & Ma trận biểu diễn.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Ánh xạ tuyến tính & Ma trận biểu diễn: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Ánh xạ tuyến tính & Ma trận biểu diễn:
Luyện 5 bài Ánh xạ tuyến tính & Ma trận biểu diễn.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-4-lesson-1': [
		`Trị riêng, Vector riêng & Chéo hóa là nội dung cốt lõi trong chương «Trị riêng, Vector riêng & Chéo hóa» (Đại số tuyến tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Trị riêng, Vector riêng & Chéo hóa trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Trị riêng, Vector riêng & Chéo hóa thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Trị riêng, Vector riêng & Chéo hóa:
Công thức và định nghĩa Trị riêng, Vector riêng & Chéo hóa.
Áp dụng Trị riêng, Vector riêng & Chéo hóa trong Trị riêng, Vector riêng & Chéo hóa.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Trị riêng, Vector riêng & Chéo hóa, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Trị riêng, Vector riêng & Chéo hóa với Trị riêng, Vector riêng & Chéo hóa: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Trị riêng, Vector riêng & Chéo hóa:
Ví dụ Trị riêng, Vector riêng & Chéo hóa với số liệu.
Bài tập mở rộng Trị riêng, Vector riêng & Chéo hóa.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Trị riêng, Vector riêng & Chéo hóa:
Thuộc Trị riêng, Vector riêng & Chéo hóa.
Liên kết Trị riêng, Vector riêng & Chéo hóa.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-4-lesson-2': [
		`Bài tập vận dụng Trị riêng, Vector riêng & Chéo hóa (Trị riêng, Vector riêng & Chéo hóa). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Đại số tuyến tính đánh giá khả năng vận dụng Trị riêng, Vector riêng & Chéo hóa qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Trị riêng, Vector riêng & Chéo hóa:
Đọc đề Trị riêng, Vector riêng & Chéo hóa.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Trị riêng, Vector riêng & Chéo hóa với Trị riêng, Vector riêng & Chéo hóa: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Trị riêng, Vector riêng & Chéo hóa.
Bài 2 đổi số.
Bài 3 tổng hợp Trị riêng, Vector riêng & Chéo hóa.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Trị riêng, Vector riêng & Chéo hóa: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Trị riêng, Vector riêng & Chéo hóa:
Luyện 5 bài Trị riêng, Vector riêng & Chéo hóa.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-5-lesson-1': [
		`Dạng toàn phương Lagrange là nội dung cốt lõi trong chương «Dạng toàn phương Lagrange» (Đại số tuyến tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Dạng toàn phương Lagrange trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Dạng toàn phương Lagrange thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Dạng toàn phương Lagrange:
Công thức và định nghĩa Dạng toàn phương Lagrange.
Áp dụng Dạng toàn phương Lagrange trong Dạng toàn phương Lagrange.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Dạng toàn phương Lagrange, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Dạng toàn phương Lagrange với Dạng toàn phương Lagrange: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Dạng toàn phương Lagrange:
Ví dụ Dạng toàn phương Lagrange với số liệu.
Bài tập mở rộng Dạng toàn phương Lagrange.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Dạng toàn phương Lagrange:
Thuộc Dạng toàn phương Lagrange.
Liên kết Dạng toàn phương Lagrange.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'bk_giai_tich:chapter-5-lesson-2': [
		`Bài tập vận dụng Dạng toàn phương Lagrange (Dạng toàn phương Lagrange). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Đại số tuyến tính đánh giá khả năng vận dụng Dạng toàn phương Lagrange qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Dạng toàn phương Lagrange:
Đọc đề Dạng toàn phương Lagrange.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Dạng toàn phương Lagrange với Dạng toàn phương Lagrange: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Dạng toàn phương Lagrange.
Bài 2 đổi số.
Bài 3 tổng hợp Dạng toàn phương Lagrange.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Dạng toàn phương Lagrange: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Dạng toàn phương Lagrange:
Luyện 5 bài Dạng toàn phương Lagrange.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.

Ôn tập Dạng toàn phương Lagrange: liệt kê công thức chính, làm 3 bài tập đại diện, tự giải thích từng bước bằng lời nói.`,
	],
	'bk_giai_tich:chapter-6-lesson-1': [
		`Ôn thi Đại số tuyến tính — Bộ đề thi ĐSTT Bách Khoa các năm (Bộ đề thi ĐSTT Bách Khoa các năm). Đề thi đại học kỹ thuật thường gồm trắc nghiệm lý thuyết và bài tập tính toán/viết code. Thời gian 60–120 phút tùy môn. Sinh viên cần nắm công thức cốt lõi, luyện đề cũ và phân bổ thời gian hợp lý: làm câu quen trước, ghi công thức lên nháp, kiểm tra đơn vị trước khi chọn đáp án.`,
		`Cấu trúc đề và trọng tâm Bộ đề thi ĐSTT Bách Khoa các năm:
Đề Đại số tuyến tính: lý thuyết + tính toán Bộ đề thi ĐSTT Bách Khoa các năm.
Thời gian 60–120 phút.
Trọng tâm Bộ đề thi ĐSTT Bách Khoa các năm.

Chiến lược: (1) quét nhanh toàn đề, đánh dấu câu dễ; (2) làm phần tính trước nếu tự tin; (3) dành 10 phút cuối kiểm tra đơn vị và câu chưa làm.

Ma trận vuông n×n có định thức và nghịch đảo nếu det ≠ 0. Hạng của ma trận = số pivot khi khử Gauss. Không gian con là tập con đóng cộng và nhân scalar. Ánh xạ tuyến tính giữ gốc và tổ hợp tuyến tính. Trị riêng λ là scalar; vector riêng v ≠ 0.

Liên hệ Bộ đề thi ĐSTT Bách Khoa các năm với Bộ đề thi ĐSTT Bách Khoa các năm: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Câu hỏi mẫu Bộ đề thi ĐSTT Bách Khoa các năm:
Câu lý thuyết Bộ đề thi ĐSTT Bách Khoa các năm.
Câu tính thay số.
Câu tổng hợp Bộ đề thi ĐSTT Bách Khoa các năm.

Với mỗi câu mẫu, tự biến thể: đổi số liệu, thêm điều kiện, hoặc hỏi ngược (cho kết quả tìm đầu vào).

Ví dụ bổ sung Bộ đề thi ĐSTT Bách Khoa các năm: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Bộ đề thi ĐSTT Bách Khoa các năm:
Ôn đề cũ Bộ đề thi ĐSTT Bách Khoa các năm.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-1-lesson-1': [
		`Phân tích Big-O: QuickSort, MergeSort, HeapSort là nội dung cốt lõi trong chương «Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap)» (Cấu trúc dữ liệu & Giải thuật). Bài học giải thích khái niệm, ký hiệu và vai trò của Phân tích Big-O: QuickSort, MergeSort, HeapSort trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Phân tích Big-O: QuickSort, MergeSort, HeapSort thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Phân tích Big-O: QuickSort, MergeSort, HeapSort:
O(n log n) merge/quick avg.
HeapSort in-place.
AVL O(log n).
Áp dụng Phân tích Big-O: QuickSort, MergeSort, HeapSort trong Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Độ phức tạp amortized: ví dụ push/pop stack O(1) trung bình. In-order duyệt BST cho dãy tăng dần. BFS dùng queue, độ phức tạp O(V+E). DFS dùng stack hoặc đệ quy. Hash load factor α = n/m; rehash khi α > 0,7 thường.

Liên hệ Phân tích Big-O: QuickSort, MergeSort, HeapSort với Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Phân tích Big-O: QuickSort, MergeSort, HeapSort:
Merge n=8: 3 tầng×O(n).
Bài tập mở rộng Phân tích Big-O: QuickSort, MergeSort, HeapSort.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Phân tích Big-O: QuickSort, MergeSort, HeapSort:
Chọn sort theo ổn định/bộ nhớ.
Liên kết Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-1-lesson-2': [
		`Binary Search Tree (BST) & Cây cân bằng AVL Tree là nội dung cốt lõi trong chương «Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap)» (Cấu trúc dữ liệu & Giải thuật). Bài học giải thích khái niệm, ký hiệu và vai trò của Binary Search Tree (BST) & Cây cân bằng AVL Tree trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Binary Search Tree (BST) & Cây cân bằng AVL Tree thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Binary Search Tree (BST) & Cây cân bằng AVL Tree:
O(n log n) merge/quick avg.
HeapSort in-place.
AVL O(log n).
Áp dụng Binary Search Tree (BST) & Cây cân bằng AVL Tree trong Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Binary Search Tree (BST) & Cây cân bằng AVL Tree:
Merge n=8: 3 tầng×O(n).
Bài tập mở rộng Binary Search Tree (BST) & Cây cân bằng AVL Tree.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Binary Search Tree (BST) & Cây cân bằng AVL Tree:
Chọn sort theo ổn định/bộ nhớ.
Liên kết Phân tích độ phức tạp Big-O & Sorting (Quick, Merge, Heap).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-2-lesson-1': [
		`Danh sách liên kết, Stack & Queue là nội dung cốt lõi trong chương «Danh sách liên kết, Stack & Queue» (Cấu trúc dữ liệu & Giải thuật). Bài học giải thích khái niệm, ký hiệu và vai trò của Danh sách liên kết, Stack & Queue trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Danh sách liên kết, Stack & Queue thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Danh sách liên kết, Stack & Queue:
Công thức và định nghĩa Danh sách liên kết, Stack & Queue.
Áp dụng Danh sách liên kết, Stack & Queue trong Danh sách liên kết, Stack & Queue.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Danh sách liên kết, Stack & Queue, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Độ phức tạp amortized: ví dụ push/pop stack O(1) trung bình. In-order duyệt BST cho dãy tăng dần. BFS dùng queue, độ phức tạp O(V+E). DFS dùng stack hoặc đệ quy. Hash load factor α = n/m; rehash khi α > 0,7 thường.

Liên hệ Danh sách liên kết, Stack & Queue với Danh sách liên kết, Stack & Queue: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Danh sách liên kết, Stack & Queue:
Ví dụ Danh sách liên kết, Stack & Queue với số liệu.
Bài tập mở rộng Danh sách liên kết, Stack & Queue.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Danh sách liên kết, Stack & Queue:
Thuộc Danh sách liên kết, Stack & Queue.
Liên kết Danh sách liên kết, Stack & Queue.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-2-lesson-2': [
		`Bài tập vận dụng Danh sách liên kết, Stack & Queue (Danh sách liên kết, Stack & Queue). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Cấu trúc dữ liệu & Giải thuật đánh giá khả năng vận dụng Danh sách liên kết, Stack & Queue qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Danh sách liên kết, Stack & Queue:
Đọc đề Danh sách liên kết, Stack & Queue.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Độ phức tạp amortized: ví dụ push/pop stack O(1) trung bình. In-order duyệt BST cho dãy tăng dần. BFS dùng queue, độ phức tạp O(V+E). DFS dùng stack hoặc đệ quy. Hash load factor α = n/m; rehash khi α > 0,7 thường.

Liên hệ Danh sách liên kết, Stack & Queue với Danh sách liên kết, Stack & Queue: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Danh sách liên kết, Stack & Queue.
Bài 2 đổi số.
Bài 3 tổng hợp Danh sách liên kết, Stack & Queue.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Danh sách liên kết, Stack & Queue: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Danh sách liên kết, Stack & Queue:
Luyện 5 bài Danh sách liên kết, Stack & Queue.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-3-lesson-1': [
		`Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree là nội dung cốt lõi trong chương «Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree» (Cấu trúc dữ liệu & Giải thuật). Bài học giải thích khái niệm, ký hiệu và vai trò của Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree:
BST: trái<gốc<phải.
AVL balance, xoay LL,RR,LR,RL.
Áp dụng Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree trong Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree:
Chèn 1,2,3,4 thuần → h=n.
Bài tập mở rộng Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree:
AVL đảm bảo O(log n).
Liên kết Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-3-lesson-2': [
		`Bài tập vận dụng Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree (Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree:
Đọc đề Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Độ phức tạp amortized: ví dụ push/pop stack O(1) trung bình. In-order duyệt BST cho dãy tăng dần. BFS dùng queue, độ phức tạp O(V+E). DFS dùng stack hoặc đệ quy. Hash load factor α = n/m; rehash khi α > 0,7 thường.

Liên hệ Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree với Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.
Bài 2 đổi số.
Bài 3 tổng hợp Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree:
Luyện 5 bài Cây nhị phân tìm kiếm BST & Cây cân bằng AVL Tree.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-4-lesson-1': [
		`Bảng băm (Hash Table) & Xử lý đụng độ là nội dung cốt lõi trong chương «Bảng băm (Hash Table) & Xử lý đụng độ» (Cấu trúc dữ liệu & Giải thuật). Bài học giải thích khái niệm, ký hiệu và vai trò của Bảng băm (Hash Table) & Xử lý đụng độ trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Bảng băm (Hash Table) & Xử lý đụng độ thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Bảng băm (Hash Table) & Xử lý đụng độ:
Công thức và định nghĩa Bảng băm (Hash Table) & Xử lý đụng độ.
Áp dụng Bảng băm (Hash Table) & Xử lý đụng độ trong Bảng băm (Hash Table) & Xử lý đụng độ.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Bảng băm (Hash Table) & Xử lý đụng độ, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Bảng băm (Hash Table) & Xử lý đụng độ:
Ví dụ Bảng băm (Hash Table) & Xử lý đụng độ với số liệu.
Bài tập mở rộng Bảng băm (Hash Table) & Xử lý đụng độ.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Bảng băm (Hash Table) & Xử lý đụng độ:
Thuộc Bảng băm (Hash Table) & Xử lý đụng độ.
Liên kết Bảng băm (Hash Table) & Xử lý đụng độ.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-4-lesson-2': [
		`Bài tập vận dụng Bảng băm (Hash Table) & Xử lý đụng độ (Bảng băm (Hash Table) & Xử lý đụng độ). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Bảng băm (Hash Table) & Xử lý đụng độ:
Đọc đề Bảng băm (Hash Table) & Xử lý đụng độ.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Độ phức tạp amortized: ví dụ push/pop stack O(1) trung bình. In-order duyệt BST cho dãy tăng dần. BFS dùng queue, độ phức tạp O(V+E). DFS dùng stack hoặc đệ quy. Hash load factor α = n/m; rehash khi α > 0,7 thường.

Liên hệ Bảng băm (Hash Table) & Xử lý đụng độ với Bảng băm (Hash Table) & Xử lý đụng độ: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Bảng băm (Hash Table) & Xử lý đụng độ.
Bài 2 đổi số.
Bài 3 tổng hợp Bảng băm (Hash Table) & Xử lý đụng độ.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Bảng băm (Hash Table) & Xử lý đụng độ: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Bảng băm (Hash Table) & Xử lý đụng độ:
Luyện 5 bài Bảng băm (Hash Table) & Xử lý đụng độ.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_dsa:chapter-5-lesson-1': [
		`Ôn thi Cấu trúc dữ liệu & Giải thuật — Đề thi thực hành & Lý thuyết DSA HCMUS (Đề thi thực hành & Lý thuyết DSA HCMUS). Đề thi đại học kỹ thuật thường gồm trắc nghiệm lý thuyết và bài tập tính toán/viết code. Thời gian 60–120 phút tùy môn. Sinh viên cần nắm công thức cốt lõi, luyện đề cũ và phân bổ thời gian hợp lý: làm câu quen trước, ghi công thức lên nháp, kiểm tra đơn vị trước khi chọn đáp án.`,
		`Cấu trúc đề và trọng tâm Đề thi thực hành & Lý thuyết DSA HCMUS:
Đề Cấu trúc dữ liệu & Giải thuật: lý thuyết + tính toán Đề thi thực hành & Lý thuyết DSA HCMUS.
Thời gian 60–120 phút.
Trọng tâm Đề thi thực hành & Lý thuyết DSA HCMUS.

Chiến lược: (1) quét nhanh toàn đề, đánh dấu câu dễ; (2) làm phần tính trước nếu tự tin; (3) dành 10 phút cuối kiểm tra đơn vị và câu chưa làm.

Độ phức tạp amortized: ví dụ push/pop stack O(1) trung bình. In-order duyệt BST cho dãy tăng dần. BFS dùng queue, độ phức tạp O(V+E). DFS dùng stack hoặc đệ quy. Hash load factor α = n/m; rehash khi α > 0,7 thường.

Liên hệ Đề thi thực hành & Lý thuyết DSA HCMUS với Đề thi thực hành & Lý thuyết DSA HCMUS: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Câu hỏi mẫu Đề thi thực hành & Lý thuyết DSA HCMUS:
Câu lý thuyết Đề thi thực hành & Lý thuyết DSA HCMUS.
Câu tính thay số.
Câu tổng hợp Đề thi thực hành & Lý thuyết DSA HCMUS.

Với mỗi câu mẫu, tự biến thể: đổi số liệu, thêm điều kiện, hoặc hỏi ngược (cho kết quả tìm đầu vào).

Ví dụ bổ sung Đề thi thực hành & Lý thuyết DSA HCMUS: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Đề thi thực hành & Lý thuyết DSA HCMUS:
Ôn đề cũ Đề thi thực hành & Lý thuyết DSA HCMUS.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-1-lesson-1': [
		`Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại là nội dung cốt lõi trong chương «Thiết kế ERD & Chuyển đổi sang CSDL quan hệ» (Hệ Cơ sở dữ liệu). Bài học giải thích khái niệm, ký hiệu và vai trò của Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại:
Entity→table; M:N→junction.
PK, FK.
Áp dụng Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại trong Thiết kế ERD & Chuyển đổi sang CSDL quan hệ.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Thiết kế ERD & Chuyển đổi sang CSDL quan hệ, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

ACID: Atomicity, Consistency, Isolation, Durability. Index B-tree tăng tốc SELECT, chậm INSERT. Normalization giảm redundancy. JOIN INNER chỉ giữ hàng khớp; LEFT giữ tất cả hàng bảng trái. Transaction BEGIN/COMMIT/ROLLBACK.

Liên hệ Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại với Thiết kế ERD & Chuyển đổi sang CSDL quan hệ: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại:
SinhVien-DangKy-MonHoc.
Bài tập mở rộng Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Mô hình ERD sang CSDL quan hệ & Khóa chính/ngoại:
FK toàn vẹn tham chiếu.
Liên kết Thiết kế ERD & Chuyển đổi sang CSDL quan hệ.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-1-lesson-2': [
		`Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By) là nội dung cốt lõi trong chương «Thiết kế ERD & Chuyển đổi sang CSDL quan hệ» (Hệ Cơ sở dữ liệu). Bài học giải thích khái niệm, ký hiệu và vai trò của Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By):
Entity→table; M:N→junction.
PK, FK.
Áp dụng Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By) trong Thiết kế ERD & Chuyển đổi sang CSDL quan hệ.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Thiết kế ERD & Chuyển đổi sang CSDL quan hệ, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By):
SinhVien-DangKy-MonHoc.
Bài tập mở rộng Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Chuẩn hóa BCNF & Truy vấn SQL nâng cao (Subquery, Group By):
FK toàn vẹn tham chiếu.
Liên kết Thiết kế ERD & Chuyển đổi sang CSDL quan hệ.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-2-lesson-1': [
		`Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) là nội dung cốt lõi trong chương «Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia)» (Hệ Cơ sở dữ liệu). Bài học giải thích khái niệm, ký hiệu và vai trò của Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia):
Công thức và định nghĩa Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).
Áp dụng Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) trong Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia):
Ví dụ Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) với số liệu.
Bài tập mở rộng Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia):
Thuộc Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).
Liên kết Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-2-lesson-2': [
		`Bài tập vận dụng Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) (Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia)). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Hệ Cơ sở dữ liệu đánh giá khả năng vận dụng Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia):
Đọc đề Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

ACID: Atomicity, Consistency, Isolation, Durability. Index B-tree tăng tốc SELECT, chậm INSERT. Normalization giảm redundancy. JOIN INNER chỉ giữ hàng khớp; LEFT giữ tất cả hàng bảng trái. Transaction BEGIN/COMMIT/ROLLBACK.

Liên hệ Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia) với Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).
Bài 2 đổi số.
Bài 3 tổng hợp Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia): thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia):
Luyện 5 bài Đại số quan hệ (Chọn, Chiếu, Kết nối, Chia).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-3-lesson-1': [
		`Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) là nội dung cốt lõi trong chương «Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View)» (Hệ Cơ sở dữ liệu). Bài học giải thích khái niệm, ký hiệu và vai trò của Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View):
Công thức và định nghĩa Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).
Áp dụng Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) trong Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View):
Ví dụ Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) với số liệu.
Bài tập mở rộng Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View):
Thuộc Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).
Liên kết Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-3-lesson-2': [
		`Bài tập vận dụng Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) (Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View)). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View):
Đọc đề Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

ACID: Atomicity, Consistency, Isolation, Durability. Index B-tree tăng tốc SELECT, chậm INSERT. Normalization giảm redundancy. JOIN INNER chỉ giữ hàng khớp; LEFT giữ tất cả hàng bảng trái. Transaction BEGIN/COMMIT/ROLLBACK.

Liên hệ Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View) với Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).
Bài 2 đổi số.
Bài 3 tổng hợp Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View): thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View):
Luyện 5 bài Truy vấn SQL nâng cao (Group By, Subquery, Trigger, View).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-4-lesson-1': [
		`Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF là nội dung cốt lõi trong chương «Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF» (Hệ Cơ sở dữ liệu). Bài học giải thích khái niệm, ký hiệu và vai trò của Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF:
Công thức và định nghĩa Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.
Áp dụng Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF trong Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF:
Ví dụ Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF với số liệu.
Bài tập mở rộng Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF:
Thuộc Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.
Liên kết Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-4-lesson-2': [
		`Bài tập vận dụng Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF (Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF:
Đọc đề Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

ACID: Atomicity, Consistency, Isolation, Durability. Index B-tree tăng tốc SELECT, chậm INSERT. Normalization giảm redundancy. JOIN INNER chỉ giữ hàng khớp; LEFT giữ tất cả hàng bảng trái. Transaction BEGIN/COMMIT/ROLLBACK.

Liên hệ Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF với Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.
Bài 2 đổi số.
Bài 3 tổng hợp Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF:
Luyện 5 bài Lý thuyết Chuẩn hóa: Phụ thuộc hàm & Dạng chuẩn BCNF.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_database:chapter-5-lesson-1': [
		`Ôn thi Hệ Cơ sở dữ liệu — Đề thi trắc nghiệm & Tự luận CSDL HCMUS (Đề thi trắc nghiệm & Tự luận CSDL HCMUS). Đề thi đại học kỹ thuật thường gồm trắc nghiệm lý thuyết và bài tập tính toán/viết code. Thời gian 60–120 phút tùy môn. Sinh viên cần nắm công thức cốt lõi, luyện đề cũ và phân bổ thời gian hợp lý: làm câu quen trước, ghi công thức lên nháp, kiểm tra đơn vị trước khi chọn đáp án.`,
		`Cấu trúc đề và trọng tâm Đề thi trắc nghiệm & Tự luận CSDL HCMUS:
Đề Hệ Cơ sở dữ liệu: lý thuyết + tính toán Đề thi trắc nghiệm & Tự luận CSDL HCMUS.
Thời gian 60–120 phút.
Trọng tâm Đề thi trắc nghiệm & Tự luận CSDL HCMUS.

Chiến lược: (1) quét nhanh toàn đề, đánh dấu câu dễ; (2) làm phần tính trước nếu tự tin; (3) dành 10 phút cuối kiểm tra đơn vị và câu chưa làm.

ACID: Atomicity, Consistency, Isolation, Durability. Index B-tree tăng tốc SELECT, chậm INSERT. Normalization giảm redundancy. JOIN INNER chỉ giữ hàng khớp; LEFT giữ tất cả hàng bảng trái. Transaction BEGIN/COMMIT/ROLLBACK.

Liên hệ Đề thi trắc nghiệm & Tự luận CSDL HCMUS với Đề thi trắc nghiệm & Tự luận CSDL HCMUS: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Câu hỏi mẫu Đề thi trắc nghiệm & Tự luận CSDL HCMUS:
Câu lý thuyết Đề thi trắc nghiệm & Tự luận CSDL HCMUS.
Câu tính thay số.
Câu tổng hợp Đề thi trắc nghiệm & Tự luận CSDL HCMUS.

Với mỗi câu mẫu, tự biến thể: đổi số liệu, thêm điều kiện, hoặc hỏi ngược (cho kết quả tìm đầu vào).

Ví dụ bổ sung Đề thi trắc nghiệm & Tự luận CSDL HCMUS: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Đề thi trắc nghiệm & Tự luận CSDL HCMUS:
Ôn đề cũ Đề thi trắc nghiệm & Tự luận CSDL HCMUS.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-1-lesson-1': [
		`Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán là nội dung cốt lõi trong chương «Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán» (Lập trình cơ bản (C++)). Bài học giải thích khái niệm, ký hiệu và vai trò của Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán:
Công thức và định nghĩa Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán.
Áp dụng Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán trong Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán:
Ví dụ Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán với số liệu.
Bài tập mở rộng Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán:
Thuộc Cấu trúc điều khiển, Vòng lặp & Tối ưu thuật toán.
Liên kết Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-1-lesson-2': [
		`Mảng động (new/delete), Con trỏ và Chuỗi ký tự là nội dung cốt lõi trong chương «Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán» (Lập trình cơ bản (C++)). Bài học giải thích khái niệm, ký hiệu và vai trò của Mảng động (new/delete), Con trỏ và Chuỗi ký tự trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Mảng động (new/delete), Con trỏ và Chuỗi ký tự thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Mảng động (new/delete), Con trỏ và Chuỗi ký tự:
*p dereference; arr[i]=*(arr+i).
struct . và ->
Áp dụng Mảng động (new/delete), Con trỏ và Chuỗi ký tự trong Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Mảng động (new/delete), Con trỏ và Chuỗi ký tự với Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Mảng động (new/delete), Con trỏ và Chuỗi ký tự:
Đảo mảng; struct SV.
Bài tập mở rộng Mảng động (new/delete), Con trỏ và Chuỗi ký tự.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Mảng động (new/delete), Con trỏ và Chuỗi ký tự:
Mảng ≡ con trỏ.
Liên kết Cấu trúc rẽ nhánh, Vòng lặp & Tối ưu thuật toán.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-2-lesson-1': [
		`Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string là nội dung cốt lõi trong chương «Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string» (Lập trình cơ bản (C++)). Bài học giải thích khái niệm, ký hiệu và vai trò của Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string:
Công thức và định nghĩa Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.
Áp dụng Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string trong Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string:
Ví dụ Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string với số liệu.
Bài tập mở rộng Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string:
Thuộc Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.
Liên kết Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-2-lesson-2': [
		`Bài tập vận dụng Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string (Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string:
Đọc đề Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string với Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.
Bài 2 đổi số.
Bài 3 tổng hợp Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string:
Luyện 5 bài Mảng 1 chiều, 2 chiều & Xử lý chuỗi C-string.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-3-lesson-1': [
		`Con trỏ & Cấp phát mảng động (new/delete) là nội dung cốt lõi trong chương «Con trỏ & Cấp phát mảng động (new/delete)» (Lập trình cơ bản (C++)). Bài học giải thích khái niệm, ký hiệu và vai trò của Con trỏ & Cấp phát mảng động (new/delete) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Con trỏ & Cấp phát mảng động (new/delete) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Con trỏ & Cấp phát mảng động (new/delete):
*p dereference; arr[i]=*(arr+i).
struct . và ->
Áp dụng Con trỏ & Cấp phát mảng động (new/delete) trong Con trỏ & Cấp phát mảng động (new/delete).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Con trỏ & Cấp phát mảng động (new/delete), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Con trỏ & Cấp phát mảng động (new/delete) với Con trỏ & Cấp phát mảng động (new/delete): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Con trỏ & Cấp phát mảng động (new/delete):
Đảo mảng; struct SV.
Bài tập mở rộng Con trỏ & Cấp phát mảng động (new/delete).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Con trỏ & Cấp phát mảng động (new/delete):
Mảng ≡ con trỏ.
Liên kết Con trỏ & Cấp phát mảng động (new/delete).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-3-lesson-2': [
		`Bài tập vận dụng Con trỏ & Cấp phát mảng động (new/delete) (Con trỏ & Cấp phát mảng động (new/delete)). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Lập trình cơ bản (C++) đánh giá khả năng vận dụng Con trỏ & Cấp phát mảng động (new/delete) qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Con trỏ & Cấp phát mảng động (new/delete):
Đọc đề Con trỏ & Cấp phát mảng động (new/delete).
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Con trỏ & Cấp phát mảng động (new/delete) với Con trỏ & Cấp phát mảng động (new/delete): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Con trỏ & Cấp phát mảng động (new/delete).
Bài 2 đổi số.
Bài 3 tổng hợp Con trỏ & Cấp phát mảng động (new/delete).

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Con trỏ & Cấp phát mảng động (new/delete): thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Con trỏ & Cấp phát mảng động (new/delete):
Luyện 5 bài Con trỏ & Cấp phát mảng động (new/delete).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-4-lesson-1': [
		`Đệ quy & Đọc ghi File fstream là nội dung cốt lõi trong chương «Đệ quy & Đọc ghi File fstream» (Lập trình cơ bản (C++)). Bài học giải thích khái niệm, ký hiệu và vai trò của Đệ quy & Đọc ghi File fstream trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Đệ quy & Đọc ghi File fstream thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Đệ quy & Đọc ghi File fstream:
Base case; binary search O(log n).
Mảng 2D hai vòng for.
Áp dụng Đệ quy & Đọc ghi File fstream trong Đệ quy & Đọc ghi File fstream.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Đệ quy & Đọc ghi File fstream, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Đệ quy & Đọc ghi File fstream với Đệ quy & Đọc ghi File fstream: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Đệ quy & Đọc ghi File fstream:
fact(5)=120; bs tìm 5.
Bài tập mở rộng Đệ quy & Đọc ghi File fstream.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Đệ quy & Đọc ghi File fstream:
Đệ quy + mảng sorted.
Liên kết Đệ quy & Đọc ghi File fstream.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-4-lesson-2': [
		`Bài tập vận dụng Đệ quy & Đọc ghi File fstream (Đệ quy & Đọc ghi File fstream). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Lập trình cơ bản (C++) đánh giá khả năng vận dụng Đệ quy & Đọc ghi File fstream qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Đệ quy & Đọc ghi File fstream:
Đọc đề Đệ quy & Đọc ghi File fstream.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Đệ quy & Đọc ghi File fstream với Đệ quy & Đọc ghi File fstream: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Đệ quy & Đọc ghi File fstream.
Bài 2 đổi số.
Bài 3 tổng hợp Đệ quy & Đọc ghi File fstream.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Đệ quy & Đọc ghi File fstream: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Đệ quy & Đọc ghi File fstream:
Luyện 5 bài Đệ quy & Đọc ghi File fstream.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_programming:chapter-5-lesson-1': [
		`Ôn thi Lập trình cơ bản (C++) — Bộ đề thi thực hành chấm tự động Wecode HCMUS (Bộ đề thi thực hành chấm tự động Wecode HCMUS). Đề thi đại học kỹ thuật thường gồm trắc nghiệm lý thuyết và bài tập tính toán/viết code. Thời gian 60–120 phút tùy môn. Sinh viên cần nắm công thức cốt lõi, luyện đề cũ và phân bổ thời gian hợp lý: làm câu quen trước, ghi công thức lên nháp, kiểm tra đơn vị trước khi chọn đáp án.`,
		`Cấu trúc đề và trọng tâm Bộ đề thi thực hành chấm tự động Wecode HCMUS:
Đề Lập trình cơ bản (C++): lý thuyết + tính toán Bộ đề thi thực hành chấm tự động Wecode HCMUS.
Thời gian 60–120 phút.
Trọng tâm Bộ đề thi thực hành chấm tự động Wecode HCMUS.

Chiến lược: (1) quét nhanh toàn đề, đánh dấu câu dễ; (2) làm phần tính trước nếu tự tin; (3) dành 10 phút cuối kiểm tra đơn vị và câu chưa làm.

Độ phức tạp thời gian và không gian — phân tích trước khi code. Two pointers trên mảng sorted. Prefix sum trả lời truy vấn đoạn O(1) sau O(n) tiền xử lý. fstream C++: ifstream, ofstream. Đệ quy sâu có thể stack overflow — cân nhắc lặp.

Liên hệ Bộ đề thi thực hành chấm tự động Wecode HCMUS với Bộ đề thi thực hành chấm tự động Wecode HCMUS: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Câu hỏi mẫu Bộ đề thi thực hành chấm tự động Wecode HCMUS:
Câu lý thuyết Bộ đề thi thực hành chấm tự động Wecode HCMUS.
Câu tính thay số.
Câu tổng hợp Bộ đề thi thực hành chấm tự động Wecode HCMUS.

Với mỗi câu mẫu, tự biến thể: đổi số liệu, thêm điều kiện, hoặc hỏi ngược (cho kết quả tìm đầu vào).

Ví dụ bổ sung Bộ đề thi thực hành chấm tự động Wecode HCMUS: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Bộ đề thi thực hành chấm tự động Wecode HCMUS:
Ôn đề cũ Bộ đề thi thực hành chấm tự động Wecode HCMUS.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-1-lesson-1': [
		`Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP là nội dung cốt lõi trong chương «Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng» (Mạng máy tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP:
OSI 7 tầng; TCP/IP 4.
HTTP, DNS, DHCP.
Áp dụng Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP trong Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP:
DNS→IP; DHCP 4 bước.
Bài tập mở rộng Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Mô hình OSI vs TCP/IP & Giao thức HTTP, DNS, DHCP:
TCP/IP thực tế Internet.
Liên kết Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-1-lesson-2': [
		`Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask) là nội dung cốt lõi trong chương «Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng» (Mạng máy tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask):
OSI 7 tầng; TCP/IP 4.
HTTP, DNS, DHCP.
Áp dụng Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask) trong Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask):
DNS→IP; DHCP 4 bước.
Bài tập mở rộng Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Kỹ thuật chia mạng con IPv4 (VLSM & Subnet Mask):
TCP/IP thực tế Internet.
Liên kết Mô hình OSI 7 tầng vs TCP/IP 4 tầng & Giao thức ứng dụng.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-2-lesson-1': [
		`Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn là nội dung cốt lõi trong chương «Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn» (Mạng máy tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn:
Công thức và định nghĩa Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.
Áp dụng Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn trong Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn:
Ví dụ Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn với số liệu.
Bài tập mở rộng Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn:
Thuộc Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.
Liên kết Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-2-lesson-2': [
		`Bài tập vận dụng Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn (Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn:
Đọc đề Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

MTU Ethernet 1500 byte. TTL giảm mỗi router; TTL=0 thì drop. NAT chuyển IP private ↔ public. TCP sequence/ack đảm bảo thứ tự. UDP header 8 byte, không handshake. Subnet mask AND với IP cho network address.

Liên hệ Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn với Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.
Bài 2 đổi số.
Bài 3 tổng hợp Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn:
Luyện 5 bài Tầng Giao vận (TCP/UDP) & Kiểm soát tắc nghẽn.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-3-lesson-1': [
		`Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) là nội dung cốt lõi trong chương «Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM)» (Mạng máy tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM):
/n → 2^(32-n) địa chỉ.
VLSM chia subnet khác size.
Áp dụng Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) trong Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM), cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

MTU Ethernet 1500 byte. TTL giảm mỗi router; TTL=0 thì drop. NAT chuyển IP private ↔ public. TCP sequence/ack đảm bảo thứ tự. UDP header 8 byte, không handshake. Subnet mask AND với IP cho network address.

Liên hệ Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) với Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM):
/24: 254 host.
/26: 62 host.
Bài tập mở rộng Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM):
AND mask→network.
Liên kết Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-3-lesson-2': [
		`Bài tập vận dụng Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) (Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM)). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng.`,
		`Phương pháp giải bài Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM):
Đọc đề Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

MTU Ethernet 1500 byte. TTL giảm mỗi router; TTL=0 thì drop. NAT chuyển IP private ↔ public. TCP sequence/ack đảm bảo thứ tự. UDP header 8 byte, không handshake. Subnet mask AND với IP cho network address.

Liên hệ Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM) với Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM): áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).
Bài 2 đổi số.
Bài 3 tổng hợp Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM): thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM):
Luyện 5 bài Địa chỉ IPv4 & Chia mạng con Subnetting (VLSM).

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-4-lesson-1': [
		`Địa chỉ MAC, Switch & Định tuyến Router là nội dung cốt lõi trong chương «Địa chỉ MAC, Switch & Định tuyến Router» (Mạng máy tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Địa chỉ MAC, Switch & Định tuyến Router trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Địa chỉ MAC, Switch & Định tuyến Router thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Địa chỉ MAC, Switch & Định tuyến Router:
Công thức và định nghĩa Địa chỉ MAC, Switch & Định tuyến Router.
Áp dụng Địa chỉ MAC, Switch & Định tuyến Router trong Địa chỉ MAC, Switch & Định tuyến Router.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Địa chỉ MAC, Switch & Định tuyến Router, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.

MTU Ethernet 1500 byte. TTL giảm mỗi router; TTL=0 thì drop. NAT chuyển IP private ↔ public. TCP sequence/ack đảm bảo thứ tự. UDP header 8 byte, không handshake. Subnet mask AND với IP cho network address.

Liên hệ Địa chỉ MAC, Switch & Định tuyến Router với Địa chỉ MAC, Switch & Định tuyến Router: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Ví dụ và bài tập Địa chỉ MAC, Switch & Định tuyến Router:
Ví dụ Địa chỉ MAC, Switch & Định tuyến Router với số liệu.
Bài tập mở rộng Địa chỉ MAC, Switch & Định tuyến Router.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Địa chỉ MAC, Switch & Định tuyến Router:
Thuộc Địa chỉ MAC, Switch & Định tuyến Router.
Liên kết Địa chỉ MAC, Switch & Định tuyến Router.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-4-lesson-2': [
		`Bài tập vận dụng Địa chỉ MAC, Switch & Định tuyến Router (Địa chỉ MAC, Switch & Định tuyến Router). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Mạng máy tính đánh giá khả năng vận dụng Địa chỉ MAC, Switch & Định tuyến Router qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Địa chỉ MAC, Switch & Định tuyến Router:
Đọc đề Địa chỉ MAC, Switch & Định tuyến Router.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

MTU Ethernet 1500 byte. TTL giảm mỗi router; TTL=0 thì drop. NAT chuyển IP private ↔ public. TCP sequence/ack đảm bảo thứ tự. UDP header 8 byte, không handshake. Subnet mask AND với IP cho network address.

Liên hệ Địa chỉ MAC, Switch & Định tuyến Router với Địa chỉ MAC, Switch & Định tuyến Router: áp dụng công thức vào bài tập có số liệu cụ thể, trình bày đủ bước và đơn vị.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Địa chỉ MAC, Switch & Định tuyến Router.
Bài 2 đổi số.
Bài 3 tổng hợp Địa chỉ MAC, Switch & Định tuyến Router.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Địa chỉ MAC, Switch & Định tuyến Router: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Địa chỉ MAC, Switch & Định tuyến Router:
Luyện 5 bài Địa chỉ MAC, Switch & Định tuyến Router.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_networks:chapter-5-lesson-1': [
		`Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS là nội dung cốt lõi trong chương «Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS» (Mạng máy tính). Bài học giải thích khái niệm, ký hiệu và vai trò của Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS:
Công thức và định nghĩa Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS.
Áp dụng Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS trong Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS:
Ví dụ Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS với số liệu.
Bài tập mở rộng Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS:
Thuộc Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS.
Liên kết Bộ 100 câu hỏi ôn thi Mạng máy tính HCMUS.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_discrete-math:chapter-1-lesson-1': [
		`Bảng chân trị, Tương đương logic & Luật De Morgan là nội dung cốt lõi trong chương «Logic mệnh đề, Bảng chân trị & Luật De Morgan» (Toán rời rạc). Bài học giải thích khái niệm, ký hiệu và vai trò của Bảng chân trị, Tương đương logic & Luật De Morgan trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Bảng chân trị, Tương đương logic & Luật De Morgan thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Bảng chân trị, Tương đương logic & Luật De Morgan:
¬∧∨→; De Morgan.
P→Q≡¬P∨Q.
Áp dụng Bảng chân trị, Tương đương logic & Luật De Morgan trong Logic mệnh đề, Bảng chân trị & Luật De Morgan.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Logic mệnh đề, Bảng chân trị & Luật De Morgan, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Bảng chân trị, Tương đương logic & Luật De Morgan:
Bảng chân trị 3 biến.
Bài tập mở rộng Bảng chân trị, Tương đương logic & Luật De Morgan.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.

Ví dụ bổ sung Bảng chân trị, Tương đương logic & Luật De Morgan: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Bảng chân trị, Tương đương logic & Luật De Morgan:
De Morgan đổi AND/OR.
Liên kết Logic mệnh đề, Bảng chân trị & Luật De Morgan.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_discrete-math:chapter-1-lesson-2': [
		`Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal là nội dung cốt lõi trong chương «Logic mệnh đề, Bảng chân trị & Luật De Morgan» (Toán rời rạc). Bài học giải thích khái niệm, ký hiệu và vai trò của Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal:
¬∧∨→; De Morgan.
P→Q≡¬P∨Q.
Áp dụng Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal trong Logic mệnh đề, Bảng chân trị & Luật De Morgan.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Logic mệnh đề, Bảng chân trị & Luật De Morgan, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal:
Bảng chân trị 3 biến.
Bài tập mở rộng Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.

Ví dụ bổ sung Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Thuật toán Dijkstra và Cây khung nhỏ nhất Kruskal:
De Morgan đổi AND/OR.
Liên kết Logic mệnh đề, Bảng chân trị & Luật De Morgan.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_discrete-math:chapter-2-lesson-1': [
		`Quan hệ tương đương, Poset & Bìa Karnaugh là nội dung cốt lõi trong chương «Quan hệ tương đương, Poset & Bìa Karnaugh» (Toán rời rạc). Bài học giải thích khái niệm, ký hiệu và vai trò của Quan hệ tương đương, Poset & Bìa Karnaugh trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Quan hệ tương đương, Poset & Bìa Karnaugh thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Quan hệ tương đương, Poset & Bìa Karnaugh:
Công thức và định nghĩa Quan hệ tương đương, Poset & Bìa Karnaugh.
Áp dụng Quan hệ tương đương, Poset & Bìa Karnaugh trong Quan hệ tương đương, Poset & Bìa Karnaugh.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Quan hệ tương đương, Poset & Bìa Karnaugh, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Quan hệ tương đương, Poset & Bìa Karnaugh:
Ví dụ Quan hệ tương đương, Poset & Bìa Karnaugh với số liệu.
Bài tập mở rộng Quan hệ tương đương, Poset & Bìa Karnaugh.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.

Ví dụ bổ sung Quan hệ tương đương, Poset & Bìa Karnaugh: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Quan hệ tương đương, Poset & Bìa Karnaugh:
Thuộc Quan hệ tương đương, Poset & Bìa Karnaugh.
Liên kết Quan hệ tương đương, Poset & Bìa Karnaugh.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_discrete-math:chapter-2-lesson-2': [
		`Bài tập vận dụng Quan hệ tương đương, Poset & Bìa Karnaugh (Quan hệ tương đương, Poset & Bìa Karnaugh). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Toán rời rạc đánh giá khả năng vận dụng Quan hệ tương đương, Poset & Bìa Karnaugh qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Quan hệ tương đương, Poset & Bìa Karnaugh:
Đọc đề Quan hệ tương đương, Poset & Bìa Karnaugh.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Dạng bài Quan hệ tương đương, Poset & Bìa Karnaugh trong đề HCMUS/Bách Khoa: câu trắc nghiệm định nghĩa, bài tập tính thay số, và câu hỏi tổng hợp liên chương. Mỗi dạng cần luyện ít nhất 5 bài có đáp án.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Quan hệ tương đương, Poset & Bìa Karnaugh.
Bài 2 đổi số.
Bài 3 tổng hợp Quan hệ tương đương, Poset & Bìa Karnaugh.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Quan hệ tương đương, Poset & Bìa Karnaugh: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Quan hệ tương đương, Poset & Bìa Karnaugh:
Luyện 5 bài Quan hệ tương đương, Poset & Bìa Karnaugh.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.

Ôn tập Quan hệ tương đương, Poset & Bìa Karnaugh: liệt kê công thức chính, làm 3 bài tập đại diện, tự giải thích từng bước bằng lời nói.`,
	],
	'hcmus_discrete-math:chapter-3-lesson-1': [
		`Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay là nội dung cốt lõi trong chương «Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay» (Toán rời rạc). Bài học giải thích khái niệm, ký hiệu và vai trò của Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay:
Công thức và định nghĩa Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.
Áp dụng Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay trong Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay:
Ví dụ Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay với số liệu.
Bài tập mở rộng Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.`,
		`Tóm tắt Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay:
Thuộc Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.
Liên kết Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_discrete-math:chapter-3-lesson-2': [
		`Bài tập vận dụng Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay (Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Toán rời rạc đánh giá khả năng vận dụng Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay:
Đọc đề Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Dạng bài Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay trong đề HCMUS/Bách Khoa: câu trắc nghiệm định nghĩa, bài tập tính thay số, và câu hỏi tổng hợp liên chương. Mỗi dạng cần luyện ít nhất 5 bài có đáp án.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.
Bài 2 đổi số.
Bài 3 tổng hợp Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay:
Luyện 5 bài Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.

Ôn tập Lý thuyết Đồ thị: Euler, Hamilton, Bổ đề bắt tay: liệt kê công thức chính, làm 3 bài tập đại diện, tự giải thích từng bước bằng lời nói.`,
	],
	'hcmus_discrete-math:chapter-4-lesson-1': [
		`Thuật toán Dijkstra & Cây khung Kruskal/Prim là nội dung cốt lõi trong chương «Thuật toán Dijkstra & Cây khung Kruskal/Prim» (Toán rời rạc). Bài học giải thích khái niệm, ký hiệu và vai trò của Thuật toán Dijkstra & Cây khung Kruskal/Prim trong chương trình đại học kỹ thuật. Kiến thức này liên kết trực tiếp với bài tập tính toán và câu hỏi đề thi — sinh viên cần nắm cả định nghĩa lẫn cách vận dụng số. Ở các môn STEM, Thuật toán Dijkstra & Cây khung Kruskal/Prim thường xuất hiện dưới dạng: (1) câu lý thuyết trắc nghiệm; (2) bài tập thay số vào công thức; (3) bài tổng hợp kết hợp nhiều ý trong cùng chương.`,
		`Lý thuyết Thuật toán Dijkstra & Cây khung Kruskal/Prim:
SSSP không âm; O((V+E)log V).
Kruskal MST + Union-Find.
Áp dụng Thuật toán Dijkstra & Cây khung Kruskal/Prim trong Thuật toán Dijkstra & Cây khung Kruskal/Prim.

Khi áp dụng, luôn kiểm tra điều kiện giả thiết của công thức (đơn vị SI, miền xác định, giới hạn mô hình). Trong đề thi Thuật toán Dijkstra & Cây khung Kruskal/Prim, cần trình bày rõ: giả thiết → công thức → thay số → kết luận. So sánh với trường hợp đặc biệt (bằng 0, tiến tới vô cùng, đối xứng) giúp phát hiện sai sót tính toán.`,
		`Ví dụ và bài tập Thuật toán Dijkstra & Cây khung Kruskal/Prim:
Trace dist[] từ nguồn.
Bài tập mở rộng Thuật toán Dijkstra & Cây khung Kruskal/Prim.

Khi giải, trình bày theo bước: tóm tắt đề, chọn công thức, thay số, tính kết quả, nhận xét. Với bài nhiều ý, chia nhỏ và đánh dấu kết quả trung gian. Tự đặt thêm một biến thể đề (đổi số liệu) để kiểm tra mức độ hiểu.

Ví dụ bổ sung Thuật toán Dijkstra & Cây khung Kruskal/Prim: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Thuật toán Dijkstra & Cây khung Kruskal/Prim:
Dijkstra ≠ MST.
Liên kết Thuật toán Dijkstra & Cây khung Kruskal/Prim.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.`,
	],
	'hcmus_discrete-math:chapter-4-lesson-2': [
		`Bài tập vận dụng Thuật toán Dijkstra & Cây khung Kruskal/Prim (Thuật toán Dijkstra & Cây khung Kruskal/Prim). Mục tiêu: luyện kỹ năng giải bài từ cơ bản đến nâng cao với lời giải đầy đủ. Mỗi bài gồm: phát biểu đề, dữ liệu, lời giải từng bước và đáp số. Đây là dạng bài trọng tâm trong đề kiểm tra và thi cuối kỳ — cần vừa đúng kết quả vừa trình bày logic rõ ràng. Môn Toán rời rạc đánh giá khả năng vận dụng Thuật toán Dijkstra & Cây khung Kruskal/Prim qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Phương pháp giải bài Thuật toán Dijkstra & Cây khung Kruskal/Prim:
Đọc đề Thuật toán Dijkstra & Cây khung Kruskal/Prim.
Chọn công thức.
Giải từng bước.
Kiểm tra biên.

Lưu ý: đọc kỹ đơn vị; kiểm tra biên (n=0, mảng rỗng, nồng độ cực nhỏ); với code — test case ẩn thường ở biên. Không bỏ qua bước trung gian vì đề chấm theo lời giải.

Dạng bài Thuật toán Dijkstra & Cây khung Kruskal/Prim trong đề HCMUS/Bách Khoa: câu trắc nghiệm định nghĩa, bài tập tính thay số, và câu hỏi tổng hợp liên chương. Mỗi dạng cần luyện ít nhất 5 bài có đáp án.`,
		`Bài tập có lời giải:
Bài 1 cơ bản Thuật toán Dijkstra & Cây khung Kruskal/Prim.
Bài 2 đổi số.
Bài 3 tổng hợp Thuật toán Dijkstra & Cây khung Kruskal/Prim.

Sau mỗi bài, tự đặt câu hỏi «nếu đổi số liệu thì kết quả thay đổi thế nào?» để củng cố hiểu bài, không chỉ nhớ đáp án.

Ví dụ bổ sung Thuật toán Dijkstra & Cây khung Kruskal/Prim: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Thuật toán Dijkstra & Cây khung Kruskal/Prim:
Luyện 5 bài Thuật toán Dijkstra & Cây khung Kruskal/Prim.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.

Ôn tập Thuật toán Dijkstra & Cây khung Kruskal/Prim: liệt kê công thức chính, làm 3 bài tập đại diện, tự giải thích từng bước bằng lời nói.`,
	],
	'hcmus_discrete-math:chapter-5-lesson-1': [
		`Ôn thi Toán rời rạc — Đề thi cuối kỳ Toán rời rạc HCMUS (Đề thi cuối kỳ Toán rời rạc HCMUS). Đề thi đại học kỹ thuật thường gồm trắc nghiệm lý thuyết và bài tập tính toán/viết code. Thời gian 60–120 phút tùy môn. Sinh viên cần nắm công thức cốt lõi, luyện đề cũ và phân bổ thời gian hợp lý: làm câu quen trước, ghi công thức lên nháp, kiểm tra đơn vị trước khi chọn đáp án. Môn Toán rời rạc đánh giá khả năng vận dụng Đề thi cuối kỳ Toán rời rạc HCMUS qua bài tập và đề thi — cần luyện cả lý thuyết lẫn tính toán.`,
		`Cấu trúc đề và trọng tâm Đề thi cuối kỳ Toán rời rạc HCMUS:
Đề Toán rời rạc: lý thuyết + tính toán Đề thi cuối kỳ Toán rời rạc HCMUS.
Thời gian 60–120 phút.
Trọng tâm Đề thi cuối kỳ Toán rời rạc HCMUS.

Chiến lược: (1) quét nhanh toàn đề, đánh dấu câu dễ; (2) làm phần tính trước nếu tự tin; (3) dành 10 phút cuối kiểm tra đơn vị và câu chưa làm.

Dạng bài Đề thi cuối kỳ Toán rời rạc HCMUS trong đề HCMUS/Bách Khoa: câu trắc nghiệm định nghĩa, bài tập tính thay số, và câu hỏi tổng hợp liên chương. Mỗi dạng cần luyện ít nhất 5 bài có đáp án.`,
		`Câu hỏi mẫu Đề thi cuối kỳ Toán rời rạc HCMUS:
Câu lý thuyết Đề thi cuối kỳ Toán rời rạc HCMUS.
Câu tính thay số.
Câu tổng hợp Đề thi cuối kỳ Toán rời rạc HCMUS.

Với mỗi câu mẫu, tự biến thể: đổi số liệu, thêm điều kiện, hoặc hỏi ngược (cho kết quả tìm đầu vào).

Ví dụ bổ sung Đề thi cuối kỳ Toán rời rạc HCMUS: thay số vào công thức chính, tính kết quả, đối chiếu với đáp án. Với bài code: test n=0, n=1, n lớn. Với bài tính: kiểm tra đơn vị SI trước khi nộp.`,
		`Tóm tắt Đề thi cuối kỳ Toán rời rạc HCMUS:
Ôn đề cũ Đề thi cuối kỳ Toán rời rạc HCMUS.

Trước khi sang chương mới, tự giải lại các ví dụ không nhìn đáp án và giải thích bằng lời các công thức chính. Ghi chú lỗi thường gặp ở chủ đề này để tránh lặp lại khi làm đề.

Ôn tập Đề thi cuối kỳ Toán rời rạc HCMUS: liệt kê công thức chính, làm 3 bài tập đại diện, tự giải thích từng bước bằng lời nói.`,
	],
};

function lessonKey(lesson) {
	return `${lesson.course_id}:${lesson.lesson_id}`;
}

function generateStemLesson(lesson) {
	const key = lessonKey(lesson);
	if (LESSONS[key]) return LESSONS[key];
	const topic = topicFromLesson(lesson);
	const chapter = chapterShort(lesson.chapter_title);
	if (isExamChapter(lesson.chapter_title, lesson.lesson_title)) {
		return [
			`Ôn thi ${topic} (${chapter}): cấu trúc đề và chiến lược làm bài.`,
			`Trọng tâm lý thuyết và bài tập ${topic}.`,
			`Câu mẫu lý thuyết, tính toán và tổng hợp.`,
			`Ôn đề cũ; thuộc công thức ${topic}.`,
		];
	}
	if (isPracticeLesson(lesson.lesson_title)) {
		return [
			`Bài tập ${topic} (${chapter}) với lời giải chi tiết.`,
			`Phương pháp: đọc đề, chọn công thức, giải từng bước.`,
			`Bài cơ bản, trung bình và nâng cao.`,
			`Luyện 5+ bài/dạng ${topic}.`,
		];
	}
	return [
		`Lý thuyết ${topic} — ${chapter}.`,
		`Định nghĩa, công thức ${topic}.`,
		`Ví dụ minh họa ${topic}.`,
		`Tóm tắt ${topic}.`,
	];
}

module.exports = generateStemLesson;
