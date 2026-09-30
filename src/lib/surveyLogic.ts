/**

 * surveyLogic.ts — LOGIC NGHIỆP VỤ CỦA WEB KHẢO SÁT BWS–DCE

 * Đề tài: Rào cản chuyển đổi từ xe máy xăng sang xe máy điện của người trẻ tại TP.HCM

 *

 * File này là "nguồn sự thật" cho mọi quy tắc của khảo sát. Giao diện (Next.js) và

 * API chỉ gọi các hàm ở đây; không viết lại quy tắc ở chỗ khác.

 *

 * Nội dung:

 *   §1  Cấu hình chung và kiểu dữ liệu

 *   §2  Bộ sinh số ngẫu nhiên có seed (tái lập được)

 *   §3  Sàng lọc S1–S7

 *   §4  Phân nhóm cân bằng (phiên bản A/B, khối K1–K3)

 *   §5  Định mức (quota)

 *   §6  Luồng trang (page flow) theo phiên bản, đợt khảo sát

 *   §7  BWS: thiết kế BIBD, xáo trộn, kiểm tra câu trả lời, tính điểm

 *   §8  DCE: thuộc tính, mức, file thiết kế, hiển thị thẻ, thẻ kiểm tra trội

 *   §9  Thang đo Likert, câu kiểm tra chú ý, điều kiện hiển thị

 *   §10 Thời gian và cờ chất lượng

 *   §11 Biến dẫn xuất (LEZ, điểm thang đo)

 *   §12 Xuất dữ liệu: dạng rộng, dạng dài Apollo, dạng dài BWS

 *   §13 Luật chọn 2 thuộc tính linh hoạt sau BWS Đợt 1

 *   §14 Tự kiểm tra (chạy: npx tsx surveyLogic.ts)

 *

 * Không có phần nào ở đây ước lượng mô hình lựa chọn: việc đó thuộc về R/Apollo.

 */



// ═══════════════════════════════════════════════════════════════════════════

// §1. CẤU HÌNH CHUNG VÀ KIỂU DỮ LIỆU

// ═══════════════════════════════════════════════════════════════════════════



export const CONFIG = {

  targetValid: 600,          // mục tiêu phiếu hợp lệ của đợt chính thức

  bwsR: 4,                   // số lần mỗi rào cản xuất hiện (BIBD r)

  dceCardsPerBlock: 8,

  dceBlocks: ["K1", "K2", "K3"] as const,

  inferredValuationPositions: [3, 6], // vị trí hiển thị có câu "người trẻ điển hình sẽ chọn gì"

  lezFeeLevels: [0, 100, 200],        // nghìn đồng/tháng, chỉnh được ở trang quản trị

  fuelCostRange: [50, 5000],          // A2, nghìn đồng/tháng

  speederRatio: 1 / 3,                // nhanh hơn 1/3 trung vị → gắn cờ

  minMedianSample: 30,                // chưa đủ 30 phiếu thì chưa tính cờ speeder

  attentionCorrect: "green",

} as const;



export type Channel = "online" | "offline";

export type OrderVersion = "A" | "B";   // A: BWS → DCE; B: DCE → BWS

export type Block = (typeof CONFIG.dceBlocks)[number];

export type Wave = "pilot" | "main";   // pilot = BWS Đợt 1 (?wave=1), bỏ DCE



/** Câu trả lời lưu theo mã câu hỏi. Giá trị là mã lựa chọn (string), số, hoặc mảng mã. */

export type Answers = Record<string, string | number | string[] | undefined>;



export interface BwsResponse {

  set: string;          // "C1".."C13"

  displayOrder: number; // vị trí hiển thị 1..13

  items: string[];      // 4 mã rào cản theo đúng thứ tự hiển thị trên màn hình

  best?: string;

  worst?: string;

  msOnScreen?: number;

}



export interface DceResponse {

  card: number;          // số thẻ trong khối (theo file thiết kế)

  position: number;      // vị trí hiển thị 1..8

  choice?: "A" | "B" | "OPT";

  certainty?: number;    // 1..10

  inferred?: "A" | "B" | "OPT"; // chỉ ở vị trí 3 và 6

  msOnScreen?: number;

}



export interface Respondent {

  id: string;

  seed: number;

  channel: Channel;

  wave: Wave;

  orderVersion?: OrderVersion;

  block?: Block;          // không có ở pilot

  bwsSetOrder?: string[]; // thứ tự hiển thị 13 tập

  bwsItemOrder?: Record<string, string[]>; // thứ tự 4 lý do trong từng tập

  dceCardOrder?: number[];                 // thứ tự thẻ trong khối

  likertOrder?: Record<LikertGroup, string[]>;

  answers: Answers;

  bws: BwsResponse[];

  dce: DceResponse[];

  pageTimes: Record<string, { enter: number; leave?: number }>;

  status: "in_progress" | "screened_out" | "quota_full" | "complete" | "declined";

  screenOutAt?: string;

  fingerprintHash?: string;

  startedAt: number;

  completedAt?: number;

  flags?: QualityFlags;

  adminDecision?: { keep: boolean; reason: string; by: string; at: number };

}



// ═══════════════════════════════════════════════════════════════════════════

// §2. SỐ NGẪU NHIÊN CÓ SEED

//     Mỗi người có một seed lưu trong DB → tái lập được toàn bộ thứ tự hiển thị.

// ═══════════════════════════════════════════════════════════════════════════



export function mulberry32(seed: number): () => number {

  let a = seed >>> 0;

  return () => {

    a = (a + 0x6d2b79f5) >>> 0;

    let t = a;

    t = Math.imul(t ^ (t >>> 15), t | 1);

    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  };

}



export function shuffle<T>(arr: readonly T[], rng: () => number): T[] {

  const a = arr.slice();

  for (let i = a.length - 1; i > 0; i--) {

    const j = Math.floor(rng() * (i + 1));

    [a[i], a[j]] = [a[j], a[i]];

  }

  return a;

}



/** Tách seed con cho từng mục đích để việc thêm/bớt một bước xáo trộn không làm đổi các bước khác. */

export function subRng(seed: number, label: string): () => number {

  let h = seed >>> 0;

  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 2654435761) >>> 0;

  return mulberry32(h);

}



// ═══════════════════════════════════════════════════════════════════════════

// §3. SÀNG LỌC S1–S7

//     Mỗi câu một màn hình. Chọn phương án loại → dừng ngay, lưu screenOutAt.

// ═══════════════════════════════════════════════════════════════════════════



export interface Option { code: string; label: string; exit?: boolean }

export interface ChoiceQuestion { id: string; text: string; options: Option[]; multi?: boolean; max?: number }



export const SCREENING: ChoiceQuestion[] = [

  { id: "S1", text: "Anh/chị bao nhiêu tuổi?", options: [

    { code: "u18", label: "Dưới 18", exit: true },

    { code: "18_24", label: "18–24" },

    { code: "25_30", label: "25–30" },

    { code: "o30", label: "Trên 30", exit: true },

  ]},

  { id: "S2", text: "Anh/chị hiện sống hoặc làm việc thường xuyên tại TP.HCM không?", options: [

    { code: "yes", label: "Có" }, { code: "no", label: "Không", exit: true },

  ]},

  { id: "S3", text: "Thu nhập cá nhân hằng tháng của anh/chị từ lao động (toàn thời gian, bán thời gian, tự doanh, freelance) khoảng bao nhiêu?", options: [

    { code: "u7", label: "Dưới 7 triệu đồng", exit: true },

    { code: "ge7", label: "Từ 7 triệu đồng trở lên" },

  ]},

  { id: "S4", text: "Anh/chị có tự chi trả phần lớn chi tiêu cá nhân hằng tháng (ăn ở, đi lại, sinh hoạt) không?", options: [

    { code: "yes", label: "Có" }, { code: "no", label: "Không", exit: true },

  ]},

  { id: "S5", text: "Ai là người quyết định việc mua phương tiện của anh/chị?", options: [

    { code: "self", label: "Tôi tự quyết định" },

    { code: "joint", label: "Tôi cùng quyết định với gia đình/người thân" },

    { code: "other", label: "Người khác quyết định", exit: true },

  ]},

  { id: "S6", text: "Phương tiện anh/chị sử dụng thường xuyên nhất là gì?", options: [

    { code: "petrol", label: "Xe máy xăng" },

    { code: "ev", label: "Xe máy điện", exit: true },

    { code: "other", label: "Phương tiện khác (ô tô, xe buýt, metro, xe công nghệ, xe đạp)", exit: true },

  ]},

  { id: "S7", text: "Anh/chị đã từng tham gia khảo sát hoặc phỏng vấn của đề tài này chưa?", options: [

    { code: "no", label: "Chưa" }, { code: "yes", label: "Đã tham gia", exit: true },

  ]},

];



/** Trả về "pass" | "exit" | "pending" cho một câu sàng lọc. */

export function screenAnswer(qid: string, code: string): "pass" | "exit" {

  const q = SCREENING.find((x) => x.id === qid);

  if (!q) throw new Error(`Không có câu sàng lọc ${qid}`);

  const opt = q.options.find((o) => o.code === code);

  if (!opt) throw new Error(`Mã lựa chọn không hợp lệ ${qid}=${code}`);

  return opt.exit ? "exit" : "pass";

}



/** Kiểm tra toàn bộ sàng lọc; trả về mã câu đầu tiên làm người trả lời bị loại, hoặc null nếu đạt. */

export function screeningResult(ans: Answers): { passed: boolean; failedAt: string | null; complete: boolean } {

  for (const q of SCREENING) {

    const v = ans[q.id];

    if (v === undefined) return { passed: false, failedAt: null, complete: false };

    if (screenAnswer(q.id, String(v)) === "exit") return { passed: false, failedAt: q.id, complete: true };

  }

  return { passed: true, failedAt: null, complete: true };

}



// ═══════════════════════════════════════════════════════════════════════════

// §4. PHÂN NHÓM CÂN BẰNG

//     Chạy ở máy chủ ngay sau khi qua sàng lọc, trong một transaction có khóa

