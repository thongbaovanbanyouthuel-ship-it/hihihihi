// src/lib/surveyData.ts
// Toàn bộ nội dung bảng hỏi cố định theo Mục 5, danh mục BWS, ngân hàng DCE và danh sách phường/xã TP.HCM

export interface BarrierItem {
  code: string;
  label: string;
  category: string;
  color: string;
}

export const BARRIERS: BarrierItem[] = [
  { code: "R1", label: "Giá mua xe điện cao hơn xe xăng cùng phân khúc", category: "Tài chính", color: "#F59E0B" },
  { code: "R2", label: "Phí thuê pin hằng tháng là gánh nặng lâu dài và khiến tôi phụ thuộc vào hãng", category: "Tài chính", color: "#F59E0B" },
  { code: "R3", label: "Chi phí thay pin cao và khó dự đoán", category: "Tài chính", color: "#F59E0B" },
  { code: "R4", label: "Xe điện mất giá nhanh, khó bán lại", category: "Tài chính", color: "#F59E0B" },
  { code: "R5", label: "Trạm sạc/đổi pin chưa đủ dày trên các tuyến tôi thường đi", category: "Hạ tầng", color: "#3B82F6" },
  { code: "R6", label: "Nơi ở (chung cư, nhà trọ) không cho sạc hoặc không có chỗ sạc", category: "Hạ tầng", color: "#3B82F6" },
  { code: "R7", label: "Quãng đường mỗi lần sạc không đủ cho nhu cầu của tôi", category: "Kỹ thuật – an toàn", color: "#EF4444" },
  { code: "R8", label: "Tôi lo ngại cháy nổ pin và xe hư hỏng khi đi qua đường ngập", category: "Kỹ thuật – an toàn", color: "#EF4444" },
  { code: "R9", label: "Xe xăng hiện tại vẫn dùng tốt, đổi xe lúc này là lãng phí", category: "Thói quen – hiện trạng", color: "#6B7280" },
  { code: "R10", label: "Pin cũ có thể không được thu hồi, tái chế đúng cách", category: "Hoài nghi môi trường", color: "#10B981" },
  { code: "R11", label: "Điện để sạc xe chủ yếu đến từ nhiệt điện than", category: "Hoài nghi môi trường", color: "#10B981" },
  { code: "R12", label: "Sản xuất pin gây phát thải và khai thác khoáng sản lớn", category: "Hoài nghi môi trường", color: "#10B981" },
  { code: "R13", label: "Tuyên bố 'xanh' của các hãng xe chủ yếu là chiêu marketing", category: "Hoài nghi môi trường", color: "#10B981" }
];

// 13 tập BWS BIBD (v=13, k=4, r=4, lambda=1) sinh từ tập sai phân {0, 1, 3, 9} mod 13
export const BWS_BIBD_SETS: Record<string, string[]> = {
  "C1": ["R1", "R2", "R4", "R10"],
  "C2": ["R2", "R3", "R5", "R11"],
  "C3": ["R3", "R4", "R6", "R12"],
  "C4": ["R4", "R5", "R7", "R13"],
  "C5": ["R5", "R6", "R8", "R1"],
  "C6": ["R6", "R7", "R9", "R2"],
  "C7": ["R7", "R8", "R10", "R3"],
  "C8": ["R8", "R9", "R11", "R4"],
  "C9": ["R9", "R10", "R12", "R5"],
  "C10": ["R10", "R11", "R13", "R6"],
  "C11": ["R11", "R12", "R1", "R7"],
  "C12": ["R12", "R13", "R2", "R8"],
  "C13": ["R13", "R1", "R3", "R9"]
};

// 14 nhận định Likert (Mục 5.7) + Câu kiểm tra chú ý
export const ATTITUDE_ITEMS = [
  // SK - Hoài nghi môi trường (S*)
  { id: "SK1", group: "SK", text: "Lợi ích môi trường của xe máy điện thường bị phóng đại." },
  { id: "SK2", group: "SK", text: "Nếu tính cả việc sản xuất pin, xe máy điện chưa chắc sạch hơn xe xăng." },
  { id: "SK3", group: "SK", text: "Ở Việt Nam, sạc xe điện chủ yếu chỉ chuyển ô nhiễm từ đường phố sang nhà máy điện." },
  { id: "SK4", group: "SK", text: "Tôi không tin các hãng xe sẽ thực sự thu hồi và tái chế pin cũ." },
  { id: "SK5", group: "SK", text: "Các hãng xe dùng hình ảnh 'xanh' chủ yếu để bán hàng." },
  { id: "SK6", group: "SK", text: "Tôi cần bằng chứng độc lập trước khi tin rằng một chiếc xe điện là 'xanh'." },

  // FR - Nhận thức rủi ro tài chính (F*)
  { id: "FR1", group: "FR", text: "Xe máy điện sẽ mất giá nhanh hơn xe xăng khi bán lại." },
  { id: "FR2", group: "FR", text: "Chi phí thay pin trong tương lai là khoản tôi khó dự trù." },
  { id: "FR3", group: "FR", text: "Phí thuê pin có thể bị hãng tăng lên bất cứ lúc nào." },
  { id: "FR4", group: "FR", text: "Mua xe máy điện lúc này có nhiều rủi ro tài chính hơn là lợi ích." },

  // SD - Khát vọng xã hội (SD2, SD4 đảo chiều)
  { id: "SD1", group: "SD", text: "Tôi chưa bao giờ nói dối để có lợi cho bản thân.", reversed: false },
  { id: "SD2", group: "SD", text: "Đôi khi tôi cảm thấy khó chịu khi không được làm theo ý mình.", reversed: true },
  { id: "SD3", group: "SD", text: "Tôi luôn sẵn lòng thừa nhận khi mình mắc lỗi.", reversed: false },
  { id: "SD4", group: "SD", text: "Đã có lúc tôi lợi dụng người khác.", reversed: true }
];

export const ATTENTION_CHECK_ITEM = {
  id: "CHECK",
  question: "Để xác nhận anh/chị đang đọc kỹ câu hỏi, vui lòng chọn 'Màu xanh lá'.",
  correct: "Màu xanh lá",
  options: ["Màu đỏ", "Màu xanh lá", "Màu vàng", "Màu trắng"]
};

// 7 chính sách hỗ trợ (F1)
export const SUPPORT_POLICIES_F1 = [
  "Trả góp 0% qua ngân hàng hoặc hãng xe",
  "Thu cũ đổi mới xe xăng có trợ giá của thành phố",
  "Miễn lệ phí trước bạ, phí đăng ký biển số",
  "Trạm sạc/đổi pin tại chung cư, tòa nhà văn phòng",
  "Gói thuê pin giá cố định trong 3–5 năm",
  "Quyền chuyển từ thuê pin sang mua đứt pin",
  "Cam kết mua lại xe của hãng",
  "Chứng nhận độc lập về thu hồi, tái chế pin",
  "Công khai tỷ lệ điện tái tạo tại trạm sạc",
  "Bảo hiểm cháy nổ pin do hãng chi trả",
  "Khác"
];
