# ==============================================================================
# 00_common.R: Cấu hình chung, nạp gói và các hàm tiện ích cho phân tích NCKH
# Đề tài: Các rào cản ảnh hưởng đến sự sẵn sàng chuyển đổi từ xe máy xăng sang xe máy điện
# ==============================================================================

suppressPackageStartupMessages({
  if (!requireNamespace("data.table", quietly = TRUE)) install.packages("data.table", repos="https://cloud.r-project.org")
  if (!requireNamespace("jsonlite", quietly = TRUE)) install.packages("jsonlite", repos="https://cloud.r-project.org")
  library(data.table)
  library(jsonlite)
})

# Hàm nạp an toàn các gói chuyên sâu (nếu chưa có thì thông báo rõ)
load_analysis_packages <- function() {
  pkgs <- c("apollo", "lavaan", "psych", "MASS", "support.BWS")
  for (pkg in pkgs) {
    if (requireNamespace(pkg, quietly = TRUE)) {
      suppressPackageStartupMessages(library(pkg, character.only = TRUE))
    } else {
      message(paste0("[THÔNG BÁO] Gói R '", pkg, "' chưa được cài đặt. Khi chạy trong Docker R môi trường sẽ có đầy đủ."))
    }
  }
}

# Định danh 13 rào cản BWS và 5 nhóm
BARRIER_INFO <- data.table(
  code = paste0("R", 1:13),
  label = c(
    "Giá mua xe điện cao hơn xe xăng",
    "Phí thuê pin hằng tháng gánh nặng/phụ thuộc",
    "Chi phí thay pin cao/khó dự đoán",
    "Xe điện mất giá nhanh/khó bán lại",
    "Trạm sạc/đổi pin chưa đủ dày",
    "Nơi ở không cho/không có chỗ sạc",
    "Quãng đường mỗi lần sạc không đủ",
    "Lo ngại cháy nổ pin & đường ngập",
    "Xe xăng hiện tại vẫn tốt/đổi xe lãng phí",
    "Pin cũ không được thu hồi/tái chế đúng cách",
    "Điện sạc chủ yếu từ nhiệt điện than",
    "Sản xuất pin gây phát thải/khoáng sản",
    "Tuyên bố 'xanh' chỉ là marketing"
  ),
  category = c(
    "Tài chính", "Tài chính", "Tài chính", "Tài chính",
    "Hạ tầng", "Hạ tầng",
    "Kỹ thuật – an toàn", "Kỹ thuật – an toàn",
    "Thói quen – hiện trạng",
    "Hoài nghi môi trường", "Hoài nghi môi trường", "Hoài nghi môi trường", "Hoài nghi môi trường"
  ),
  color = c(
    "#F59E0B", "#F59E0B", "#F59E0B", "#F59E0B",
    "#3B82F6", "#3B82F6",
    "#EF4444", "#EF4444",
    "#6B7280",
    "#10B981", "#10B981", "#10B981", "#10B981"
  )
)

# Hàm chuẩn hóa kết quả mô hình thành định dạng JSON chuẩn cho Web UI
format_model_output <- function(model_name, converged, ll, n_obs, n_params, aic, bic, run_time_sec, estimates, diagnostics = list(), warnings = list()) {
  list(
    model_name = model_name,
    timestamp = Sys.time(),
    diagnostics = list(
      converged = as.logical(converged),
      log_likelihood = round(as.numeric(ll), 4),
      n_observations = as.integer(n_obs),
      n_parameters = as.integer(n_params),
      aic = round(as.numeric(aic), 2),
      bic = round(as.numeric(bic), 2),
      run_time_sec = round(as.numeric(run_time_sec), 2),
      apollo_warnings = warnings
    ),
    estimates = estimates,
    extra = diagnostics
  )
}