//     (SELECT … FOR UPDATE trên bảng đếm) để hai người vào cùng lúc không lệch.

//     Đếm theo số người ĐÃ ĐƯỢC GÁN (kể cả đang làm), không chỉ phiếu hoàn thành,

//     vì nếu chỉ đếm phiếu hoàn thành thì nhóm đang có nhiều người làm dở sẽ bị gán thêm.

// ═══════════════════════════════════════════════════════════════════════════



export function balancedPick<T extends string>(levels: readonly T[], counts: Partial<Record<T, number>>, rng: () => number): T {

  const min = Math.min(...levels.map((l) => counts[l] ?? 0));

  const tied = levels.filter((l) => (counts[l] ?? 0) === min);

  return tied[Math.floor(rng() * tied.length)];

}



export interface AssignmentCounts {

  version: Partial<Record<OrderVersion, number>>;

  block: Partial<Record<Block, number>>;

}



/** Gán phiên bản, khối và toàn bộ thứ tự hiển thị cho một người đã qua sàng lọc. Hàm thuần: không sửa counts. */

export function assign(r: Pick<Respondent, "seed" | "wave">, counts: AssignmentCounts) {

  const rng = subRng(r.seed, "assign");

  const orderVersion = balancedPick(["A", "B"] as const, counts.version, rng);

  // Khối DCE gán độc lập với phiên bản. Ở pilot không có DCE nên không gán khối.

  const block = r.wave === "main" ? balancedPick(CONFIG.dceBlocks, counts.block, rng) : undefined;



  const bwsSetOrder = shuffle(BWS_SETS.map((s) => s.id), subRng(r.seed, "bws-sets"));

  const bwsItemOrder: Record<string, string[]> = {};

  for (const s of BWS_SETS) bwsItemOrder[s.id] = shuffle(s.items, subRng(r.seed, "bws-items-" + s.id));



  const dceCardOrder = r.wave === "main"

    ? shuffle(Array.from({ length: CONFIG.dceCardsPerBlock }, (_, i) => i + 1), subRng(r.seed, "dce-cards"))

    : undefined;



  const likertOrder = {} as Record<LikertGroup, string[]>;

  for (const g of LIKERT_GROUPS) likertOrder[g] = shuffle(LIKERT.filter((x) => x.group === g).map((x) => x.id), subRng(r.seed, "likert-" + g));



  return { orderVersion, block, bwsSetOrder, bwsItemOrder, dceCardOrder, likertOrder };

}



// ═══════════════════════════════════════════════════════════════════════════

// §5. ĐỊNH MỨC (QUOTA)

//     Mọi định mức là "tối thiểu x" trên tổng mục tiêu N. Cách chặn: một người

//     KHÔNG thuộc nhóm g bị dừng khi số phiếu hợp lệ không thuộc g đã chạm N − min_g

//     (vì phần còn lại phải dành cho nhóm g).

//     Thời điểm kiểm tra: ngay khi biến dùng để phân loại vừa có giá trị.

//     - Tuổi: sau S1.

//     - LEZ: sau A5 (cần A4 và A5).

//     - Thu nhập ≥ 10 triệu: F5 nằm cuối phiếu, nếu chặn ở đó sẽ bỏ phí gần 20 phút của

//       người trả lời. Vì vậy quota thu nhập chỉ THEO DÕI và cảnh báo trên trang quản trị

//       (ghi chú khác với prompt gốc: không chặn theo thu nhập).

// ═══════════════════════════════════════════════════════════════════════════



export interface QuotaRule {

  id: string;

  label: string;

  min: number;                        // số phiếu tối thiểu của nhóm

  inGroup: (r: Respondent, wards: WardMap) => boolean | undefined; // undefined = chưa đủ thông tin

  checkAfter: string;                 // mã câu hỏi mà sau đó mới kiểm tra

  enforce: boolean;                   // false = chỉ theo dõi

}



export const QUOTAS: QuotaRule[] = [

  { id: "age_18_24", label: "Tuổi 18–24 ≥ 40%", min: 240, checkAfter: "S1", enforce: true,

    inGroup: (r) => (r.answers.S1 === undefined ? undefined : r.answers.S1 === "18_24") },

  { id: "age_25_30", label: "Tuổi 25–30 ≥ 40%", min: 240, checkAfter: "S1", enforce: true,

    inGroup: (r) => (r.answers.S1 === undefined ? undefined : r.answers.S1 === "25_30") },

  { id: "lez_res", label: "Cư trú trong LEZ ≥ 120", min: 120, checkAfter: "A5", enforce: true,

    inGroup: (r, w) => lezGroup(r.answers, w)?.residence },

  { id: "lez_work_only", label: "Chỉ làm việc trong LEZ ≥ 120", min: 120, checkAfter: "A5", enforce: true,

    inGroup: (r, w) => { const g = lezGroup(r.answers, w); return g ? g.workplace && !g.residence : undefined; } },

  { id: "inc_ge10", label: "Thu nhập ≥ 10 triệu ≥ 50%", min: 300, checkAfter: "F5", enforce: false,

    inGroup: (r) => (r.answers.F5 === undefined ? undefined : r.answers.F5 !== "7_10") },

];



/** validPool: các phiếu hoàn thành và chưa bị loại ở đợt chính thức. */

export function quotaBlocks(r: Respondent, justAnswered: string, validPool: Respondent[], wards: WardMap, N = CONFIG.targetValid): QuotaRule | null {

  if (r.wave !== "main") return null;

  for (const q of QUOTAS) {

    if (!q.enforce || q.checkAfter !== justAnswered) continue;

    const mine = q.inGroup(r, wards);

    if (mine === undefined || mine) continue;

    const outside = validPool.filter((p) => q.inGroup(p, wards) === false).length;

    if (outside >= N - q.min) return q;

  }

  return null;

}



export function quotaStatus(validPool: Respondent[], wards: WardMap) {

  return QUOTAS.map((q) => {

    const n = validPool.filter((p) => q.inGroup(p, wards) === true).length;

    return { id: q.id, label: q.label, n, min: q.min, met: n >= q.min, enforce: q.enforce };

  });

}



// ═══════════════════════════════════════════════════════════════════════════

// §6. LUỒNG TRANG

//     Luồng là danh sách mã trang, sinh lại mỗi lần từ trạng thái người trả lời.

//     Trang có điều kiện (D11) được lọc bằng isPageVisible.

// ═══════════════════════════════════════════════════════════════════════════



export type PageId = string;



export function buildFlow(r: Respondent): PageId[] {

  const flow: PageId[] = ["INTRO", ...SCREENING.map((q) => q.id)];

  flow.push("A1", "A2", "A3", "A4", "A5", "A6", "A7", "INFO_LEZ", "A8");

  flow.push("RD");                                     // RD1–RD5 luôn trước BWS và DCE



  const bwsPages = ["BWS_INTRO", ...(r.bwsSetOrder ?? BWS_SETS.map((s) => s.id)).map((id) => `BWS_${id}`)];

  const dcePages = r.wave === "main"

    ? ["DCE_INTRO", ...Array.from({ length: CONFIG.dceCardsPerBlock }, (_, i) => `DCE_P${i + 1}`), "D9", "D10", "D11"]

    : [];

  if (r.orderVersion === "B") flow.push(...dcePages, ...bwsPages);

  else flow.push(...bwsPages, ...dcePages);



  // Quan điểm: SK → FR → CHECK → SD (câu kiểm tra đặt giữa để bắt người bấm liên tục)

  flow.push("LIKERT_SK", "LIKERT_FR", "CHECK", "LIKERT_SD");

  flow.push("F1", "F2", "F3", "F4", "F5", "F6", "F7", "THANKS");

  return flow.filter((p) => isPageVisible(p, r));

}



export function isPageVisible(page: PageId, r: Respondent): boolean {

  if (page === "D11") return r.dce.some((d) => d.choice === "OPT"); // chỉ khi từng chọn giữ xe xăng

  return true;

}



/** Trang kế tiếp sau trang hiện tại, có xét sàng lọc và định mức. */

export function nextPage(r: Respondent, current: PageId, ctx: { validPool: Respondent[]; wards: WardMap }):

  { page: PageId } | { end: "screened_out" | "quota_full" | "declined"; reason: string } {

  if (current === "INTRO" && r.answers.CONSENT !== "yes") return { end: "declined", reason: "Không đồng ý tham gia" };

  if (/^S\d$/.test(current)) {

    const v = r.answers[current];

    if (v !== undefined && screenAnswer(current, String(v)) === "exit") return { end: "screened_out", reason: current };

  }

  const q = quotaBlocks(r, current, ctx.validPool, ctx.wards);

  if (q) return { end: "quota_full", reason: q.id };

  const flow = buildFlow(r);            // tính lại để D11 xuất hiện/biến mất đúng lúc

  const i = flow.indexOf(current);

  if (i < 0 || i === flow.length - 1) return { page: "THANKS" };

  return { page: flow[i + 1] };

}



/** Tiến độ cho thanh tiến trình (0..1). */

export function progress(r: Respondent, current: PageId): number {

  const flow = buildFlow(r);

  const i = Math.max(0, flow.indexOf(current));

  return flow.length <= 1 ? 1 : i / (flow.length - 1);

}



// ═══════════════════════════════════════════════════════════════════════════

// §7. BWS

// ═══════════════════════════════════════════════════════════════════════════



export type BarrierGroup = "fin" | "infra" | "tech" | "habit" | "skep";

export const GROUP_LABEL: Record<BarrierGroup, string> = {

  fin: "Tài chính", infra: "Hạ tầng", tech: "Kỹ thuật – an toàn", habit: "Thói quen – hiện trạng", skep: "Hoài nghi môi trường",

};

export const REFERENCE_GROUP: BarrierGroup = "habit"; // bỏ khỏi hồi quy vì điểm BWS cá nhân có tổng bằng 0



