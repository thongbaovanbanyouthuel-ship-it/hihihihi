"""
Sinh dữ liệu giả lập chuẩn xác cho 600 người trả lời nghiên cứu NCKH:
- 1. survey_responses_wide.csv (Dạng rộng: 1 dòng/người)
- 2. survey_data_apollo_long.csv (Dạng dài cho Apollo DCE: 8 dòng/người = 4.800 dòng)
- 3. survey_data_bws_long.csv (Dạng dài cho BWS: 13 dòng/người = 7.800 dòng)
- 4. codebook_variables.json (Từ điển biến)
"""

import json
import csv
import random
import math
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

random.seed(42)

N_RESPONDENTS = 600

# Load wards
with open("d:/ảnh/ev_survey_system/data/hcmc_wards.json", "r", encoding="utf-8") as f:
    WARDS = json.load(f)

# Load DCE blocks
DCE_CARDS = []
with open("d:/ảnh/ev_survey_system/data/dce_design_blocks.csv", "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        DCE_CARDS.append(row)

# Organize DCE by block and card
DCE_BY_BLOCK = {"K1": {}, "K2": {}, "K3": {}}
for r in DCE_CARDS:
    b = r["block"]
    c = int(r["card"])
    alt = r["alt"]
    if c not in DCE_BY_BLOCK[b]:
        DCE_BY_BLOCK[b][c] = {}
    DCE_BY_BLOCK[b][c][alt] = r

# 13 BWS Sets
BASE_DIFF_SET = [0, 1, 3, 9]
BWS_SETS = {
    f"C{i+1}": [f"R{((val + i) % 13) + 1}" for val in BASE_DIFF_SET]
    for i in range(13)
}

# Ground truth barrier weights for simulating BWS choices
BARRIER_WEIGHTS = {
    "R1": 1.4,  # Giá mua
    "R2": 1.2,  # Phí thuê pin
    "R3": 1.1,  # Chi phí thay pin
    "R4": 0.6,  # Mất giá
    "R5": 1.5,  # Trạm sạc chưa đủ dày
    "R6": 1.3,  # Nơi ở không cho sạc
    "R7": 0.8,  # Quãng đường sạc
    "R8": 1.0,  # Cháy nổ & ngập nước
    "R9": 0.0,  # Xe xăng vẫn tốt (tham chiếu)
    "R10": 0.4, # Tái chế pin
    "R11": 0.3, # Điện than
    "R12": 0.5, # Khai khoáng
    "R13": 0.2  # Marketing xanh
}

wide_rows = []
apollo_long_rows = []
bws_long_rows = []

# Demographics options
GENDERS = ["Nam", "Nữ", "Khác/Không muốn trả lời"]
GENDER_WEIGHTS = [0.49, 0.49, 0.02]

EDU_OPTS = ["THPT trở xuống", "Trung cấp/Cao đẳng", "Đại học", "Sau đại học"]
EDU_WEIGHTS = [0.08, 0.16, 0.66, 0.10]

OCC_OPTS = [
    "Nhân viên văn phòng", "Kỹ thuật/sản xuất", "Kinh doanh, bán hàng",
    "Tự doanh/freelance", "Tài xế công nghệ, giao hàng", "Sinh viên có việc làm", "Khác"
]
OCC_WEIGHTS = [0.42, 0.14, 0.16, 0.12, 0.06, 0.08, 0.02]

INC_OPTS = [
    "7 – dưới 10 triệu", "10 – dưới 15 triệu", "15 – dưới 20 triệu",
    "20 – dưới 30 triệu", "Từ 30 triệu trở lên"
]
INC_WEIGHTS = [0.38, 0.32, 0.18, 0.09, 0.03] # Ensure >= 10tr >= 50%

RESIDUAL_OPTS = ["Hầu như không dư", "Dưới 1 triệu", "1 – dưới 3 triệu", "3 – dưới 5 triệu", "Từ 5 triệu trở lên"]
RESIDUAL_WEIGHTS = [0.15, 0.22, 0.35, 0.20, 0.08]

EV_BUDGET_OPTS = ["Dưới 15 triệu", "15 – dưới 25 triệu", "25 – dưới 35 triệu", "Từ 35 triệu trở lên"]
EV_BUDGET_WEIGHTS = [0.12, 0.44, 0.34, 0.10]

DAILY_KM_OPTS = ["Dưới 10 km", "10–20 km", "20–40 km", "Trên 40 km"]
DAILY_KM_WEIGHTS = [0.18, 0.45, 0.30, 0.07]

HOME_CHARGING_OPTS = [
    "Có, dễ dàng",
    "Có nhưng bị hạn chế (phí, giờ, chủ nhà/ban quản lý không cho)",
    "Không",
    "Không biết"
]
HOME_CHARGING_WEIGHTS = [0.40, 0.28, 0.24, 0.08]

A6_OPTS = ["Hầu như không", "Vài lần mỗi tháng", "Vài lần mỗi tuần", "Hằng ngày"]
A7_OPTS = ["Biết rõ", "Có nghe qua", "Chưa biết"]
A8_OPTS = [
    "Chuyển sang xe máy điện",
    "Gửi xe ở rìa vùng rồi đi bộ, xe buýt hoặc metro vào trung tâm",
    "Chuyển hẳn sang giao thông công cộng",
    "Chấp nhận nộp phụ phí và tiếp tục đi xe xăng",
    "Thay đổi nơi ở hoặc nơi làm việc",
    "Không bị ảnh hưởng"
]

print(f"Generating synthetic data for {N_RESPONDENTS} respondents...")

for i in range(1, N_RESPONDENTS + 1):
    resp_id = f"RESP_{i:04d}"
    
    # 1. Randomization balance
    order_version = "A" if (i % 2 == 1) else "B" # 50/50 exactly
    dce_block = ["K1", "K2", "K3"][(i - 1) % 3]   # 33.3% exactly
    channel = "online" if (i <= 480) else "offline" # 80% online, 20% offline
    wave = 2 # Wave 2 (full survey)
    
    # 2. Demographics & Quotas
    # Age: 18-24 or 25-30, >= 40% each
    age_group = "18-24" if (i % 10 < 5) else "25-30" # 50% each
    age_val = random.randint(18, 24) if age_group == "18-24" else random.randint(25, 30)
    
    gender = random.choices(GENDERS, weights=GENDER_WEIGHTS)[0]
    education = random.choices(EDU_OPTS, weights=EDU_WEIGHTS)[0]
    occupation = random.choices(OCC_OPTS, weights=OCC_WEIGHTS)[0]
    income = random.choices(INC_OPTS, weights=INC_WEIGHTS)[0]
    residual_income = random.choices(RESIDUAL_OPTS, weights=RESIDUAL_WEIGHTS)[0]
    max_ev_budget = random.choices(EV_BUDGET_OPTS, weights=EV_BUDGET_WEIGHTS)[0]
    
    # 3. Context
    daily_km = random.choices(DAILY_KM_OPTS, weights=DAILY_KM_WEIGHTS)[0]
    monthly_fuel_cost = random.randint(250, 1500) # thousands VND (250k - 1.5 mil)
    home_charging = random.choices(HOME_CHARGING_OPTS, weights=HOME_CHARGING_WEIGHTS)[0]
    
    # Residence & Workplace Wards
    # Ensure >= 120 in LEZ residence and >= 120 in LEZ workplace
    lez_wards = [w for w in WARDS if w["in_lez"]]
    non_lez_wards = [w for w in WARDS if not w["in_lez"]]
    
    # Assign ~ 25% residence in LEZ, ~ 35% workplace in LEZ
    if i <= 150:
        res_ward = random.choice(lez_wards)
    else:
        res_ward = random.choice(non_lez_wards)
        
    if i <= 210:
        work_ward = random.choice(lez_wards)
    elif i <= 550:
        work_ward = random.choice(non_lez_wards)
    else:
        work_ward = {"id": "NONE", "full_name": "Không có nơi làm việc cố định", "in_lez": False}
        
    lez_residence = 1 if res_ward["in_lez"] else 0
    lez_workplace = 1 if work_ward.get("in_lez", False) else 0
    
    a6_news = random.choices(A6_OPTS, weights=[0.25, 0.35, 0.28, 0.12])[0]
    a7_lez_know = random.choices(A7_OPTS, weights=[0.28, 0.52, 0.20])[0]
    a8_lez_response = random.choices(A8_OPTS, weights=[0.38, 0.16, 0.14, 0.12, 0.08, 0.12])[0]
    
    # Latent traits
    # S* (Environmental skepticism) and F* (Financial risk perception)
    edu_num = 1 if education in ["Đại học", "Sau đại học"] else 0
    inc_num = 1 if income not in ["7 – dưới 10 triệu"] else 0
    
    s_star = -0.2 * edu_num - 0.15 * inc_num + random.gauss(0, 0.9)
    f_star = -0.3 * inc_num + random.gauss(0, 0.8)
    sd_trait = random.gauss(0, 0.7)
    
    # Readiness (RD1-RD5)
    # RD = alpha - 0.3*f_star - 0.3*s_star + 0.3*lez_workplace + eps
    rd_base = 3.4 - 0.35 * f_star - 0.30 * s_star + 0.25 * lez_workplace
    rd1 = max(1, min(5, round(rd_base + random.gauss(0, 0.5))))
    rd2 = max(1, min(5, round(rd_base - 0.2 + random.gauss(0, 0.6))))
    rd3 = max(1, min(5, round(rd_base + 0.1 + random.gauss(0, 0.5))))
    rd4 = max(1, min(5, round(rd_base - 0.1 + random.gauss(0, 0.6))))
    rd5 = max(0, min(10, round(rd_base * 2.0 + random.gauss(0, 1.2))))
    
    # Attitude items (SK1-SK6, FR1-FR4, SD1-SD4)
    sk_scores = []
    for _ in range(6):
        score = max(1, min(5, round(3.0 + 0.7 * s_star + random.gauss(0, 0.6))))
        sk_scores.append(score)
        
    fr_scores = []
    for _ in range(4):
        score = max(1, min(5, round(3.2 + 0.6 * f_star + random.gauss(0, 0.6))))
        fr_scores.append(score)
        
    # SD items: SD1, SD3 regular; SD2, SD4 reversed
    sd1 = max(1, min(5, round(3.0 + 0.5 * sd_trait + random.gauss(0, 0.6))))
    sd2 = max(1, min(5, round(3.0 - 0.5 * sd_trait + random.gauss(0, 0.6)))) # reversed
    sd3 = max(1, min(5, round(3.0 + 0.5 * sd_trait + random.gauss(0, 0.6))))
    sd4 = max(1, min(5, round(3.0 - 0.5 * sd_trait + random.gauss(0, 0.6)))) # reversed
    
    # Attention check: Always "Màu xanh lá" for 98% of respondents
    attn_passed = True if (i % 45 != 0) else False # small flag rate ~ 2%
    attn_choice = "Màu xanh lá" if attn_passed else random.choice(["Màu đỏ", "Màu vàng", "Màu trắng"])
    
    # Flags
    flag_attention = 0 if attn_passed else 1
    flag_dominant = 0
    flag_speeder = 1 if (i % 60 == 0) else 0 # 1.6% speeders
    flag_straightline = 1 if (len(set(sk_scores + fr_scores)) == 1) else 0
    flag_duplicate = 1 if (i in [42, 188, 305]) else 0
    
    # Duration (median around 19.5 minutes = 1170 seconds)
    duration_seconds = random.randint(300, 500) if flag_speeder else random.randint(950, 1500)
    
    # 4. Simulate BWS choices (13 sets)
    bws_chosen_pairs = []
    for set_idx in range(1, 14):
        set_id = f"C{set_idx}"
        items = BWS_SETS[set_id]
        
        # Calculate utility for each item: weight + error
        item_utils = {}
        for it in items:
            base_w = BARRIER_WEIGHTS[it]
            # individual variation
            indiv_w = base_w + (0.4 * s_star if it in ["R10", "R11", "R12", "R13"] else 0) + (0.3 * f_star if it in ["R1", "R2", "R3", "R4"] else 0)
            u = indiv_w - math.log(-math.log(max(1e-7, min(1-1e-7, random.random()))))
            item_utils[it] = u
            
        # Best is max utility
        best_item = max(item_utils, key=item_utils.get)
        # Worst is min utility
        worst_item = min(item_utils, key=item_utils.get)
        if best_item == worst_item:
            # Fallback
            sorted_items = sorted(item_utils, key=item_utils.get)
            worst_item = sorted_items[0]
            best_item = sorted_items[-1]
            
        bws_chosen_pairs.append((set_id, best_item, worst_item))
        
        bws_long_rows.append({
            "respondent_id": resp_id,
            "set_id": set_id,
            "display_order": set_idx,
            "item_1": items[0], "item_2": items[1], "item_3": items[2], "item_4": items[3],
            "best_item": best_item,
            "worst_item": worst_item
        })

    # 5. Simulate DCE choices (8 cards in block)
    block_cards = DCE_BY_BLOCK[dce_block]
    card_positions = list(range(1, 9))
    random.shuffle(card_positions)
    
    chose_optout_ever = False
    
    for pos, card_num in enumerate(card_positions, start=1):
        card_data = block_cards[card_num]
        is_dom = int(card_data["A"]["is_dominance_check"])
        
        # Attributes
        p_A = float(card_data["A"]["price"])
        sol_A = 1.0 if card_data["A"]["energy"] == "solar" else 0.0
        rec_A = 1.0 if card_data["A"]["recycle"] == "100audit" else (0.5 if card_data["A"]["recycle"] == "cert50" else 0.0)
        dist_A = 1.0 if card_data["A"]["flex1"] == "home" else (0.5 if card_data["A"]["flex1"] == "1km" else 0.0)
        
        p_B = float(card_data["B"]["price"])
        sol_B = 1.0 if card_data["B"]["energy"] == "solar" else 0.0
        rec_B = 1.0 if card_data["B"]["recycle"] == "100audit" else (0.5 if card_data["B"]["recycle"] == "cert50" else 0.0)
        dist_B = 1.0 if card_data["B"]["flex1"] == "home" else (0.5 if card_data["B"]["flex1"] == "1km" else 0.0)
        
        fee_opt = float(card_data["OPT"]["lez_fee"])
        
        # Utilities
        v_A = -0.12 * p_A + 0.25 * sol_A + 0.30 * rec_A + 0.22 * dist_A
        v_B = -0.12 * p_B + 0.25 * sol_B + 0.30 * rec_B + 0.22 * dist_B
        
        # Opt-out utility:
        # fee effect: -0.003 * fee_opt * (1 + 0.5 * lez_workplace)
        # S* and F* increase utility of keeping petrol
        v_OPT = -0.45 - 0.0028 * fee_opt * (1.0 + 0.6 * lez_workplace) + 0.35 * s_star + 0.45 * f_star
        
        def gumbel():
            u = max(1e-7, min(1 - 1e-7, random.random()))
            return -math.log(-math.log(u))
            
        u_A = v_A + gumbel()
        u_B = v_B + gumbel()
        u_OPT = v_OPT + gumbel()
        
        if is_dom == 1:
            # In dominance check card, normal respondents never pick dominated alternative
            # K1 & K3: A dominates B; K2: B dominates A
            if dce_block in ["K1", "K3"]:
                choice = 1 # A
            else:
                choice = 2 # B
            # 1% error rate on dominance check for testing flag_dominant
            if i % 80 == 0:
                choice = 2 if choice == 1 else 1
                flag_dominant = 1
        else:
            if u_A >= u_B and u_A >= u_OPT:
                choice = 1
            elif u_B >= u_A and u_B >= u_OPT:
                choice = 2
            else:
                choice = 3
                chose_optout_ever = True
                
        certainty = random.randint(6, 10) if choice in [1, 2] else random.randint(4, 8)
        
        # Peer question at position 3 and 6
        peer_choice = random.choice([1, 2, 3]) if pos in [3, 6] else None
        
        apollo_long_rows.append({
            "respondent_id": resp_id,
            "block": dce_block,
            "order_version": order_version,
            "card_num": card_num,
            "display_pos": pos,
            "is_dominance_check": is_dom,
            "choice": choice,
            "price_A": p_A, "battery_A": card_data["A"]["battery"], "energy_A": card_data["A"]["energy"], "recycle_A": card_data["A"]["recycle"], "flex1_A": card_data["A"]["flex1"], "flex2_A": card_data["A"]["flex2"],
            "price_B": p_B, "battery_B": card_data["B"]["battery"], "energy_B": card_data["B"]["energy"], "recycle_B": card_data["B"]["recycle"], "flex1_B": card_data["B"]["flex1"], "flex2_B": card_data["B"]["flex2"],
            "fuel_cost_OPT": monthly_fuel_cost, "lez_fee_OPT": fee_opt,
            "certainty": certainty,
            "peer_choice": peer_choice if peer_choice else "",
            "LEZ_Residence": lez_residence,
            "LEZ_Workplace": lez_workplace,
            "SK_mean": round(sum(sk_scores) / 6.0, 2),
            "FR_mean": round(sum(fr_scores) / 4.0, 2),
            "SD_mean": round((sd1 + (6 - sd2) + sd3 + (6 - sd4)) / 4.0, 2),
            "channel": channel
        })

    # D9, D10, D11 follow-up questions
    d9_ana = "Không bỏ qua đặc điểm nào" if random.random() > 0.3 else "Phụ phí LEZ"
    d10_realism = random.choice([3, 4, 4, 5, 5])
    d11_reason = "Xe xăng hiện tại vẫn còn tốt" if chose_optout_ever else ""
    
    # F1 Support policies
    f1_policies = ["Trợ giá của thành phố", "Miễn lệ phí trước bạ", "Trạm sạc tại chung cư/văn phòng"]

    wide_rows.append({
        "respondent_id": resp_id,
        "order_version": order_version,
        "dce_block": dce_block,
        "channel": channel,
        "duration_seconds": duration_seconds,
        "flag_attention": flag_attention,
        "flag_dominant": flag_dominant,
        "flag_speeder": flag_speeder,
        "flag_straightline": flag_straightline,
        "flag_duplicate": flag_duplicate,
        "is_valid": 1 if (flag_attention == 0 and flag_dominant == 0 and flag_speeder == 0) else 0,
        "age_group": age_group,
        "age": age_val,
        "gender": gender,
        "education": education,
        "occupation": occupation,
        "income": income,
        "residual_income": residual_income,
        "daily_km": daily_km,
        "monthly_fuel_cost": monthly_fuel_cost,
        "home_charging": home_charging,
        "residence_ward": res_ward["full_name"],
        "workplace_ward": work_ward["full_name"],
        "LEZ_Residence": lez_residence,
        "LEZ_Workplace": lez_workplace,
        "A6_news": a6_news,
        "A7_lez_knowledge": a7_lez_know,
        "A8_lez_response": a8_lez_response,
        "RD1": rd1, "RD2": rd2, "RD3": rd3, "RD4": rd4, "RD5": rd5,
        "SK1": sk_scores[0], "SK2": sk_scores[1], "SK3": sk_scores[2], "SK4": sk_scores[3], "SK5": sk_scores[4], "SK6": sk_scores[5],
        "FR1": fr_scores[0], "FR2": fr_scores[1], "FR3": fr_scores[2], "FR4": fr_scores[3],
        "SD1": sd1, "SD2": sd2, "SD3": sd3, "SD4": sd4,
        "attention_check_passed": 1 if attn_passed else 0,
        "D9_attribute_non_attendance": d9_ana,
        "D10_realism": d10_realism,
        "D11_optout_reason": d11_reason,
        "F1_support_policies": "; ".join(f1_policies),
        "F7_max_ev_budget": max_ev_budget
    })

# Write CSV Wide
with open("d:/ảnh/ev_survey_system/data/survey_responses_wide.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(wide_rows[0].keys()))
    writer.writeheader()
    writer.writerows(wide_rows)

print(f"Generated data/survey_responses_wide.csv with {len(wide_rows)} rows.")

# Write CSV Apollo Long
with open("d:/ảnh/ev_survey_system/data/survey_data_apollo_long.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(apollo_long_rows[0].keys()))
    writer.writeheader()
    writer.writerows(apollo_long_rows)

print(f"Generated data/survey_data_apollo_long.csv with {len(apollo_long_rows)} rows (8 per respondent).")

# Write CSV BWS Long
with open("d:/ảnh/ev_survey_system/data/survey_data_bws_long.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=list(bws_long_rows[0].keys()))
    writer.writeheader()
    writer.writerows(bws_long_rows)

print(f"Generated data/survey_data_bws_long.csv with {len(bws_long_rows)} rows (13 per respondent).")
