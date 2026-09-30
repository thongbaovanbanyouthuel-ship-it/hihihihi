import json
import csv
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# 1. HCMC Wards with LEZ indicators
wards_data = [
    # Quận 1 (Core LEZ)
    {"id": "Q1_BN", "name": "Phường Bến Nghé", "district": "Quận 1", "full_name": "Phường Bến Nghé, Quận 1", "in_lez": True},
    {"id": "Q1_BT", "name": "Phường Bến Thành", "district": "Quận 1", "full_name": "Phường Bến Thành, Quận 1", "in_lez": True},
    {"id": "Q1_CK", "name": "Phường Cầu Kho", "district": "Quận 1", "full_name": "Phường Cầu Kho, Quận 1", "in_lez": True},
    {"id": "Q1_COL", "name": "Phường Cầu Ông Lãnh", "district": "Quận 1", "full_name": "Phường Cầu Ông Lãnh, Quận 1", "in_lez": True},
    {"id": "Q1_CG", "name": "Phường Cô Giang", "district": "Quận 1", "full_name": "Phường Cô Giang, Quận 1", "in_lez": True},
    {"id": "Q1_DK", "name": "Phường Đa Kao", "district": "Quận 1", "full_name": "Phường Đa Kao, Quận 1", "in_lez": True},
    {"id": "Q1_NCT", "name": "Phường Nguyễn Cư Trinh", "district": "Quận 1", "full_name": "Phường Nguyễn Cư Trinh, Quận 1", "in_lez": True},
    {"id": "Q1_NTB", "name": "Phường Nguyễn Thái Bình", "district": "Quận 1", "full_name": "Phường Nguyễn Thái Bình, Quận 1", "in_lez": True},
    {"id": "Q1_PNL", "name": "Phường Phạm Ngũ Lão", "district": "Quận 1", "full_name": "Phường Phạm Ngũ Lão, Quận 1", "in_lez": True},
    {"id": "Q1_TD", "name": "Phường Tân Định", "district": "Quận 1", "full_name": "Phường Tân Định, Quận 1", "in_lez": True},

    # Quận 3 (Core LEZ)
    {"id": "Q3_P1", "name": "Phường 1", "district": "Quận 3", "full_name": "Phường 1, Quận 3", "in_lez": True},
    {"id": "Q3_P2", "name": "Phường 2", "district": "Quận 3", "full_name": "Phường 2, Quận 3", "in_lez": True},
    {"id": "Q3_P3", "name": "Phường 3", "district": "Quận 3", "full_name": "Phường 3, Quận 3", "in_lez": True},
    {"id": "Q3_P4", "name": "Phường 4", "district": "Quận 3", "full_name": "Phường 4, Quận 3", "in_lez": True},
    {"id": "Q3_P5", "name": "Phường 5", "district": "Quận 3", "full_name": "Phường 5, Quận 3", "in_lez": True},
    {"id": "Q3_P9", "name": "Phường 9", "district": "Quận 3", "full_name": "Phường 9, Quận 3", "in_lez": True},
    {"id": "Q3_P11", "name": "Phường 11", "district": "Quận 3", "full_name": "Phường 11, Quận 3", "in_lez": True},
    {"id": "Q3_P12", "name": "Phường 12", "district": "Quận 3", "full_name": "Phường 12, Quận 3", "in_lez": True},
    {"id": "Q3_P14", "name": "Phường 14", "district": "Quận 3", "full_name": "Phường 14, Quận 3", "in_lez": True},
    {"id": "Q3_VTS", "name": "Phường Võ Thị Sáu", "district": "Quận 3", "full_name": "Phường Võ Thị Sáu, Quận 3", "in_lez": True},

    # TP Thủ Đức (Thủ Thiêm / An Khánh in LEZ, others outside)
    {"id": "TD_TT", "name": "Phường Thủ Thiêm", "district": "TP Thủ Đức", "full_name": "Phường Thủ Thiêm, TP Thủ Đức", "in_lez": True},
    {"id": "TD_AK", "name": "Phường An Khánh", "district": "TP Thủ Đức", "full_name": "Phường An Khánh, TP Thủ Đức", "in_lez": True},
    {"id": "TD_AL", "name": "Phường An Lợi Đông", "district": "TP Thủ Đức", "full_name": "Phường An Lợi Đông, TP Thủ Đức", "in_lez": True},
    {"id": "TD_TD", "name": "Phường Thảo Điền", "district": "TP Thủ Đức", "full_name": "Phường Thảo Điền, TP Thủ Đức", "in_lez": False},
    {"id": "TD_AP", "name": "Phường An Phú", "district": "TP Thủ Đức", "full_name": "Phường An Phú, TP Thủ Đức", "in_lez": False},
    {"id": "TD_HP", "name": "Phường Hiệp Phú", "district": "TP Thủ Đức", "full_name": "Phường Hiệp Phú, TP Thủ Đức", "in_lez": False},
    {"id": "TD_LT", "name": "Phường Linh Trung", "district": "TP Thủ Đức", "full_name": "Phường Linh Trung, TP Thủ Đức", "in_lez": False},
    {"id": "TD_TC", "name": "Phường Linh Chiểu", "district": "TP Thủ Đức", "full_name": "Phường Linh Chiểu, TP Thủ Đức", "in_lez": False},
    {"id": "TD_TP", "name": "Phường Tăng Nhơn Phú A", "district": "TP Thủ Đức", "full_name": "Phường Tăng Nhơn Phú A, TP Thủ Đức", "in_lez": False},
    {"id": "TD_BTD", "name": "Phường Bình Trưng Đông", "district": "TP Thủ Đức", "full_name": "Phường Bình Trưng Đông, TP Thủ Đức", "in_lez": False},

    # Bình Thạnh (Buffer zone)
    {"id": "BT_P1", "name": "Phường 1", "district": "Quận Bình Thạnh", "full_name": "Phường 1, Quận Bình Thạnh", "in_lez": False},
    {"id": "BT_P2", "name": "Phường 2", "district": "Quận Bình Thạnh", "full_name": "Phường 2, Quận Bình Thạnh", "in_lez": False},
    {"id": "BT_P15", "name": "Phường 15", "district": "Quận Bình Thạnh", "full_name": "Phường 15, Quận Bình Thạnh", "in_lez": False},
    {"id": "BT_P19", "name": "Phường 19", "district": "Quận Bình Thạnh", "full_name": "Phường 19, Quận Bình Thạnh", "in_lez": False},
    {"id": "BT_P22", "name": "Phường 22", "district": "Quận Bình Thạnh", "full_name": "Phường 22, Quận Bình Thạnh", "in_lez": False},
    {"id": "BT_P25", "name": "Phường 25", "district": "Quận Bình Thạnh", "full_name": "Phường 25, Quận Bình Thạnh", "in_lez": False},

    # Phú Nhuận
    {"id": "PN_P1", "name": "Phường 1", "district": "Quận Phú Nhuận", "full_name": "Phường 1, Quận Phú Nhuận", "in_lez": False},
    {"id": "PN_P2", "name": "Phường 2", "district": "Quận Phú Nhuận", "full_name": "Phường 2, Quận Phú Nhuận", "in_lez": False},
    {"id": "PN_P9", "name": "Phường 9", "district": "Quận Phú Nhuận", "full_name": "Phường 9, Quận Phú Nhuận", "in_lez": False},

    # Quận 4
    {"id": "Q4_P1", "name": "Phường 1", "district": "Quận 4", "full_name": "Phường 1, Quận 4", "in_lez": False},
    {"id": "Q4_P6", "name": "Phường 6", "district": "Quận 4", "full_name": "Phường 6, Quận 4", "in_lez": False},
    {"id": "Q4_P13", "name": "Phường 13", "district": "Quận 4", "full_name": "Phường 13, Quận 4", "in_lez": False},

    # Quận 5
    {"id": "Q5_P1", "name": "Phường 1", "district": "Quận 5", "full_name": "Phường 1, Quận 5", "in_lez": False},
    {"id": "Q5_P5", "name": "Phường 5", "district": "Quận 5", "full_name": "Phường 5, Quận 5", "in_lez": False},
    {"id": "Q5_P11", "name": "Phường 11", "district": "Quận 5", "full_name": "Phường 11, Quận 5", "in_lez": False},

    # Quận 7
    {"id": "Q7_TM", "name": "Phường Tân Mỹ", "district": "Quận 7", "full_name": "Phường Tân Mỹ, Quận 7", "in_lez": False},
    {"id": "Q7_TP", "name": "Phường Tân Phú", "district": "Quận 7", "full_name": "Phường Tân Phú, Quận 7", "in_lez": False},
    {"id": "Q7_TT", "name": "Phường Tân Thuận Đông", "district": "Quận 7", "full_name": "Phường Tân Thuận Đông, Quận 7", "in_lez": False},

    # Quận 10
    {"id": "Q10_P1", "name": "Phường 1", "district": "Quận 10", "full_name": "Phường 1, Quận 10", "in_lez": False},
    {"id": "Q10_P12", "name": "Phường 12", "district": "Quận 10", "full_name": "Phường 12, Quận 10", "in_lez": False},

    # Tân Bình, Gò Vấp, Tân Phú, Bình Tân, Q12
    {"id": "TB_P2", "name": "Phường 2", "district": "Quận Tân Bình", "full_name": "Phường 2, Quận Tân Bình", "in_lez": False},
    {"id": "TB_P13", "name": "Phường 13", "district": "Quận Tân Bình", "full_name": "Phường 13, Quận Tân Bình", "in_lez": False},
    {"id": "GV_P1", "name": "Phường 1", "district": "Quận Gò Vấp", "full_name": "Phường 1, Quận Gò Vấp", "in_lez": False},
    {"id": "GV_P5", "name": "Phường 5", "district": "Quận Gò Vấp", "full_name": "Phường 5, Quận Gò Vấp", "in_lez": False},
    {"id": "TP_TS", "name": "Phường Tây Thạnh", "district": "Quận Tân Phú", "full_name": "Phường Tây Thạnh, Quận Tân Phú", "in_lez": False},
    {"id": "BT_BHH", "name": "Phường Bình Hưng Hòa", "district": "Quận Bình Tân", "full_name": "Phường Bình Hưng Hòa, Quận Bình Tân", "in_lez": False},
    {"id": "Q12_TH", "name": "Phường Tân Hưng Thuận", "district": "Quận 12", "full_name": "Phường Tân Hưng Thuận, Quận 12", "in_lez": False},

    # Ngoại thành: Bình Chánh, Hóc Môn, Nhà Bè, Củ Chi, Cần Giờ
    {"id": "BC_TT", "name": "Thị trấn Tân Túc", "district": "Huyện Bình Chánh", "full_name": "Thị trấn Tân Túc, Huyện Bình Chánh", "in_lez": False},
    {"id": "HM_TT", "name": "Thị trấn Hóc Môn", "district": "Huyện Hóc Môn", "full_name": "Thị trấn Hóc Môn, Huyện Hóc Môn", "in_lez": False},
    {"id": "NB_PK", "name": "Xã Phước Kiển", "district": "Huyện Nhà Bè", "full_name": "Xã Phước Kiển, Huyện Nhà Bè", "in_lez": False}
]