export const BARRIERS: { id: string; text: string; group: BarrierGroup }[] = [

  { id: "R1", group: "fin", text: "Giá mua xe điện cao hơn xe xăng cùng phân khúc" },

  { id: "R2", group: "fin", text: "Phí thuê pin hằng tháng là gánh nặng lâu dài và khiến tôi phụ thuộc vào hãng" },

  { id: "R3", group: "fin", text: "Chi phí thay pin cao và khó dự đoán" },

  { id: "R4", group: "fin", text: "Xe điện mất giá nhanh, khó bán lại" },

  { id: "R5", group: "infra", text: "Trạm sạc/đổi pin chưa đủ dày trên các tuyến tôi thường đi" },

  { id: "R6", group: "infra", text: "Nơi ở (chung cư, nhà trọ) không cho sạc hoặc không có chỗ sạc" },

  { id: "R7", group: "tech", text: "Quãng đường mỗi lần sạc không đủ cho nhu cầu của tôi" },

  { id: "R8", group: "tech", text: "Tôi lo ngại cháy nổ pin và xe hư hỏng khi đi qua đường ngập" },

  { id: "R9", group: "habit", text: "Xe xăng hiện tại vẫn dùng tốt, đổi xe lúc này là lãng phí" },

  { id: "R10", group: "skep", text: "Pin cũ có thể không được thu hồi, tái chế đúng cách" },

  { id: "R11", group: "skep", text: "Điện để sạc xe chủ yếu đến từ nhiệt điện than" },

  { id: "R12", group: "skep", text: "Sản xuất pin gây phát thải và khai thác khoáng sản lớn" },

  { id: "R13", group: "skep", text: "Tuyên bố “xanh” của các hãng xe chủ yếu là chiêu marketing" },

];



/** 13 tập sinh từ tập sai phân {0,1,3,9} mod 13 (R(i+1) ứng với phần tử i). */

export const BWS_SETS: { id: string; items: string[] }[] = Array.from({ length: 13 }, (_, t) => ({

  id: `C${t + 1}`,

  items: [0, 1, 3, 9].map((d) => `R${((t + d) % 13) + 1}`),

}));



export function checkBibd(sets = BWS_SETS) {

  const occ: Record<string, number> = {};

  const pair: Record<string, number> = {};

  for (const s of sets) {

    for (const a of s.items) occ[a] = (occ[a] ?? 0) + 1;

    for (let i = 0; i < s.items.length; i++)

      for (let j = i + 1; j < s.items.length; j++) {

        const k = [s.items[i], s.items[j]].sort().join("-");

        pair[k] = (pair[k] ?? 0) + 1;

      }

  }

  const occOk = BARRIERS.every((b) => occ[b.id] === CONFIG.bwsR);

  const pairOk = Object.keys(pair).length === (13 * 12) / 2 && Object.values(pair).every((v) => v === 1);

  return { occOk, pairOk };

}



/** Xử lý một lần bấm trên màn hình BWS. Chọn lại → bỏ chọn cũ; chọn lý do đang là lựa chọn đối lập → chuyển sang. */

export function bwsTap(state: { best?: string; worst?: string }, item: string, role: "best" | "worst") {

  const next = { ...state };

  if (role === "best") {

    next.best = state.best === item ? undefined : item;

    if (next.worst === item) next.worst = undefined;

  } else {

    next.worst = state.worst === item ? undefined : item;

    if (next.best === item) next.best = undefined;

  }

  return next;

}



export function bwsValid(resp: { items: string[]; best?: string; worst?: string }): boolean {

  return !!resp.best && !!resp.worst && resp.best !== resp.worst &&

    resp.items.includes(resp.best) && resp.items.includes(resp.worst);

}



/** Điểm BWS cá nhân: BW_nj = best − worst, trong khoảng [−4, 4]. */

export function bwsIndividual(bws: BwsResponse[]): Record<string, number> {

  const s: Record<string, number> = Object.fromEntries(BARRIERS.map((b) => [b.id, 0]));

  for (const x of bws) {

    if (!bwsValid(x)) continue;

    s[x.best!] += 1;

    s[x.worst!] -= 1;

  }

  return s;

}



/** 5 chỉ số nhóm = trung bình điểm cá nhân của các rào cản trong nhóm (chia thêm cho r để về [−1, 1]). */

export function bwsGroupIndex(bws: BwsResponse[]): Record<BarrierGroup, number> {

  const ind = bwsIndividual(bws);

  const out = {} as Record<BarrierGroup, number>;

  for (const g of Object.keys(GROUP_LABEL) as BarrierGroup[]) {

    const ids = BARRIERS.filter((b) => b.group === g).map((b) => b.id);

    out[g] = ids.reduce((a, id) => a + ind[id], 0) / ids.length / CONFIG.bwsR;

  }

  return out;

}



/** Điểm đếm tổng hợp cho N người: B, W, BW = (B − W)/(N·r), chuẩn hóa, sqrt(B/W). Phải khớp với R. */

export function bwsAggregate(people: BwsResponse[][]) {

  const N = people.length;

  const B: Record<string, number> = {}, W: Record<string, number> = {};

  for (const b of BARRIERS) { B[b.id] = 0; W[b.id] = 0; }

  for (const p of people) for (const x of p) if (bwsValid(x)) { B[x.best!]++; W[x.worst!]++; }

  const rows = BARRIERS.map((b) => {

    const bw = N ? (B[b.id] - W[b.id]) / (N * CONFIG.bwsR) : 0;

    // sqrt(B/W) với hiệu chỉnh 0,5 để tránh chia cho 0; phải dùng đúng quy ước này ở R.

    const sqrtBW = Math.sqrt((B[b.id] + 0.5) / (W[b.id] + 0.5));

    return { id: b.id, group: b.group, text: b.text, B: B[b.id], W: W[b.id], BW: bw, sqrtBW };

  });

  const maxSqrt = Math.max(...rows.map((r) => r.sqrtBW));

  return rows

    .map((r) => ({ ...r, sqrtBWstd: (r.sqrtBW / maxSqrt) * 100 }))

    .sort((a, b) => b.BW - a.BW);

}



// ═══════════════════════════════════════════════════════════════════════════

// §8. DCE

// ═══════════════════════════════════════════════════════════════════════════



export interface Level { code: string; label: string; rank: number } // rank: cao hơn = tốt hơn cho người mua

export interface Attribute { id: string; label: string; icon: string; levels: Level[] }



export const FIXED_ATTRS: Attribute[] = [

  { id: "price", label: "Giá mua ban đầu (chưa gồm pin)", icon: "💰", levels: [

    { code: "18", label: "18 triệu đồng", rank: 4 }, { code: "24", label: "24 triệu đồng", rank: 3 },

    { code: "30", label: "30 triệu đồng", rank: 2 }, { code: "36", label: "36 triệu đồng", rank: 1 },

  ]},

  { id: "battery", label: "Pin và chi phí hằng tháng", icon: "🔋", levels: [

    // Mua đứt và thuê pin không so sánh "tốt hơn" một cách hiển nhiên → rank bằng nhau giữa buy và rent150

    { code: "buy", label: "Mua đứt pin (0 đ/tháng)", rank: 3 },

    { code: "rent150", label: "Thuê pin 150.000 đ/tháng", rank: 3 },

    { code: "rent250", label: "Thuê pin 250.000 đ/tháng", rank: 2 },

    { code: "rent350", label: "Thuê pin 350.000 đ/tháng", rank: 1 },

  ]},

  { id: "energy", label: "Nguồn năng lượng tại trạm sạc/đổi pin", icon: "☀️", levels: [

    { code: "grid", label: "Lưới điện thông thường", rank: 1 },

    { code: "solar", label: "Trạm dùng điện mặt trời áp mái, có công bố tỷ lệ điện mặt trời", rank: 2 },

  ]},

  { id: "recycle", label: "Cam kết tái chế pin của hãng", icon: "♻️", levels: [

    { code: "none", label: "Không công bố", rank: 1 },

    { code: "50cert", label: "Thu hồi 50%, có chứng nhận", rank: 2 },

    { code: "100audit", label: "Thu hồi 100%, có kiểm toán độc lập", rank: 3 },

  ]},

];



/** Ngân hàng thuộc tính linh hoạt. Quản trị viên chọn đúng 2 sau BWS Đợt 1 (xem §13). */

export const FLEX_BANK: (Attribute & { barriers: string[]; group: BarrierGroup })[] = [

  { id: "warranty", barriers: ["R3"], group: "fin", label: "Bảo hành pin", icon: "🛡️", levels: [

    { code: "w3", label: "3 năm", rank: 1 }, { code: "w5", label: "5 năm", rank: 2 }, { code: "w8", label: "8 năm", rank: 3 },

  ]},

  { id: "buyback", barriers: ["R4"], group: "fin", label: "Cam kết mua lại xe của hãng sau 3 năm", icon: "🔁", levels: [

    { code: "none", label: "Không có", rank: 1 }, { code: "40pct", label: "40% giá gốc", rank: 2 }, { code: "60pct", label: "60% giá gốc", rank: 3 },

  ]},

  { id: "station", barriers: ["R5", "R6"], group: "infra", label: "Trạm sạc/đổi pin gần nhất", icon: "📍", levels: [

    { code: "3km", label: "Cách 3 km", rank: 1 }, { code: "1km", label: "Cách 1 km", rank: 2 },

    { code: "home", label: "Ngay tại nơi ở hoặc nơi làm việc", rank: 3 },

  ]},

  { id: "range", barriers: ["R7"], group: "tech", label: "Quãng đường mỗi lần sạc", icon: "🛣️", levels: [

    { code: "80", label: "80 km", rank: 1 }, { code: "120", label: "120 km", rank: 2 }, { code: "160", label: "160 km", rank: 3 },

  ]},

  { id: "safety", barriers: ["R8"], group: "tech", label: "Tiêu chuẩn chống nước và bảo hiểm cháy nổ pin", icon: "💧", levels: [

    { code: "none", label: "Không có", rank: 1 }, { code: "ip67", label: "Chống nước IP67", rank: 2 },

    { code: "ip67ins", label: "IP67 kèm bảo hiểm cháy nổ do hãng chi trả", rank: 3 },

  ]},

  { id: "finance", barriers: ["R1"], group: "fin", label: "Hỗ trợ tài chính", icon: "🏦", levels: [

    { code: "none", label: "Không có", rank: 1 }, { code: "inst0", label: "Trả góp 0% trong 12 tháng", rank: 2 },

    { code: "tradein3", label: "Thu cũ đổi mới, trợ giá 3 triệu đồng", rank: 3 },

  ]},

];



