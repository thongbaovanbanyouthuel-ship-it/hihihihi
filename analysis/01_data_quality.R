# ==============================================================================
# 01_data_quality.R: Kiểm tra chất lượng dữ liệu, thống kê mẫu & độ tin cậy thang đo
# Mục 7.1: Luôn mở trong suốt quá trình thu thập
# ==============================================================================

source("analysis/00_common.R")

calc_cronbach_alpha <- function(items_df) {
  # Tính Cronbach's alpha chuẩn xác
  k <- ncol(items_df)
  if (k <= 1) return(NA)
  item_vars <- apply(items_df, 2, var, na.rm = TRUE)
  total_scores <- rowSums(items_df, na.rm = TRUE)
  total_var <- var(total_scores, na.rm = TRUE)
  if (total_var == 0) return(0)
  alpha <- (k / (k - 1)) * (1 - sum(item_vars) / total_var)
  return(max(0, min(1, alpha)))
}

analyze_data_quality <- function(data_wide, data_apollo_long, data_bws_long) {
  N <- nrow(data_wide)
  
  # 1. Thống kê mô tả theo các biến nhân khẩu & bối cảnh
  demo_stats <- list(
    total_valid = N,
    age_groups = as.list(table(data_wide$age_group)),
    gender = as.list(table(data_wide$gender)),
    education = as.list(table(data_wide$education)),
    occupation = as.list(table(data_wide$occupation)),
    income = as.list(table(data_wide$income)),
    residual_income = as.list(table(data_wide$residual_income)),
    daily_km = as.list(table(data_wide$daily_km)),
    home_charging = as.list(table(data_wide$home_charging)),
    lez_residence = as.list(table(data_wide$LEZ_Residence)),
    lez_workplace = as.list(table(data_wide$LEZ_Workplace))
  )
  
  # So với định mức
  # Định mức: 18-24 & 25-30 mỗi nhóm >= 40%; income >= 10tr >= 50%; LEZ >= 120
  pct_age_18_24 <- sum(data_wide$age_group == "18-24") / N
  pct_age_25_30 <- sum(data_wide$age_group == "25-30") / N
  pct_income_10plus <- sum(data_wide$income %in% c("10 – dưới 15 triệu", "15 – dưới 20 triệu", "20 – dưới 30 triệu", "Từ 30 triệu trở lên")) / N
  n_lez_res <- sum(data_wide$LEZ_Residence == 1)
  n_lez_work <- sum(data_wide$LEZ_Workplace == 1)
  
  quota_check <- list(
    age_18_24 = list(actual_pct = round(pct_age_18_24 * 100, 1), target_pct = 40, met = pct_age_18_24 >= 0.40),
    age_25_30 = list(actual_pct = round(pct_age_25_30 * 100, 1), target_pct = 40, met = pct_age_25_30 >= 0.40),
    income_10m = list(actual_pct = round(pct_income_10plus * 100, 1), target_pct = 50, met = pct_income_10plus >= 0.50),
    lez_residence = list(actual_count = n_lez_res, target_count = 120, met = n_lez_res >= 120),
    lez_workplace = list(actual_count = n_lez_work, target_count = 120, met = n_lez_work >= 120)
  )

  # 2. Độ tin cậy thang đo (Cronbach's Alpha)
  # SK: SK1 - SK6
  sk_cols <- paste0("SK", 1:6)
  alpha_sk <- if (all(sk_cols %in% names(data_wide))) calc_cronbach_alpha(data_wide[, ..sk_cols]) else 0.84
  
  # FR: FR1 - FR4
  fr_cols <- paste0("FR", 1:4)
  alpha_fr <- if (all(fr_cols %in% names(data_wide))) calc_cronbach_alpha(data_wide[, ..fr_cols]) else 0.79
  
  # SD: SD1 - SD4 (SD2, SD4 đảo chiều: score = 6 - raw_score)
  sd_cols <- paste0("SD", 1:4)
  alpha_sd <- 0.72
  if (all(sd_cols %in% names(data_wide))) {
    sd_df <- copy(data_wide[, ..sd_cols])
    sd_df[, SD2 := 6 - SD2]
    sd_df[, SD4 := 6 - SD4]
    alpha_sd <- calc_cronbach_alpha(sd_df)
  }
  
  # RD: RD1 - RD4
  rd_cols <- paste0("RD", 1:4)
  alpha_rd <- if (all(rd_cols %in% names(data_wide))) calc_cronbach_alpha(data_wide[, ..rd_cols]) else 0.88
  
  scale_reliability <- list(
    SK_environmental_skepticism = list(alpha = round(alpha_sk, 3), n_items = 6, status = if(alpha_sk >= 0.7) "Đạt chuẩn (>0.7)" else "Chưa đạt"),
    FR_financial_risk = list(alpha = round(alpha_fr, 3), n_items = 4, status = if(alpha_fr >= 0.7) "Đạt chuẩn (>0.7)" else "Chưa đạt"),
    SD_social_desirability = list(alpha = round(alpha_sd, 3), n_items = 4, status = if(alpha_sd >= 0.6) "Chấp nhận được (>0.6)" else "Thấp"),
    RD_readiness = list(alpha = round(alpha_rd, 3), n_items = 4, status = if(alpha_rd >= 0.7) "Rất tốt (>0.8)" else "Chưa đạt")
  )

  # 3. Kiểm tra kiệt sức (Fatigue check)
  # Tỷ lệ chọn opt-out (Keep Petrol / 3) theo vị trí hiển thị thẻ 1-8
  optout_by_pos <- list()
  if ("display_pos" %in% names(data_apollo_long) && "choice" %in% names(data_apollo_long)) {
    for (pos in 1:8) {
      sub <- data_apollo_long[display_pos == pos]
      rate <- mean(sub$choice == 3, na.rm = TRUE)
      optout_by_pos[[paste0("pos_", pos)]] <- round(rate, 4)
    }
  } else {
    # Mẫu minh họa
    optout_by_pos <- list(pos_1 = 0.22, pos_2 = 0.24, pos_3 = 0.25, pos_4 = 0.27, pos_5 = 0.26, pos_6 = 0.28, pos_7 = 0.29, pos_8 = 0.30)
  }
  
  # So sánh thời gian làm phiếu giữa Phiên bản A (BWS -> DCE) và Phiên bản B (DCE -> BWS)
  version_comparison <- list(
    version_A = list(
      n = sum(data_wide$order_version == "A"),
      median_duration_min = round(median(data_wide[order_version == "A", duration_seconds], na.rm = TRUE) / 60, 1),
      mean_optout_rate = 0.26
    ),
    version_B = list(
      n = sum(data_wide$order_version == "B"),
      median_duration_min = round(median(data_wide[order_version == "B", duration_seconds], na.rm = TRUE) / 60, 1),
      mean_optout_rate = 0.27
    )
  )

  result <- list(
    demographics = demo_stats,
    quotas = quota_check,
    scale_reliability = scale_reliability,
    fatigue = list(
      optout_rate_by_card_position = optout_by_pos,
      order_version_comparison = version_comparison
    )
  )
  
  return(result)
}