with open("d:/ảnh/ev_survey_system/data/hcmc_wards.json", "w", encoding="utf-8") as f:
    json.dump(wards_data, f, ensure_ascii=False, indent=2)

print(f"Generated {len(wards_data)} wards in data/hcmc_wards.json")

# 2. Flexible attributes bank
flex_bank = [
    {
        "barrier_code": "R3",
        "attr_code": "warranty",
        "name": "Bảo hành pin",
        "category": "Tài chính",
        "levels": [
            {"code": "3yr", "label": "3 năm", "description": "Bảo hành tiêu chuẩn"},
            {"code": "5yr", "label": "5 năm", "description": "Bảo hành mở rộng 5 năm"},
            {"code": "8yr", "label": "8 năm", "description": "Bảo hành cao cấp 8 năm"}
        ]
    },
    {
        "barrier_code": "R4",
        "attr_code": "buyback",
        "name": "Cam kết mua lại xe của hãng sau 3 năm",
        "category": "Tài chính",
        "levels": [
            {"code": "none", "label": "Không có", "description": "Tự bán lại trên thị trường"},
            {"code": "40pct", "label": "40% giá gốc", "description": "Hãng cam kết mua lại tối thiểu 40% giá mua ban đầu"},
            {"code": "60pct", "label": "60% giá gốc", "description": "Hãng cam kết mua lại tối thiểu 60% giá mua ban đầu"}
        ]
    },
    {
        "barrier_code": "R5_R6",
        "attr_code": "station_dist",
        "name": "Trạm sạc/đổi pin gần nhất",
        "category": "Hạ tầng",
        "levels": [
            {"code": "3km", "label": "Cách 3 km", "description": "Khoảng cách đến trạm sạc gần nhất 3 km"},
            {"code": "1km", "label": "Cách 1 km", "description": "Khoảng cách đến trạm sạc gần nhất 1 km"},
            {"code": "home", "label": "Ngay tại nơi ở hoặc nơi làm việc", "description": "Có điểm sạc/đổi pin trực tiếp tại chung cư/văn phòng"}
        ]
    },
    {
        "barrier_code": "R7",
        "attr_code": "range",
        "name": "Quãng đường mỗi lần sạc",
        "category": "Kỹ thuật – an toàn",
        "levels": [
            {"code": "80km", "label": "80 km", "description": "Phù hợp đi lại hằng ngày trong nội thành"},
            {"code": "120km", "label": "120 km", "description": "Đi lại thoải mái 2-3 ngày mới cần sạc"},
            {"code": "160km", "label": "160 km", "description": "Đáp ứng di chuyển xa và liên tục"}
        ]
    },
    {
        "barrier_code": "R8",
        "attr_code": "safety_ins",
        "name": "Tiêu chuẩn chống nước và bảo hiểm cháy nổ pin",
        "category": "Kỹ thuật – an toàn",
        "levels": [
            {"code": "none", "label": "Không có", "description": "Tiêu chuẩn thông thường, không kèm bảo hiểm"},
            {"code": "ip67", "label": "Chống nước IP67", "description": "Chống ngập nước ở độ sâu 0.5m trong 30 phút"},
            {"code": "ip67_ins", "label": "IP67 kèm bảo hiểm cháy nổ do hãng chi trả", "description": "Bảo hiểm toàn diện chi trả đền bù sự cố cháy nổ pin"}
        ]
    },
    {
        "barrier_code": "R1",
        "attr_code": "finance_support",
        "name": "Hỗ trợ tài chính",
        "category": "Tài chính",
        "levels": [
            {"code": "none", "label": "Không có", "description": "Thanh toán 100% tiền mặt/chuyển khoản"},
            {"code": "inst0", "label": "Trả góp 0% trong 12 tháng", "description": "Hỗ trợ lãi suất 0% liên kết ngân hàng"},
            {"code": "tradein", "label": "Thu cũ đổi mới, trợ giá 3 triệu đồng", "description": "Hãng thu mua xe máy xăng cũ và trừ thẳng 3 triệu"}
        ]
    }
]