export interface DesignRow {

  block: Block; card: number; isDominanceCheck: boolean; alt: "A" | "B" | "OPT";

  price?: string; battery?: string; energy?: string; recycle?: string; flex1?: string; flex2?: string; lezFee?: number;

}

export type Design = DesignRow[];



/** Đọc CSV thiết kế (cột: block, card, is_dominance_check, alt, price, battery, energy, recycle, flex1, flex2, lez_fee). */

export function parseDesignCsv(csv: string): Design {

  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim() && !l.startsWith("#"));

  const head = lines[0].split(",").map((h) => h.trim());

  const idx = (k: string) => { const i = head.indexOf(k); if (i < 0) throw new Error(`Thiếu cột ${k}`); return i; };

  const na = (v: string) => (v === "" || v.toUpperCase() === "NA" ? undefined : v);

  return lines.slice(1).map((l) => {

    const c = l.split(",").map((x) => x.trim());

    return {

      block: c[idx("block")] as Block,

      card: Number(c[idx("card")]),

      isDominanceCheck: c[idx("is_dominance_check")] === "1",

      alt: c[idx("alt")] as DesignRow["alt"],

      price: na(c[idx("price")]), battery: na(c[idx("battery")]), energy: na(c[idx("energy")]),

      recycle: na(c[idx("recycle")]), flex1: na(c[idx("flex1")]), flex2: na(c[idx("flex2")]),

      lezFee: na(c[idx("lez_fee")]) === undefined ? undefined : Number(c[idx("lez_fee")]),

    };

  });

}



/** So sánh A và B trên mọi thuộc tính. Trả về phương án trội, hoặc null nếu không có phương án nào trội. */

export function dominantAlt(a: DesignRow, b: DesignRow, flex: [string, string]): "A" | "B" | null {

  const attrs: [Attribute, keyof DesignRow][] = [

    ...FIXED_ATTRS.map((x) => [x, x.id as keyof DesignRow] as [Attribute, keyof DesignRow]),

    [flexAttr(flex[0]), "flex1"], [flexAttr(flex[1]), "flex2"],

  ];

  let aBetter = 0, bBetter = 0;

  for (const [attr, key] of attrs) {

    const ra = attr.levels.find((l) => l.code === a[key])?.rank ?? 0;

    const rb = attr.levels.find((l) => l.code === b[key])?.rank ?? 0;

    if (ra > rb) aBetter++; else if (rb > ra) bBetter++;

  }

  if (aBetter > 0 && bBetter === 0) return "A";

  if (bBetter > 0 && aBetter === 0) return "B";

  return null;

}



export function flexAttr(id: string): Attribute {

  const a = FLEX_BANK.find((x) => x.id === id);

  if (!a) throw new Error(`Thuộc tính linh hoạt không tồn tại: ${id}`);

  return a;

}



/** Kiểm tra file thiết kế trước khi cho phép nhập. Trả về danh sách lỗi (rỗng = hợp lệ). */

export function validateDesign(d: Design, flex: [string, string], lezFees: readonly number[] = CONFIG.lezFeeLevels): string[] {

  const err: string[] = [];

  if (flex[0] === flex[1]) err.push("Hai thuộc tính linh hoạt phải khác nhau");

  const f1 = flexAttr(flex[0]), f2 = flexAttr(flex[1]);

  const ok = (attr: Attribute, v?: string) => v !== undefined && attr.levels.some((l) => l.code === v);



  for (const b of CONFIG.dceBlocks) {

    const cards = [...new Set(d.filter((r) => r.block === b).map((r) => r.card))].sort((x, y) => x - y);

    if (cards.length !== CONFIG.dceCardsPerBlock) err.push(`${b}: có ${cards.length} thẻ, cần ${CONFIG.dceCardsPerBlock}`);

    if (cards.join() !== Array.from({ length: CONFIG.dceCardsPerBlock }, (_, i) => i + 1).join())

      err.push(`${b}: số thẻ phải là 1..${CONFIG.dceCardsPerBlock}`);

    const checks = new Set(d.filter((r) => r.block === b && r.isDominanceCheck).map((r) => r.card));

    if (checks.size !== 1) err.push(`${b}: cần đúng 1 thẻ kiểm tra trội, đang có ${checks.size}`);



    for (const c of cards) {

      const rows = d.filter((r) => r.block === b && r.card === c);

      const A = rows.find((r) => r.alt === "A"), B = rows.find((r) => r.alt === "B"), O = rows.find((r) => r.alt === "OPT");

      if (rows.length !== 3 || !A || !B || !O) { err.push(`${b} thẻ ${c}: cần đúng 3 dòng A, B, OPT`); continue; }

      for (const r of [A, B]) {

        for (const attr of FIXED_ATTRS) if (!ok(attr, r[attr.id as keyof DesignRow] as string)) err.push(`${b} thẻ ${c} ${r.alt}: mức ${attr.id} không hợp lệ (${r[attr.id as keyof DesignRow]})`);

        if (!ok(f1, r.flex1)) err.push(`${b} thẻ ${c} ${r.alt}: flex1 không hợp lệ với ${f1.id} (${r.flex1})`);

        if (!ok(f2, r.flex2)) err.push(`${b} thẻ ${c} ${r.alt}: flex2 không hợp lệ với ${f2.id} (${r.flex2})`);

        if (r.lezFee !== undefined) err.push(`${b} thẻ ${c} ${r.alt}: phụ phí LEZ chỉ thuộc phương án OPT`);

      }

      if (O.lezFee === undefined || !lezFees.includes(O.lezFee)) err.push(`${b} thẻ ${c} OPT: lez_fee phải thuộc ${lezFees.join("/")}`);

      if (JSON.stringify({ ...A, alt: "" }) === JSON.stringify({ ...B, alt: "" })) err.push(`${b} thẻ ${c}: A và B giống hệt nhau`);

      const dom = dominantAlt(A, B, flex);

      if (checks.has(c) && !dom) err.push(`${b} thẻ ${c}: đánh dấu thẻ kiểm tra nhưng không có phương án trội`);

      if (!checks.has(c) && dom) err.push(`${b} thẻ ${c}: phương án ${dom} trội hoàn toàn nhưng không được đánh dấu là thẻ kiểm tra`);

    }

  }

  return err;

}



/** Nội dung hiển thị một thẻ DCE cho một người (đã chèn tiền xăng A2). */

export function renderCard(d: Design, r: Respondent, position: number, flex: [string, string]) {

  if (!r.block || !r.dceCardOrder) throw new Error("Người trả lời chưa được gán khối DCE");

  const card = r.dceCardOrder[position - 1];

  const rows = d.filter((x) => x.block === r.block && x.card === card);

  const label = (attr: Attribute, code?: string) => attr.levels.find((l) => l.code === code)?.label ?? "";

  const ev = (alt: "A" | "B") => {

    const x = rows.find((y) => y.alt === alt)!;

    return {

      alt, title: alt === "A" ? "Xe điện A" : "Xe điện B",

      lines: [

        ...FIXED_ATTRS.map((a) => ({ icon: a.icon, label: a.label, value: label(a, x[a.id as keyof DesignRow] as string) })),

        { icon: flexAttr(flex[0]).icon, label: flexAttr(flex[0]).label, value: label(flexAttr(flex[0]), x.flex1) },

        { icon: flexAttr(flex[1]).icon, label: flexAttr(flex[1]).label, value: label(flexAttr(flex[1]), x.flex2) },

      ],

    };

  };

  const opt = rows.find((y) => y.alt === "OPT")!;

  const fuel = Number(r.answers.A2);

  return {

    title: `Thẻ ${position}/${CONFIG.dceCardsPerBlock}`,

    card,

    askInferred: (CONFIG.inferredValuationPositions as readonly number[]).includes(position),

    alternatives: [

      ev("A"), ev("B"),

      { alt: "OPT" as const, title: "Tiếp tục dùng xe xăng hiện tại", lines: [

        { icon: "💰", label: "Chi phí mua xe", value: "Không tốn thêm tiền mua xe" },

        { icon: "⛽", label: "Tiền xăng", value: `Như hiện tại (${fuel.toLocaleString("vi-VN")} nghìn đồng/tháng)` },

        { icon: "🚫", label: "Phụ phí khi đi vào LEZ", value: opt.lezFee ? `${(opt.lezFee * 1000).toLocaleString("vi-VN")} đ/tháng` : "Không có" },

      ]},

    ],

  };

}



/** Một câu trả lời DCE đầy đủ: có lựa chọn, có độ chắc chắn 1–10, và có câu suy luận nếu ở vị trí 3/6. */

export function dceValid(x: DceResponse): boolean {

  if (!x.choice || !x.certainty || x.certainty < 1 || x.certainty > 10) return false;

  if ((CONFIG.inferredValuationPositions as readonly number[]).includes(x.position) && !x.inferred) return false;

  return true;

}



/** Nhãn lựa chọn của câu D9 phụ thuộc thuộc tính linh hoạt đang dùng. */

export function d9Options(flex: [string, string]): Option[] {

  return [

    { code: "price", label: "Giá mua" }, { code: "battery", label: "Pin và chi phí hằng tháng" },

    { code: "energy", label: "Năng lượng tại trạm" }, { code: "recycle", label: "Tái chế pin" },

    { code: "flex1", label: flexAttr(flex[0]).label }, { code: "flex2", label: flexAttr(flex[1]).label },

    { code: "lez_fee", label: "Phụ phí LEZ" }, { code: "none", label: "Không bỏ qua đặc điểm nào" },

  ];

}



/** "Không bỏ qua đặc điểm nào" loại trừ các lựa chọn khác. */

export function d9Normalize(sel: string[]): string[] {

  if (sel.includes("none") && sel.length > 1) return sel[sel.length - 1] === "none" ? ["none"] : sel.filter((s) => s !== "none");

  return sel;

}



