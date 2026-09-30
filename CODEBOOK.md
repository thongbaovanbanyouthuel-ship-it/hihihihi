# TỪ ĐIỂN BIẾN (CODEBOOK)
**Đề tài NCKH:** Các rào cản ảnh hưởng đến sự sẵn sàng chuyển đổi từ xe máy xăng sang xe máy điện của người trẻ tại TP.HCM: Góc nhìn từ sự hoài nghi môi trường và đánh đổi lợi ích.
**Đối tượng khảo sát:** Người trẻ 18–30 tuổi, tự chủ tài chính, đang sử dụng xe máy xăng tại TP.HCM.

---

## 1. Dữ liệu khảo sát dạng rộng (`survey_responses_wide.csv`)
Mỗi dòng đại diện cho một người trả lời (1 quan sát).

| Tên biến | Loại dữ liệu | Thang đo | Giá trị / Mã hóa | Mô tả |
| :--- | :--- | :--- | :--- | :--- |
| `respondent_id` | String | Định danh | `RESP_0001` .. | Mã định danh người trả lời (ẩn danh, không liên kết PII) |
| `order_version` | Categorical | Phân loại | `A`, `B` | Phiên bản thứ tự: A = BWS trước DCE; B = DCE trước BWS |
| `dce_block` | Categorical | Phân loại | `K1`, `K2`, `K3` | Khối thực nghiệm DCE được phân bổ ngẫu nhiên cân bằng |
| `channel` | Categorical | Phân loại | `online`, `offline` | Kênh thu thập qua URL (`?ch=online` hoặc `?ch=offline`) |
| `duration_seconds`| Integer | Tỷ lệ | Số nguyên dương | Tổng thời gian hoàn thành phiếu khảo sát (giây) |
| `flag_attention` | Binary | Chỉ báo | `0` = Hợp lệ, `1` = Sai câu kiểm tra chú ý | Cờ kiểm tra chú ý (chọn sai 'Màu xanh lá') |
| `flag_dominant` | Binary | Chỉ báo | `0` = Hợp lệ, `1` = Chọn phương án trội kém | Cờ phương án bị trội trong thẻ kiểm tra |
| `flag_speeder` | Binary | Chỉ báo | `0` = Hợp lệ, `1` = Thời gian < 1/3 trung vị | Cờ trả lời quá nhanh |
| `flag_straightline`| Binary | Chỉ báo | `0` = Hợp lệ, `1` = Chọn 1 mức duy nhất | Cờ chọn cùng một mức cho toàn bộ 14 mục Likert |
| `flag_duplicate` | Binary | Chỉ báo | `0` = Không trùng, `1` = Trùng fingerprint | Cờ dấu vân tay/cookie trùng lặp |
| `is_valid` | Binary | Chỉ báo | `0` = Loại, `1` = Hợp lệ | Phiếu đạt chuẩn để đưa vào phân tích chính thức |
| `age_group` | Categorical | Phân loại | `18-24`, `25-30` | Nhóm tuổi sàng lọc (S1) |
| `age` | Integer | Tỷ lệ | 18 – 30 | Tuổi người trả lời |
| `gender` | Categorical | Phân loại | `Nam`, `Nữ`, `Khác/Không muốn trả lời` | Giới tính (F2) |
| `education` | Categorical | Thứ bậc | `THPT trở xuống`, `Trung cấp/Cao đẳng`, `Đại học`, `Sau đại học` | Trình độ học vấn cao nhất (F3) |
| `occupation` | Categorical | Phân loại | 7 nhóm nghề nghiệp | Nghề nghiệp chính (F4) |
| `income` | Categorical | Thứ bậc | 5 mức thu nhập | Thu nhập cá nhân hằng tháng (F5) |
| `residual_income` | Categorical | Thứ bậc | 5 mức thặng dư | Tiền dư sau khi trả chi phí thiết yếu (F6) |
| `daily_km` | Categorical | Thứ bậc | 4 mức cự ly | Quãng đường đi xe máy mỗi ngày (A1) |
| `monthly_fuel_cost`| Integer | Tỷ lệ | 50 – 5.000 (nghìn đồng) | Tiền xăng chi hằng tháng (A2) |
| `home_charging` | Categorical | Phân loại | 4 mức khả năng sạc | Khả năng sạc xe điện qua đêm tại nơi ở (A3) |
| `residence_ward` | String | Danh mục | Tên phường/xã | Phường/xã cư trú tại TP.HCM (A4) |
| `workplace_ward` | String | Danh mục | Tên phường/xã | Phường/xã làm việc tại TP.HCM (A5) |
| `LEZ_Residence` | Binary | Chỉ báo | `0` = Ngoài LEZ, `1` = Trong LEZ | Nơi ở thuộc vùng phát thải thấp đề án |
| `LEZ_Workplace` | Binary | Chỉ báo | `0` = Ngoài LEZ, `1` = Trong LEZ | Nơi làm việc thuộc vùng phát thải thấp |
| `A6_news` | Categorical | Thứ bậc | 4 mức độ đọc tin | Tần suất đọc tin xe điện/năng lượng/môi trường (A6) |
| `A7_lez_knowledge`| Categorical | Thứ bậc | `Biết rõ`, `Có nghe qua`, `Chưa biết` | Mức độ biết về đề án LEZ (A7) |
| `A8_lez_response` | Categorical | Danh mục | 6 phương án ứng phó | Kế hoạch ứng phó khi LEZ được áp dụng (A8) |
| `RD1` – `RD4` | Integer | Likert 1–5 | 1 = Rất không đồng ý .. 5 = Rất đồng ý | Thang đo sự sẵn sàng chuyển đổi |
| `RD5` | Integer | Thang 0–10 | 0 = Chắc chắn không .. 10 = Chắc chắn có | Khả năng chuyển sang xe điện trong 2 năm |
| `SK1` – `SK6` | Integer | Likert 1–5 | 1 = Rất không đồng ý .. 5 = Rất đồng ý | Thang đo Hoài nghi môi trường (S*) |
| `FR1` – `FR4` | Integer | Likert 1–5 | 1 = Rất không đồng ý .. 5 = Rất đồng ý | Thang đo Nhận thức rủi ro tài chính (F*) |
| `SD1` – `SD4` | Integer | Likert 1–5 | 1 = Rất không đồng ý .. 5 = Rất đồng ý | Khát vọng xã hội (SD2, SD4 đảo chiều) |
| `D9_attribute_non_attendance` | String | Đa lựa chọn | Danh sách đặc điểm bỏ qua | Thuộc tính bị bỏ qua khi chọn DCE |
| `D10_realism` | Integer | Thang 1–5 | 1 = Rất không thực tế .. 5 = Rất thực tế | Độ chân thực của các phương án DCE |
| `D11_optout_reason` | String | Danh mục | Lý do giữ xe xăng | Lý do chính chọn giữ xe xăng (nếu có) |
| `F1_support_policies` | String | Đa lựa chọn | Tối đa 3 chính sách | Chính sách hỗ trợ hữu ích nhất |
| `F7_max_ev_budget`| Categorical | Thứ bậc | 4 mức ngân sách | Số tiền tối đa có thể chi để mua xe điện |

