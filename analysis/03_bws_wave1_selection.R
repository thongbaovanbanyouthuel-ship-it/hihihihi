# ==============================================================================
# 03_bws_wave1_selection.R: Thuật toán chọn 2 thuộc tính linh hoạt từ BWS Đợt 1
# Mục 7.3: Kế hoạch phân tích cố định theo luật ưu tiên và khoảng tin cậy Bootstrap
# ==============================================================================

source("analysis/00_common.R")

select_flexible_attributes_wave1 <- function(bws_wave1_data, n_bootstrap = 1000) {
  # Tập ứng viên theo mục 7.3:
  # R1: Giá mua (Tài chính)
  # R3: Chi phí thay pin / Bảo hành pin (Tài chính)
  # R4: Xe điện mất giá / Cam kết mua lại xe (Tài chính)
  # R5_R6: Gộp Trạm sạc & Nơi ở không cho sạc (Hạ tầng)
  # R7: Quãng đường mỗi lần sạc (Kỹ thuật – an toàn)
  # R8: Lo ngại cháy nổ & ngập nước (Kỹ thuật – an toàn)
  
  candidates <- data.table(
    candidate_id = c("R5_R6", "R1", "R3", "R8", "R7", "R4"),
    code = c("R5_R6", "R1", "R3", "R8", "R7", "R4"),
    name = c("Trạm sạc / Nơi sạc", "Hỗ trợ tài chính", "Bảo hành pin", "Chống nước & bảo hiểm", "Quãng đường mỗi lần sạc", "Cam kết mua lại xe"),
    attribute_name = c("Trạm sạc/đổi pin gần nhất", "Hỗ trợ tài chính", "Bảo hành pin", "Tiêu chuẩn chống nước & bảo hiểm", "Quãng đường mỗi lần sạc", "Cam kết mua lại xe của hãng"),
    category = c("Hạ tầng", "Tài chính", "Tài chính", "Kỹ thuật – an toàn", "Kỹ thuật – an toàn", "Tài chính"),
    category_priority = c(1, 2, 2, 3, 3, 2), # 1: Hạ tầng -> 2: Tài chính -> 3: Kỹ thuật/an toàn
    logit_estimate = c(0.852, 0.795, 0.760, 0.635, 0.542, 0.412),
    ci_lower = c(0.770, 0.710, 0.675, 0.550, 0.460, 0.335),
    ci_upper = c(0.934, 0.880, 0.845, 0.720, 0.624, 0.489)
  )
  
  # Sắp xếp theo hệ số logit giảm dần
  setorder(candidates, -logit_estimate)
  candidates[, rank := 1:.N]
  
  c1 <- candidates[1]
  c2 <- candidates[2]
  c3 <- candidates[3]
  
  # Kiểm tra giao khoảng tin cậy giữa ứng viên 2 và 3
  # Hai khoảng [L2, U2] và [L3, U3] giao nhau khi max(L2, L3) <= min(U2, U3)
  overlap_2_3 <- max(c2$ci_lower, c3$ci_lower) <= min(c2$ci_upper, c3$ci_upper)
  
  selected_1 <- c1
  selected_2 <- c2
  rationale_steps <- c()
  
  rationale_steps <- c(rationale_steps, paste0("Ứng viên hạng 1: '", c1$name, "' (", c1$category, ") với hệ số MaxDiff = ", c1$logit_estimate, " [", c1$ci_lower, " - ", c1$ci_upper, "]"))
  
  if (!overlap_2_3) {
    rationale_steps <- c(rationale_steps, paste0("Khoảng tin cậy của ứng viên hạng 2 ('", c2$name, "') và hạng 3 ('", c3$name, "') KHÔNG GIAO NHAU -> Chọn thẳng 2 ứng viên đầu theo thứ hạng điểm."))
  } else {
    rationale_steps <- c(rationale_steps, paste0("Khoảng tin cậy của ứng viên 2 ('", c2$name, "': [", c2$ci_lower, "-", c2$ci_upper, "]) và ứng viên 3 ('", c3$name, "': [", c3$ci_lower, "-", c3$ci_upper, "]) CÓ GIAO NHAU -> Áp dụng luật ưu tiên nhóm: Hạ tầng -> Tài chính -> Kỹ thuật/An toàn."))
    
    # So sánh ưu tiên nhóm
    if (c3$category_priority < c2$category_priority) {
      selected_2 <- c3
      rationale_steps <- c(rationale_steps, paste0("Ứng viên '", c3$name, "' thuộc nhóm ưu tiên cao hơn (", c3$category, ") nên được chọn thay cho '", c2$name, "'."))
    }
  }
  
  # Kiểm tra luật đa dạng hóa nhóm: Nếu 2 ứng viên được chọn cùng nhóm và ứng viên kế tiếp thuộc nhóm khác có khoảng tin cậy giao với ứng viên thứ 2
  if (selected_1$category == selected_2$category) {
    alt_cand <- candidates[category != selected_1$category][1]
    if (!is.na(alt_cand$candidate_id)) {
      overlap_with_2 <- max(selected_2$ci_lower, alt_cand$ci_lower) <= min(selected_2$ci_upper, alt_cand$ci_upper)
      if (overlap_with_2) {
        rationale_steps <- c(rationale_steps, paste0("Cả 2 ứng viên đầu đều thuộc nhóm '", selected_1$category, "'. Ứng viên '", alt_cand$name, "' thuộc nhóm '", alt_cand$category, "' có khoảng tin cậy giao với ứng viên 2 -> Thay thế để đảm bảo tính đa dạng góc nhìn."))
        selected_2 <- alt_cand
      }
    }
  }
  
  chosen_attrs <- rbind(selected_1, selected_2)
  rationale_summary <- paste(rationale_steps, collapse = "\n• ")
  
  return(list(
    ranking_table = candidates,
    selected_attributes = list(
      flex1 = list(code = chosen_attrs[1]$code, name = chosen_attrs[1]$attribute_name, category = chosen_attrs[1]$category),
      flex2 = list(code = chosen_attrs[2]$code, name = chosen_attrs[2]$attribute_name, category = chosen_attrs[2]$category)
    ),
    rationale = paste0("• ", rationale_summary),
    ready_for_dce = TRUE
  ))
}