// ═══════════════════════════════════════════════════════════════════════════

// §9. THANG ĐO LIKERT VÀ CÂU KIỂM TRA CHÚ Ý

// ═══════════════════════════════════════════════════════════════════════════



export type LikertGroup = "SK" | "FR" | "SD";

export const LIKERT_GROUPS: LikertGroup[] = ["SK", "FR", "SD"];



export const LIKERT: { id: string; group: LikertGroup; text: string; reverse?: boolean }[] = [

  { id: "SK1", group: "SK", text: "Lợi ích môi trường của xe máy điện thường bị phóng đại" },

  { id: "SK2", group: "SK", text: "Nếu tính cả việc sản xuất pin, xe máy điện chưa chắc sạch hơn xe xăng" },

  { id: "SK3", group: "SK", text: "Ở Việt Nam, sạc xe điện chủ yếu chỉ chuyển ô nhiễm từ đường phố sang nhà máy điện" },

  { id: "SK4", group: "SK", text: "Tôi không tin các hãng xe sẽ thực sự thu hồi và tái chế pin cũ" },

  { id: "SK5", group: "SK", text: "Các hãng xe dùng hình ảnh “xanh” chủ yếu để bán hàng" },

  { id: "SK6", group: "SK", text: "Tôi cần bằng chứng độc lập trước khi tin rằng một chiếc xe điện là “xanh”" },

  { id: "FR1", group: "FR", text: "Xe máy điện sẽ mất giá nhanh hơn xe xăng khi bán lại" },

  { id: "FR2", group: "FR", text: "Chi phí thay pin trong tương lai là khoản tôi khó dự trù" },

  { id: "FR3", group: "FR", text: "Phí thuê pin có thể bị hãng tăng lên bất cứ lúc nào" },

  { id: "FR4", group: "FR", text: "Mua xe máy điện lúc này có nhiều rủi ro tài chính hơn là lợi ích" },

  { id: "SD1", group: "SD", text: "Tôi chưa bao giờ nói dối để có lợi cho bản thân" },

  { id: "SD2", group: "SD", text: "Đôi khi tôi cảm thấy khó chịu khi không được làm theo ý mình", reverse: true },

  { id: "SD3", group: "SD", text: "Tôi luôn sẵn lòng thừa nhận khi mình mắc lỗi" },

  { id: "SD4", group: "SD", text: "Đã có lúc tôi lợi dụng người khác", reverse: true },

];



export const RD_ITEMS = [

  { id: "RD1", text: "Tôi sẵn sàng chuyển sang xe máy điện nếu có điều kiện phù hợp", scale: 5 },

  { id: "RD2", text: "Tôi đã bắt đầu tìm hiểu giá, mẫu mã hoặc chính sách của xe máy điện", scale: 5 },

  { id: "RD3", text: "Tôi sẽ cân nhắc xe máy điện cho lần đổi xe tiếp theo", scale: 5 },

  { id: "RD4", text: "Tôi sẵn sàng giới thiệu xe máy điện cho bạn bè, đồng nghiệp", scale: 5 },

  { id: "RD5", text: "Khả năng anh/chị chuyển sang xe máy điện trong 2 năm tới là bao nhiêu?", scale: 11 }, // 0..10

] as const;



export const ATTENTION_CHECK: ChoiceQuestion = {

  id: "CHECK",

  text: "Để xác nhận anh/chị đang đọc kỹ câu hỏi, vui lòng chọn ‘Màu xanh lá’.",

  options: [

    { code: "red", label: "Màu đỏ" }, { code: "green", label: "Màu xanh lá" },

    { code: "yellow", label: "Màu vàng" }, { code: "white", label: "Màu trắng" },

  ],

};



const opts = (...xs: [string, string][]): Option[] => xs.map(([code, label]) => ({ code, label }));



/** Các câu chọn một/chọn nhiều còn lại (mã lựa chọn cố định để xuất dữ liệu ổn định). */

export const CHOICE_QUESTIONS: ChoiceQuestion[] = [

  { id: "A1", text: "Trung bình mỗi ngày anh/chị đi bao nhiêu km bằng xe máy?",

    options: opts(["u10", "Dưới 10 km"], ["10_20", "10–20 km"], ["20_40", "20–40 km"], ["o40", "Trên 40 km"]) },

  { id: "A3", text: "Tại nơi ở, anh/chị có thể sạc xe điện qua đêm không?",

    options: opts(["easy", "Có, dễ dàng"], ["limited", "Có nhưng bị hạn chế (phí, giờ, chủ nhà/ban quản lý không cho)"], ["no", "Không"], ["dk", "Không biết"]) },

  { id: "A6", text: "Anh/chị có thường đọc tin tức về xe điện, năng lượng hoặc môi trường không?",

    options: opts(["rarely", "Hầu như không"], ["monthly", "Vài lần mỗi tháng"], ["weekly", "Vài lần mỗi tuần"], ["daily", "Hằng ngày"]) },

  { id: "A7", text: "Anh/chị có biết TP.HCM dự kiến lập vùng phát thải thấp (LEZ), hạn chế xe máy xăng vào khu trung tâm không?",

    options: opts(["clear", "Biết rõ"], ["heard", "Có nghe qua"], ["no", "Chưa biết"]) },

  { id: "A8", text: "Nếu LEZ được áp dụng tại nơi anh/chị thường đi qua, anh/chị dự kiến ứng phó chủ yếu bằng cách nào?",

    options: opts(["switch_ev", "Chuyển sang xe máy điện"], ["park_ride", "Gửi xe ở rìa vùng rồi đi bộ, xe buýt hoặc metro vào trung tâm"],

      ["public", "Chuyển hẳn sang giao thông công cộng"], ["pay_fee", "Chấp nhận nộp phụ phí và tiếp tục đi xe xăng"],

      ["relocate", "Thay đổi nơi ở hoặc nơi làm việc"], ["unaffected", "Không bị ảnh hưởng"]) },

  { id: "D11", text: "Lý do chính khiến anh/chị chọn tiếp tục dùng xe xăng là gì?",

    options: opts(["no_money", "Không đủ khả năng tài chính để mua xe điện lúc này"], ["still_good", "Xe xăng hiện tại vẫn còn tốt"],

      ["not_green", "Không tin xe điện thực sự thân thiện với môi trường"], ["battery_risk", "Lo ngại rủi ro về pin và giá trị bán lại"],

      ["wait_lez", "Chờ chính sách LEZ rõ ràng hơn"], ["other", "Lý do khác (nhập chữ)"]) },

  { id: "F1", multi: true, max: 3, text: "Chọn tối đa 3 hỗ trợ giúp anh/chị chuyển sang xe máy điện nhiều nhất",

    options: opts(["inst0", "Trả góp 0% qua ngân hàng hoặc hãng xe"], ["tradein", "Thu cũ đổi mới xe xăng có trợ giá của thành phố"],

      ["fee_waive", "Miễn lệ phí trước bạ, phí đăng ký biển số"], ["station_bldg", "Trạm sạc/đổi pin tại chung cư, tòa nhà văn phòng"],

      ["fixed_rent", "Gói thuê pin giá cố định trong 3–5 năm"], ["rent_to_own", "Quyền chuyển từ thuê pin sang mua đứt pin"],

      ["buyback", "Cam kết mua lại xe của hãng"], ["recycle_cert", "Chứng nhận độc lập về thu hồi, tái chế pin"],

      ["renew_share", "Công khai tỷ lệ điện tái tạo tại trạm sạc"], ["fire_ins", "Bảo hiểm cháy nổ pin do hãng chi trả"], ["other", "Khác"]) },

  { id: "F2", text: "Giới tính", options: opts(["m", "Nam"], ["f", "Nữ"], ["o", "Khác/Không muốn trả lời"]) },

  { id: "F3", text: "Trình độ học vấn cao nhất",

    options: opts(["hs", "THPT trở xuống"], ["college", "Trung cấp/Cao đẳng"], ["uni", "Đại học"], ["post", "Sau đại học"]) },

  { id: "F4", text: "Nghề nghiệp chính",

    options: opts(["office", "Nhân viên văn phòng"], ["tech", "Kỹ thuật/sản xuất"], ["sales", "Kinh doanh, bán hàng"], ["self", "Tự doanh/freelance"],

      ["driver", "Tài xế công nghệ, giao hàng"], ["student_work", "Sinh viên có việc làm"], ["other", "Khác"]) },

  { id: "F5", text: "Thu nhập cá nhân hằng tháng",

    options: opts(["7_10", "7 – dưới 10 triệu"], ["10_15", "10 – dưới 15 triệu"], ["15_20", "15 – dưới 20 triệu"], ["20_30", "20 – dưới 30 triệu"], ["ge30", "Từ 30 triệu trở lên"]) },

  { id: "F6", text: "Sau khi trả các chi phí thiết yếu (nhà ở, ăn uống, đi lại, hỗ trợ gia đình), mỗi tháng anh/chị còn dư khoảng bao nhiêu?",

    options: opts(["none", "Hầu như không dư"], ["u1", "Dưới 1 triệu"], ["1_3", "1 – dưới 3 triệu"], ["3_5", "3 – dưới 5 triệu"], ["ge5", "Từ 5 triệu trở lên"]) },

  { id: "F7", text: "Nếu mua xe máy điện, số tiền tối đa anh/chị có thể chi là bao nhiêu?",

    options: opts(["u15", "Dưới 15 triệu"], ["15_25", "15 – dưới 25 triệu"], ["25_35", "25 – dưới 35 triệu"], ["ge35", "Từ 35 triệu trở lên"]) },

  ATTENTION_CHECK,

];



/** Kiểm tra giá trị hợp lệ của một câu trước khi cho bấm "Tiếp tục". */