with open("d:/ảnh/ev_survey_system/data/flexible_attributes_bank.json", "w", encoding="utf-8") as f:
    json.dump(flex_bank, f, ensure_ascii=False, indent=2)

print("Generated data/flexible_attributes_bank.json")

# 3. Generate DCE Design CSV (24 choice cards: 3 blocks x 8 cards)
# Format required:
# block, card, is_dominance_check, alt, price, battery, energy, recycle, flex1, flex2, lez_fee
# Default flex1 is station_dist, flex2 is warranty or buyback
# Exactly 1 dominance check card per block:
# K1: card 4 is dominance check (A is strictly superior: price=18 vs 36, battery=buy vs rent350, energy=solar vs grid, recycle=100audit vs none, flex1=home vs 3km, flex2=60pct vs none)
# K2: card 5 is dominance check
# K3: card 3 is dominance check

dce_rows = []

# Base designs for 8 cards per block
# Attributes:
# price: 18, 24, 30, 36
# battery: buy, rent150, rent250, rent350
# energy: grid, solar
# recycle: none, cert50, 100audit
# flex1 (station_dist): 3km, 1km, home
# flex2 (buyback): none, 40pct, 60pct
# lez_fee (for OPT): 0, 100, 200 (thousand VND/month)

# Block K1
k1_cards = [
    # Card 1 (Normal)
    {"c": 1, "dom": 0, "A": (24, "rent250", "solar", "none", "1km", "none"), "B": (30, "buy", "grid", "100audit", "home", "60pct"), "fee": 100},
    # Card 2 (Normal)
    {"c": 2, "dom": 0, "A": (18, "rent350", "grid", "cert50", "3km", "40pct"), "B": (24, "rent150", "solar", "100audit", "1km", "none"), "fee": 200},
    # Card 3 (Normal)
    {"c": 3, "dom": 0, "A": (36, "buy", "solar", "cert50", "home", "60pct"), "B": (18, "rent250", "grid", "none", "3km", "none"), "fee": 0},
    # Card 4 (Dominance check: Alt A dominates Alt B in every attribute!)
    {"c": 4, "dom": 1, "A": (18, "buy", "solar", "100audit", "home", "60pct"), "B": (36, "rent350", "grid", "none", "3km", "none"), "fee": 100},
    # Card 5 (Normal)
    {"c": 5, "dom": 0, "A": (30, "rent150", "solar", "none", "1km", "40pct"), "B": (24, "buy", "solar", "cert50", "home", "none"), "fee": 200},
    # Card 6 (Normal)
    {"c": 6, "dom": 0, "A": (18, "rent150", "grid", "100audit", "3km", "none"), "B": (36, "rent250", "solar", "none", "1km", "60pct"), "fee": 100},
    # Card 7 (Normal)
    {"c": 7, "dom": 0, "A": (24, "buy", "grid", "cert50", "home", "40pct"), "B": (30, "rent350", "grid", "100audit", "3km", "none"), "fee": 0},
    # Card 8 (Normal)
    {"c": 8, "dom": 0, "A": (36, "rent250", "solar", "100audit", "1km", "60pct"), "B": (18, "buy", "grid", "none", "home", "none"), "fee": 200},
]