---

## 2. Dữ liệu dạng dài cho Discrete Choice Experiment (`survey_data_apollo_long.csv`)
Mỗi dòng đại diện cho một thẻ lựa chọn của một người trả lời (8 dòng/người, tương ứng 8 thẻ DCE).

| Tên biến | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `respondent_id` | String | Mã người trả lời |
| `block` | Factor | Khối DCE (`K1`, `K2`, `K3`) |
| `order_version` | Factor | Thứ tự khảo sát (`A`, `B`) |
| `card_num` | Integer | Mã thẻ trong thiết kế gốc (1–8) |
| `display_pos` | Integer | Vị trí hiển thị thực tế trên màn hình (1–8) sau khi xáo trộn |
| `is_dominance_check` | Binary | `1` = Thẻ kiểm tra phương án bị trội; `0` = Thẻ thực nghiệm |
| `choice` | Integer | Lựa chọn của người tham gia: `1` = Xe điện A, `2` = Xe điện B, `3` = Giữ xe xăng (Opt-out) |
| `price_A`, `price_B` | Numeric | Giá mua xe chưa pin của Xe điện A/B (18, 24, 30, 36 triệu đồng) |
| `battery_A`, `battery_B` | Factor | Gói pin Xe điện A/B: `buy` (mua đứt), `rent150`, `rent250`, `rent350` (thuê pin/tháng) |
| `energy_A`, `energy_B` | Factor | Nguồn năng lượng trạm sạc: `grid` (lưới điện), `solar` (điện mặt trời áp mái) |
| `recycle_A`, `recycle_B`| Factor | Cam kết tái chế: `none`, `cert50` (50% chứng nhận), `100audit` (100% kiểm toán) |
| `flex1_A`, `flex1_B` | Factor | Thuộc tính linh hoạt 1 (Ví dụ: khoảng cách trạm sạc `3km`, `1km`, `home`) |
| `flex2_A`, `flex2_B` | Factor | Thuộc tính linh hoạt 2 (Ví dụ: cam kết mua lại `none`, `40pct`, `60pct`) |
| `fuel_cost_OPT` | Numeric | Tiền xăng hiện tại (chèn từ A2 của người đó, nghìn đồng/tháng) |
| `lez_fee_OPT` | Numeric | Phụ phí phát thải LEZ của xe xăng (0, 100, 200 nghìn đồng/tháng) |
| `certainty` | Integer | Thang đo độ chắc chắn về lựa chọn (1–10) |
| `peer_choice` | Integer | Dự đoán lựa chọn của người trẻ điển hình (ở vị trí 3 và 6) |
| `LEZ_Residence` | Binary | `1` = Cư trú trong vùng LEZ, `0` = Ngoài |
| `LEZ_Workplace` | Binary | `1` = Nơi làm việc trong vùng LEZ, `0` = Ngoài |
| `SK_mean`, `FR_mean`, `SD_mean` | Numeric | Điểm trung bình các thang đo chuẩn hóa |
| `channel` | Factor | Kênh khảo sát (`online` / `offline`) |

---

## 3. Dữ liệu dạng dài cho Best-Worst Scaling (`survey_data_bws_long.csv`)
Mỗi dòng đại diện cho một tập lựa chọn BWS của một người trả lời (13 dòng/người).

| Tên biến | Kiểu | Mô tả |
| :--- | :--- | :--- |
| `respondent_id` | String | Mã người trả lời |
| `set_id` | Factor | Mã tập trong thiết kế BIBD (`C1` .. `C13`) |
| `display_order` | Integer | Thứ tự hiển thị tập cho người trả lời sau khi xáo trộn (1–13) |
| `item_1` .. `item_4`| Factor | 4 rào cản xuất hiện trong tập (thứ tự ngẫu nhiên) |
| `best_item` | Factor | Rào cản được chọn là **Cản trở nhiều nhất** (`R1` .. `R13`) |
| `worst_item` | Factor | Rào cản được chọn là **Cản trở ít nhất** (`R1` .. `R13`) |