export function validateAnswer(qid: string, v: Answers[string]): string | null {

  const inRange = (x: unknown, lo: number, hi: number) => typeof x === "number" && Number.isInteger(x) && x >= lo && x <= hi;

  if (/^(SK|FR|SD)\d$/.test(qid) || /^RD[1-4]$/.test(qid)) return inRange(v, 1, 5) ? null : "Chọn một mức từ 1 đến 5";

  if (qid === "RD5") return inRange(v, 0, 10) ? null : "Chọn một mức từ 0 đến 10";

  if (qid === "D10") return inRange(v, 1, 5) ? null : "Chọn một mức từ 1 đến 5";

  if (qid === "A2") {

    const [lo, hi] = CONFIG.fuelCostRange;

    return inRange(v, lo, hi) ? null : `Nhập số nguyên từ ${lo} đến ${hi} (nghìn đồng)`;

  }

  if (qid === "F1") {

    if (!Array.isArray(v) || v.length < 1) return "Chọn ít nhất 1 hỗ trợ";

    if (v.length > 3) return "Chọn tối đa 3 hỗ trợ";

    return null; // ô "Khác" kiểm tra riêng qua mã F1_other

  }

  if (qid === "F1_other" || qid === "D11_other") return typeof v === "string" && v.trim() ? null : "Ghi rõ nội dung";

  const q = CHOICE_QUESTIONS.find((x) => x.id === qid);

  if (q && !q.multi) return q.options.some((o) => o.code === v) ? null : "Chọn một phương án";

  if (qid === "D9") return Array.isArray(v) && v.length > 0 ? null : "Chọn ít nhất một lựa chọn";

  return v === undefined || v === "" ? "Vui lòng trả lời câu hỏi này" : null;

}



// ═══════════════════════════════════════════════════════════════════════════

// §10. THỜI GIAN VÀ CỜ CHẤT LƯỢNG

//      Chỉ gắn cờ, không tự loại. Quản trị viên quyết định loại/giữ và ghi lý do.

// ═══════════════════════════════════════════════════════════════════════════



export interface QualityFlags {

  flag_attention: boolean;

  flag_dominant: boolean;

  flag_speeder: boolean | null;   // null = chưa đủ mẫu để tính trung vị

  flag_straightline: boolean;

  flag_duplicate: boolean;

  total_seconds: number;

}



export function totalSeconds(r: Respondent): number {

  return r.completedAt ? Math.round((r.completedAt - r.startedAt) / 1000) : NaN;

}



export function median(xs: number[]): number {

  const a = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q);

  if (!a.length) return NaN;

  const m = Math.floor(a.length / 2);

  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;

}



/**

 * Tính cờ cho một phiếu hoàn thành.

 * completedTimes: tổng thời gian (giây) của các phiếu hoàn thành CÙNG ĐỢT và CÙNG KÊNH

 * (pilot ngắn hơn đợt chính thức nhiều, trộn chung sẽ làm lệch trung vị).

 */

export function computeFlags(r: Respondent, design: Design | null, flex: [string, string] | null,

  completedTimes: number[], seenFingerprints: Set<string>): QualityFlags {

  const t = totalSeconds(r);

  const med = median(completedTimes);

  const likert = LIKERT.map((x) => r.answers[x.id]);



  let dominantFail = false;

  if (design && flex && r.block) {

    for (const x of r.dce) {

      const rows = design.filter((d) => d.block === r.block && d.card === x.card);

      if (!rows[0]?.isDominanceCheck) continue;

      const dom = dominantAlt(rows.find((d) => d.alt === "A")!, rows.find((d) => d.alt === "B")!, flex);

      // Chọn phương án bị trội mới tính là sai. Chọn giữ xe xăng không bị coi là sai (vẫn hợp lý).

      if (dom && x.choice && x.choice !== "OPT" && x.choice !== dom) dominantFail = true;

    }

  }



  return {

    flag_attention: r.answers.CHECK !== CONFIG.attentionCorrect,

    flag_dominant: dominantFail,

    flag_speeder: completedTimes.length < CONFIG.minMedianSample ? null : t < CONFIG.speederRatio * med,

    flag_straightline: likert.every((v) => v !== undefined && v === likert[0]),

    flag_duplicate: !!r.fingerprintHash && seenFingerprints.has(r.fingerprintHash),

    total_seconds: t,

  };

}



/** Phiếu "hợp lệ" để tính tiến độ 600: hoàn thành và (chưa bị quản trị viên loại). Cờ không tự loại. */

export function isValid(r: Respondent): boolean {

  if (r.status !== "complete") return false;

  if (r.adminDecision) return r.adminDecision.keep;

  return true;

}



/** Thời gian theo trang, dùng cho biểu đồ kiệt sức và funnel bỏ dở. */

export function pageDurations(r: Respondent): Record<string, number> {

  const out: Record<string, number> = {};

  for (const [p, t] of Object.entries(r.pageTimes)) if (t.leave) out[p] = (t.leave - t.enter) / 1000;

  return out;

}



// ═══════════════════════════════════════════════════════════════════════════

// §11. BIẾN DẪN XUẤT

// ═══════════════════════════════════════════════════════════════════════════



/** Danh sách phường/xã: mã → { tên, in_lez }. Tải từ file cấu hình; quản trị viên cập nhật cờ in_lez. */

export type WardMap = Record<string, { name: string; in_lez: boolean }>;

export const NO_FIXED_WORKPLACE = "NONE";



export function lezGroup(ans: Answers, wards: WardMap): { residence: boolean; workplace: boolean; group4: string } | undefined {

  if (ans.A4 === undefined || ans.A5 === undefined) return undefined;

  const residence = !!wards[String(ans.A4)]?.in_lez;

  const workplace = ans.A5 !== NO_FIXED_WORKPLACE && !!wards[String(ans.A5)]?.in_lez;

  const group4 = residence && workplace ? "both" : residence ? "res_only" : workplace ? "work_only" : "outside";

  return { residence, workplace, group4 };

}



export function likertValue(id: string, ans: Answers): number | undefined {

  const v = ans[id];

  if (typeof v !== "number") return undefined;

  return LIKERT.find((x) => x.id === id)?.reverse ? 6 - v : v;

}



export function scaleMean(ids: string[], ans: Answers, reverseAware = true): number | undefined {

  const vals = ids.map((id) => (reverseAware ? likertValue(id, ans) : (ans[id] as number))).filter((v): v is number => typeof v === "number");

  return vals.length === ids.length ? vals.reduce((a, b) => a + b, 0) / vals.length : undefined;

}



export function derived(r: Respondent, wards: WardMap) {

  const lez = lezGroup(r.answers, wards);

  return {

    LEZ_Residence: lez ? Number(lez.residence) : undefined,

    LEZ_Workplace: lez ? Number(lez.workplace) : undefined,

    LEZ_group4: lez?.group4,

    SK_mean: scaleMean(["SK1", "SK2", "SK3", "SK4", "SK5", "SK6"], r.answers),

    FR_mean: scaleMean(["FR1", "FR2", "FR3", "FR4"], r.answers),

    SD_score: scaleMean(["SD1", "SD2", "SD3", "SD4"], r.answers), // SD2, SD4 đã đảo chiều

    RD_mean: scaleMean(["RD1", "RD2", "RD3", "RD4"], r.answers, false),

    n_optout: r.dce.filter((d) => d.choice === "OPT").length,

    always_optout: r.dce.length === CONFIG.dceCardsPerBlock && r.dce.every((d) => d.choice === "OPT") ? 1 : 0,

    budget_constrained: r.answers.D11 === "no_money" ? 1 : 0, // dùng cho phân tích độ vững 7.6

  };

}



// ═══════════════════════════════════════════════════════════════════════════

// §12. XUẤT DỮ LIỆU

// ═══════════════════════════════════════════════════════════════════════════



/** Mã hóa số cho Apollo. Giá: triệu đồng. Thuê pin: nghìn đồng/tháng (0 nếu mua đứt). */

export function codeAlt(row: DesignRow | undefined, flex: [string, string]) {

  if (!row) return {};

  const lvl = (attr: Attribute, code?: string) => attr.levels.findIndex((l) => l.code === code) + 1; // 1-based

  const f1 = flexAttr(flex[0]), f2 = flexAttr(flex[1]);

  const l1 = lvl(f1, row.flex1), l2 = lvl(f2, row.flex2);

  return {

    price: Number(row.price),

    rent: row.battery === "buy" ? 0 : Number(row.battery?.replace("rent", "")),

    buy: row.battery === "buy" ? 1 : 0,

    solar: row.energy === "solar" ? 1 : 0,

    rec50: row.recycle === "50cert" ? 1 : 0,

    rec100: row.recycle === "100audit" ? 1 : 0,

    flex1_l2: l1 === 2 ? 1 : 0, flex1_l3: l1 === 3 ? 1 : 0,

    flex2_l2: l2 === 2 ? 1 : 0, flex2_l3: l2 === 3 ? 1 : 0,

  };

}



const CHOICE_CODE = { A: 1, B: 2, OPT: 3 } as const;



/** CSV dạng dài cho Apollo: mỗi dòng = một thẻ của một người. Chỉ xuất phiếu hợp lệ. */

export function apolloLong(people: Respondent[], design: Design, flex: [string, string], wards: WardMap) {

  const rows: Record<string, unknown>[] = [];

  for (const r of people) {

    if (!isValid(r) || r.wave !== "main") continue;

    const dv = derived(r, wards);

    for (const x of [...r.dce].sort((a, b) => a.position - b.position)) {

      const card = design.filter((d) => d.block === r.block && d.card === x.card);

      const A = codeAlt(card.find((d) => d.alt === "A"), flex);

      const B = codeAlt(card.find((d) => d.alt === "B"), flex);

      const O = card.find((d) => d.alt === "OPT");

      const row: Record<string, unknown> = {

        ID: r.id, block: r.block, order_version: r.orderVersion, position: x.position, card: x.card,

        choice: x.choice ? CHOICE_CODE[x.choice] : undefined,

        is_dominance_check: card[0]?.isDominanceCheck ? 1 : 0,

        certainty: x.certainty, inferred: x.inferred ? CHOICE_CODE[x.inferred] : undefined,

        fuel_cost: Number(r.answers.A2), lez_fee: O?.lezFee,

        LEZ_Residence: dv.LEZ_Residence, LEZ_Workplace: dv.LEZ_Workplace,

        channel: r.channel,

      };

      for (const [k, v] of Object.entries(A)) row[`${k}_A`] = v;

      for (const [k, v] of Object.entries(B)) row[`${k}_B`] = v;

      for (const it of LIKERT) row[it.id] = r.answers[it.id]; // giữ giá trị gốc; đảo chiều SD làm trong R

      for (const k of ["A1", "A3", "A6", "A7", "F2", "F3", "F5", "F6", "F7", "D10"]) row[k] = r.answers[k];

      row.SD_score = dv.SD_score;

      row.budget_constrained = dv.budget_constrained;

      Object.assign(row, r.flags ?? {});

      rows.push(row);

    }

  }

  return rows;

}