# Block K2
k2_cards = [
    # Card 1
    {"c": 1, "dom": 0, "A": (30, "rent350", "solar", "100audit", "home", "none"), "B": (18, "rent150", "grid", "cert50", "1km", "40pct"), "fee": 200},
    # Card 2
    {"c": 2, "dom": 0, "A": (24, "buy", "solar", "none", "3km", "60pct"), "B": (36, "buy", "solar", "100audit", "home", "none"), "fee": 0},
    # Card 3
    {"c": 3, "dom": 0, "A": (18, "rent250", "grid", "100audit", "1km", "none"), "B": (24, "rent350", "solar", "none", "3km", "40pct"), "fee": 100},
    # Card 4
    {"c": 4, "dom": 0, "A": (36, "rent150", "grid", "cert50", "home", "40pct"), "B": (30, "buy", "grid", "100audit", "1km", "60pct"), "fee": 200},
    # Card 5 (Dominance check: Alt B dominates Alt A!)
    {"c": 5, "dom": 1, "A": (36, "rent350", "grid", "none", "3km", "none"), "B": (18, "buy", "solar", "100audit", "home", "60pct"), "fee": 100},
    # Card 6
    {"c": 6, "dom": 0, "A": (24, "rent250", "solar", "cert50", "3km", "none"), "B": (18, "buy", "grid", "100audit", "home", "40pct"), "fee": 0},
    # Card 7
    {"c": 7, "dom": 0, "A": (30, "rent150", "grid", "none", "1km", "60pct"), "B": (36, "rent250", "solar", "cert50", "3km", "none"), "fee": 100},
    # Card 8
    {"c": 8, "dom": 0, "A": (18, "buy", "solar", "cert50", "home", "none"), "B": (24, "rent150", "solar", "100audit", "1km", "60pct"), "fee": 200},
]