/** CSV dạng dài cho BWS: mỗi dòng = một tập của một người. Pilot và chính thức đều xuất, có cột wave. */

export function bwsLong(people: Respondent[]) {

  const rows: Record<string, unknown>[] = [];

  for (const r of people) {

    if (!isValid(r)) continue;

    for (const x of r.bws) rows.push({

      ID: r.id, wave: r.wave, order_version: r.orderVersion, set: x.set, display_order: x.displayOrder,

      item1: x.items[0], item2: x.items[1], item3: x.items[2], item4: x.items[3],

      best: x.best, worst: x.worst, best_pos: x.items.indexOf(x.best!) + 1, worst_pos: x.items.indexOf(x.worst!) + 1,

      seconds: x.msOnScreen ? x.msOnScreen / 1000 : undefined, channel: r.channel,

    });

  }

  return rows;

}



/** CSV dạng rộng: mỗi dòng một người. Xuất cả phiếu bị loại (có cột excluded) để minh bạch. */

export function wideRow(r: Respondent, wards: WardMap) {

  const row: Record<string, unknown> = {

    ID: r.id, wave: r.wave, channel: r.channel, status: r.status, screen_out_at: r.screenOutAt,

    order_version: r.orderVersion, block: r.block,

    excluded: r.adminDecision ? Number(!r.adminDecision.keep) : 0, exclude_reason: r.adminDecision?.reason,

  };

  for (const [k, v] of Object.entries(r.answers)) row[k] = Array.isArray(v) ? v.join("|") : v;

  // Câu chọn nhiều → thêm cột nhị phân để R đọc dễ

  for (const k of ["F1", "D9"]) {

    const sel = r.answers[k];

    if (Array.isArray(sel)) for (const s of sel) row[`${k}_${s}`] = 1;

  }

  const ind = bwsIndividual(r.bws);

  for (const [k, v] of Object.entries(ind)) row[`BW_${k}`] = v;

  const gi = bwsGroupIndex(r.bws);

  for (const [k, v] of Object.entries(gi)) row[`BWG_${k}`] = v;

  Object.assign(row, derived(r, wards), r.flags ?? {});

  row.bws_set_order = r.bwsSetOrder?.join("|");

  row.dce_card_order = r.dceCardOrder?.join("|");

  return row;

}



export function toCsv(rows: Record<string, unknown>[]): string {

  const cols = [...new Set(rows.flatMap((r) => Object.keys(r)))];

  const esc = (v: unknown) => {

    if (v === undefined || v === null || (typeof v === "number" && Number.isNaN(v))) return "NA";

    const s = typeof v === "boolean" ? String(Number(v)) : String(v);

    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

  };

  return [cols.join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n");

}



// ═══════════════════════════════════════════════════════════════════════════

// §13. LUẬT CHỌN 2 THUỘC TÍNH LINH HOẠT (sau BWS Đợt 1)

//      Đầu vào: hệ số MaxDiff logit và khoảng tin cậy bootstrap do R tính.

//      Hàm này chỉ áp dụng luật quyết định đã đăng ký trước; kết quả là ĐỀ XUẤT,

//      quản trị viên bấm xác nhận mới áp dụng.

// ═══════════════════════════════════════════════════════════════════════════



export interface FlexCandidate { flexId: string; est: number; lo: number; hi: number }

const PRIORITY: BarrierGroup[] = ["infra", "fin", "tech"];



/** Gộp ước lượng rào cản thành ứng viên thuộc tính. R5–R6 gộp bằng trung bình (R phải trả về đúng như vậy). */

export function flexSelection(cands: FlexCandidate[]): { chosen: [string, string]; reasons: string[] } {

  const reasons: string[] = [];

  const grp = (id: string) => FLEX_BANK.find((f) => f.id === id)!.group;

  const overlap = (a: FlexCandidate, b: FlexCandidate) => a.lo <= b.hi && b.lo <= a.hi;

  const sorted = [...cands].sort((a, b) => b.est - a.est);

  reasons.push("Xếp hạng theo hệ số: " + sorted.map((c) => `${c.flexId} (${c.est.toFixed(2)})`).join(" > "));



  let chosen: [FlexCandidate, FlexCandidate];

  const [c1, c2, c3] = sorted;

  if (!overlap(c2, c3)) {

    chosen = [c1, c2];

    reasons.push(`Khoảng tin cậy của ứng viên thứ 2 (${c2.flexId}) và thứ 3 (${c3.flexId}) không giao nhau → chọn 2 ứng viên đầu.`);

  } else {

    // Các ứng viên không phân biệt được với ứng viên thứ 2 → xếp lại theo thứ tự ưu tiên nhóm

    const tied = sorted.slice(1).filter((c) => overlap(c, c2));

    const pick = [...tied].sort((a, b) => PRIORITY.indexOf(grp(a.flexId)) - PRIORITY.indexOf(grp(b.flexId)) || b.est - a.est)[0];

    chosen = [c1, pick];

    reasons.push(`Khoảng tin cậy của ứng viên thứ 2 và thứ 3 giao nhau; trong nhóm không phân biệt được (${tied.map((t) => t.flexId).join(", ")}), ưu tiên theo thứ tự Hạ tầng → Tài chính → Kỹ thuật – an toàn → chọn ${pick.flexId}.`);

  }

  if (grp(chosen[0].flexId) === grp(chosen[1].flexId)) {

    const idx = sorted.indexOf(chosen[1]);

    const alt = sorted.slice(idx + 1).find((c) => grp(c.flexId) !== grp(chosen[0].flexId));

    if (alt && overlap(alt, chosen[1])) {

      reasons.push(`Hai ứng viên cùng nhóm ${GROUP_LABEL[grp(chosen[0].flexId)]}; ${alt.flexId} thuộc nhóm khác và có khoảng tin cậy giao với ${chosen[1].flexId} → thay thế.`);

      chosen = [chosen[0], alt];

    }

  }

  return { chosen: [chosen[0].flexId, chosen[1].flexId], reasons };

}



// ═══════════════════════════════════════════════════════════════════════════

// §14. TỰ KIỂM TRA — chạy: npx tsx surveyLogic.ts

// ═══════════════════════════════════════════════════════════════════════════



/** Sinh file thiết kế DEMO (KHÔNG DÙNG THẬT) để phát triển giao diện và kiểm thử. */

export function makeDemoDesign(flex: [string, string], seed = 1): Design {

  const rng = mulberry32(seed);

  const pick = <T,>(a: readonly T[]) => a[Math.floor(rng() * a.length)];

  const lv = (attr: Attribute) => attr.levels.map((l) => l.code);

  const f1 = flexAttr(flex[0]), f2 = flexAttr(flex[1]);

  const out: Design = [];

  for (const block of CONFIG.dceBlocks) {

    const checkCard = 1 + Math.floor(rng() * CONFIG.dceCardsPerBlock);

    for (let card = 1; card <= CONFIG.dceCardsPerBlock; card++) {

      const isCheck = card === checkCard;

      let A: DesignRow, B: DesignRow;

      do {

        const mk = (alt: "A" | "B"): DesignRow => ({ block, card, isDominanceCheck: isCheck, alt,

          price: pick(lv(FIXED_ATTRS[0])), battery: pick(lv(FIXED_ATTRS[1])), energy: pick(lv(FIXED_ATTRS[2])),

          recycle: pick(lv(FIXED_ATTRS[3])), flex1: pick(lv(f1)), flex2: pick(lv(f2)) });

        A = mk("A"); B = mk("B");

        if (isCheck) { // B trội hoàn toàn: tốt hơn hoặc bằng ở mọi thuộc tính

          B = { ...A, alt: "B", price: "18", battery: "buy", energy: "solar", recycle: "100audit",

            flex1: lv(f1)[2], flex2: lv(f2)[2] };

          A = { ...A, price: "36", battery: "rent350", flex1: lv(f1)[0] };

        }

      } while ((dominantAlt(A, B, flex) !== null) !== isCheck || JSON.stringify({ ...A, alt: "" }) === JSON.stringify({ ...B, alt: "" }));

      out.push(A, B, { block, card, isDominanceCheck: isCheck, alt: "OPT", lezFee: pick(CONFIG.lezFeeLevels) });

    }

  }

  return out;

}



export function selfTest() {

  const assert = (c: boolean, m: string) => { if (!c) throw new Error("✗ " + m); console.log("✓ " + m); };



  // 1. BIBD

  const bibd = checkBibd();

  assert(bibd.occOk, "BIBD: mỗi rào cản xuất hiện đúng 4 lần");

  assert(bibd.pairOk, "BIBD: mỗi cặp rào cản xuất hiện cùng nhau đúng 1 lần");

  assert(BWS_SETS[0].items.join() === "R1,R2,R4,R10" && BWS_SETS[12].items.join() === "R13,R1,R3,R9", "BIBD: C1 và C13 khớp bảng trong prompt");



  // 2. Sàng lọc

  const pass: Answers = { S1: "18_24", S2: "yes", S3: "ge7", S4: "yes", S5: "joint", S6: "petrol", S7: "no" };

  assert(screeningResult(pass).passed, "Sàng lọc: hồ sơ hợp lệ được qua");

  assert(screeningResult({ ...pass, S6: "ev" }).failedAt === "S6", "Sàng lọc: người đang đi xe điện bị loại ở S6");

  assert(screeningResult({ ...pass, S3: "u7" }).failedAt === "S3", "Sàng lọc: thu nhập dưới 7 triệu bị loại ở S3");



  // 3. Phân nhóm cân bằng với 1.000 người ảo

  const counts: AssignmentCounts = { version: {}, block: {} };

  for (let i = 0; i < 1000; i++) {

    const a = assign({ seed: 1000 + i, wave: "main" }, counts);

    counts.version[a.orderVersion] = (counts.version[a.orderVersion] ?? 0) + 1;

    counts.block[a.block!] = (counts.block[a.block!] ?? 0) + 1;

  }

  const vDev = Math.abs((counts.version.A ?? 0) - 500) / 1000;

  const bDev = Math.max(...CONFIG.dceBlocks.map((b) => Math.abs((counts.block[b] ?? 0) - 1000 / 3) / 1000));

  assert(vDev <= 0.02 && bDev <= 0.02, `Phân nhóm: A/B = ${counts.version.A}/${counts.version.B}, K1–K3 = ${CONFIG.dceBlocks.map((b) => counts.block[b]).join("/")}`);



  const a1 = assign({ seed: 42, wave: "main" }, { version: {}, block: {} });

  const a2 = assign({ seed: 42, wave: "main" }, { version: {}, block: {} });

  assert(JSON.stringify(a1) === JSON.stringify(a2), "Xáo trộn tái lập được từ seed");



  // 4. Luồng trang

  const base: Respondent = { id: "T1", seed: 7, channel: "online", wave: "main", answers: { ...pass, CONSENT: "yes", A2: 600 },

    bws: [], dce: [], pageTimes: {}, status: "in_progress", startedAt: 0, ...assign({ seed: 7, wave: "main" }, { version: { A: 1 }, block: {} }) };

  const flowB = buildFlow(base);

  assert(base.orderVersion === "B" && flowB.indexOf("DCE_INTRO") < flowB.indexOf("BWS_INTRO"), "Luồng: phiên bản B đặt DCE trước BWS");

  assert(!flowB.includes("D11"), "Luồng: D11 ẩn khi chưa từng chọn giữ xe xăng");

  const withOpt = { ...base, dce: [{ card: 1, position: 1, choice: "OPT" as const, certainty: 5 }] };

  assert(buildFlow(withOpt).includes("D11"), "Luồng: D11 hiện khi đã chọn giữ xe xăng");

  const pilot = { ...base, wave: "pilot" as const };

  assert(!buildFlow(pilot).some((p) => p.startsWith("DCE") || p === "D9"), "Luồng: BWS Đợt 1 bỏ toàn bộ DCE");

  assert(flowB.indexOf("RD") < Math.min(flowB.indexOf("DCE_INTRO"), flowB.indexOf("BWS_INTRO")), "Luồng: RD đứng trước BWS và DCE");



  // 5. BWS: thao tác và điểm

  let st = bwsTap({}, "R1", "best");

  st = bwsTap(st, "R1", "worst");

  assert(st.best === undefined && st.worst === "R1", "BWS: chọn cùng một lý do cho 'ít nhất' thì bỏ 'nhiều nhất'");

  const fake: BwsResponse[] = BWS_SETS.map((s, i) => ({ set: s.id, displayOrder: i + 1, items: s.items, best: s.items[0], worst: s.items[3] }));

  const ind = bwsIndividual(fake);

  assert(Object.values(ind).reduce((a, b) => a + b, 0) === 0, "BWS: điểm cá nhân có tổng bằng 0 (lý do phải bỏ một nhóm tham chiếu)");

  const agg = bwsAggregate([fake, fake]);

  assert(Math.abs(agg.reduce((a, r) => a + r.BW, 0)) < 1e-12, "BWS: điểm đếm tổng hợp có tổng bằng 0");



  // 6. DCE: file thiết kế

  const flex: [string, string] = ["station", "warranty"];

  const demo = makeDemoDesign(flex);

  const errs = validateDesign(demo, flex);

  assert(errs.length === 0, `DCE: file thiết kế demo hợp lệ (${demo.length} dòng)${errs.length ? " — " + errs.slice(0, 3).join("; ") : ""}`);

  const broken = demo.filter((d) => !(d.block === "K2" && d.card === 5));

  assert(validateDesign(broken, flex).some((e) => e.includes("K2")), "DCE: phát hiện khối thiếu thẻ");

  const csv = toCsv(demo.map((d) => ({ block: d.block, card: d.card, is_dominance_check: Number(d.isDominanceCheck), alt: d.alt,

    price: d.price, battery: d.battery, energy: d.energy, recycle: d.recycle, flex1: d.flex1, flex2: d.flex2, lez_fee: d.lezFee })));

  assert(validateDesign(parseDesignCsv(csv), flex).length === 0, "DCE: xuất CSV rồi đọc lại vẫn hợp lệ");



  const card3 = renderCard(demo, base, 3, flex);

  assert(card3.askInferred && card3.alternatives[2].lines[1].value.includes("600"), "DCE: vị trí 3 có câu suy luận; tiền xăng A2 được chèn vào thẻ");

  assert(!renderCard(demo, base, 4, flex).askInferred, "DCE: vị trí 4 không có câu suy luận");



  // 7. Cờ chất lượng

  const doneR: Respondent = { ...base, status: "complete", startedAt: 0, completedAt: 200_000,

    answers: { ...base.answers, CHECK: "red", ...Object.fromEntries(LIKERT.map((x) => [x.id, 3])) } };

  const checkCard = demo.find((d) => d.block === doneR.block && d.isDominanceCheck)!.card;

  const pos = doneR.dceCardOrder!.indexOf(checkCard) + 1;

  doneR.dce = [{ card: checkCard, position: pos, choice: "A", certainty: 8 }]; // demo: B trội → chọn A là sai

  const fl = computeFlags(doneR, demo, flex, Array(40).fill(1200), new Set());

  assert(fl.flag_attention && fl.flag_straightline && fl.flag_speeder === true && fl.flag_dominant,

    "Cờ: bắt được sai câu kiểm tra, trả lời một mức, làm quá nhanh, chọn phương án bị trội");

  assert(computeFlags(doneR, demo, flex, Array(10).fill(1200), new Set()).flag_speeder === null, "Cờ: chưa đủ 30 phiếu thì chưa tính speeder");



  // 8. Biến dẫn xuất và đảo chiều SD

  const wards: WardMap = { P01: { name: "Phường A", in_lez: true }, P02: { name: "Phường B", in_lez: false } };

  assert(lezGroup({ A4: "P02", A5: "P01" }, wards)?.group4 === "work_only", "LEZ: chỉ làm việc trong LEZ");

  assert(lezGroup({ A4: "P01", A5: NO_FIXED_WORKPLACE }, wards)?.group4 === "res_only", "LEZ: không có nơi làm cố định");

  assert(likertValue("SD2", { SD2: 5 }) === 1 && likertValue("SD1", { SD1: 5 }) === 5, "Likert: SD2, SD4 được đảo chiều");



  // 9. Định mức

  const pool = Array.from({ length: 360 }, (_, i) => ({ ...base, id: "P" + i, status: "complete" as const, answers: { S1: "25_30" } }));

  const newbie = { ...base, answers: { S1: "25_30" } };

  assert(quotaBlocks(newbie, "S1", pool, wards)?.id === "age_18_24", "Định mức: đủ 360 người 25–30 thì chặn người 25–30 mới (giữ 240 chỗ cho 18–24)");

  assert(quotaBlocks({ ...newbie, answers: { S1: "18_24" } }, "S1", pool, wards) === null, "Định mức: vẫn nhận người 18–24");



  // 10. Xuất Apollo

  const exp = { ...base, status: "complete" as const, flags: undefined,

    dce: doneR.dceCardOrder!.map((c, i) => ({ card: c, position: i + 1, choice: "A" as const, certainty: 7, inferred: i === 2 || i === 5 ? "B" as const : undefined })) };

  const long = apolloLong([exp], demo, flex, wards);

  assert(long.length === 8 && long.every((r) => typeof r.price_A === "number" && r.choice === 1), "Xuất Apollo: 8 dòng/người, thuộc tính đã mã hóa số");

  assert(!toCsv(long).includes("undefined"), "Xuất CSV: giá trị thiếu ghi là NA");



  // 11. Luật chọn thuộc tính linh hoạt

  const s1 = flexSelection([

    { flexId: "station", est: 1.2, lo: 1.0, hi: 1.4 }, { flexId: "finance", est: 0.9, lo: 0.8, hi: 1.0 },

    { flexId: "warranty", est: 0.5, lo: 0.4, hi: 0.6 }, { flexId: "range", est: 0.2, lo: 0.1, hi: 0.3 },

    { flexId: "safety", est: 0.1, lo: 0.0, hi: 0.2 }, { flexId: "buyback", est: 0.0, lo: -0.1, hi: 0.1 },

  ]);

  assert(s1.chosen.join() === "station,finance", "Luật chọn: tách biệt rõ → lấy 2 ứng viên đầu");

  const s2 = flexSelection([

    { flexId: "finance", est: 1.2, lo: 1.0, hi: 1.4 }, { flexId: "warranty", est: 0.9, lo: 0.7, hi: 1.1 },

    { flexId: "range", est: 0.85, lo: 0.65, hi: 1.05 }, { flexId: "station", est: 0.3, lo: 0.2, hi: 0.4 },

    { flexId: "safety", est: 0.1, lo: 0.0, hi: 0.2 }, { flexId: "buyback", est: 0.0, lo: -0.1, hi: 0.1 },

  ]);

  assert(s2.chosen.join() === "finance,range", "Luật chọn: hai ứng viên cùng nhóm Tài chính → thay bằng ứng viên nhóm khác có khoảng tin cậy giao nhau");



  console.log("\nTất cả kiểm tra đều đạt.");

}



// Chạy tự kiểm tra khi gọi trực tiếp file này

if (typeof process !== "undefined" && process.argv[1] && /surveyLogic\.(ts|js)$/.test(process.argv[1])) selfTest();