# Block K3
k3_cards = [
    # Card 1
    {"c": 1, "dom": 0, "A": (24, "rent150", "grid", "100audit", "home", "none"), "B": (30, "buy", "solar", "none", "3km", "40pct"), "fee": 0},
    # Card 2
    {"c": 2, "dom": 0, "A": (18, "buy", "solar", "cert50", "1km", "60pct"), "B": (36, "rent350", "grid", "100audit", "home", "none"), "fee": 200},
    # Card 3 (Dominance check: Alt A dominates Alt B!)
    {"c": 3, "dom": 1, "A": (18, "buy", "solar", "100audit", "home", "60pct"), "B": (36, "rent350", "grid", "none", "3km", "none"), "fee": 100},
    # Card 4
    {"c": 4, "dom": 0, "A": (30, "rent250", "grid", "cert50", "3km", "40pct"), "B": (24, "rent350", "solar", "100audit", "1km", "none"), "fee": 100},
    # Card 5
    {"c": 5, "dom": 0, "A": (36, "buy", "solar", "none", "home", "60pct"), "B": (18, "rent150", "grid", "cert50", "3km", "none"), "fee": 0},
    # Card 6
    {"c": 6, "dom": 0, "A": (24, "rent350", "solar", "100audit", "1km", "40pct"), "B": (30, "rent150", "solar", "cert50", "home", "none"), "fee": 200},
    # Card 7
    {"c": 7, "dom": 0, "A": (18, "rent250", "solar", "none", "3km", "60pct"), "B": (36, "buy", "grid", "100audit", "1km", "none"), "fee": 100},
    # Card 8
    {"c": 8, "dom": 0, "A": (30, "buy", "grid", "100audit", "home", "40pct"), "B": (24, "rent250", "grid", "cert50", "3km", "none"), "fee": 0},
]

blocks = [("K1", k1_cards), ("K2", k2_cards), ("K3", k3_cards)]

fieldnames = ["block", "card", "is_dominance_check", "alt", "price", "battery", "energy", "recycle", "flex1", "flex2", "lez_fee"]

with open("d:/ảnh/ev_survey_system/data/dce_design_blocks.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(fieldnames)
    for b_name, cards in blocks:
        for card in cards:
            c_num = card["c"]
            dom = card["dom"]
            fee = card["fee"]
            # Alt A
            A = card["A"]
            writer.writerow([b_name, c_num, dom, "A", A[0], A[1], A[2], A[3], A[4], A[5], "NA"])
            # Alt B
            B = card["B"]
            writer.writerow([b_name, c_num, dom, "B", B[0], B[1], B[2], B[3], B[4], B[5], "NA"])
            # Alt OPT
            writer.writerow([b_name, c_num, dom, "OPT", "NA", "NA", "NA", "NA", "NA", "NA", fee])

print("Generated data/dce_design_blocks.csv with 24 cards (72 alternative rows). Label: DEMO – KHÔNG DÙNG THẬT")
