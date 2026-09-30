"""
Kiểm tra tính đúng đắn của thiết kế BIBD cho BWS 13 tập:
- v = 13 (số lượng rào cản)
- k = 4 (số rào cản trong mỗi tập)
- r = 4 (mỗi rào cản xuất hiện đúng 4 lần trên toàn bộ 13 tập)
- lambda = 1 (mỗi cặp rào cản xuất hiện cùng nhau đúng 1 lần)
Sinh từ tập sai phân {0, 1, 3, 9} mod 13
"""

import sys
from itertools import combinations
from collections import Counter

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ITEMS = [f"R{i}" for i in range(1, 14)]

BASE_DIFF_SET = [0, 1, 3, 9]

BWS_SETS = {
    f"C{i+1}": [f"R{((val + i) % 13) + 1}" for val in BASE_DIFF_SET]
    for i in range(13)
}

EXPECTED_SETS_FROM_PROMPT = {
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
    "C13": ["R13", "R1", "R3", "R9"],
}

def verify_bibd():
    print("=== KIỂM THỬ THIẾT KẾ BIBD (v=13, k=4, r=4, lambda=1) ===")
    
    # 1. Khớp hoàn toàn với bảng mô tả trong mục 5.5
    for c_id, expected_items in EXPECTED_SETS_FROM_PROMPT.items():
        generated = BWS_SETS[c_id]
        assert set(generated) == set(expected_items), f"Sai lệch tại {c_id}: {generated} vs {expected_items}"
    print("[PASS] Khớp 100% với đặc tả 13 tập C1-C13 trong tài liệu.")

    # 2. Kiểm tra số tập
    assert len(BWS_SETS) == 13, f"Số tập không phải 13: {len(BWS_SETS)}"
    print(f"[PASS] Tổng số tập BWS = {len(BWS_SETS)}")

    # 3. Kiểm tra k = 4 (mỗi tập có 4 phần tử không trùng lặp)
    for c_id, items in BWS_SETS.items():
        assert len(items) == 4, f"Tập {c_id} không có 4 phần tử"
        assert len(set(items)) == 4, f"Tập {c_id} có phần tử trùng lặp"
    print("[PASS] Tất cả các tập đều có đúng k=4 phần tử phân biệt.")

    # 4. Kiểm tra r = 4 (mỗi rào cản xuất hiện đúng 4 lần)
    item_counts = Counter()
    for items in BWS_SETS.values():
        item_counts.update(items)
    
    for item in ITEMS:
        count = item_counts[item]
        assert count == 4, f"Rào cản {item} xuất hiện {count} lần thay vì 4 lần"
    print("[PASS] Mỗi rào cản trong số 13 rào cản (R1..R13) xuất hiện đúng r=4 lần.")

    # 5. Kiểm tra lambda = 1 (mỗi cặp xuất hiện cùng nhau đúng 1 lần)
    pair_counts = Counter()
    for items in BWS_SETS.values():
        for pair in combinations(sorted(items, key=lambda x: int(x[1:])), 2):
            pair_counts[pair] += 1

    all_possible_pairs = list(combinations(ITEMS, 2))
    assert len(all_possible_pairs) == 13 * 12 // 2 == 78, "Tổng số cặp rào cản phải là 78"

    for pair in all_possible_pairs:
        p_count = pair_counts[pair]
        assert p_count == 1, f"Cặp {pair} xuất hiện {p_count} lần (yêu cầu lambda=1)"
    print(f"[PASS] Tất cả 78 cặp rào cản đều xuất hiện cùng nhau đúng lambda=1 lần.")
    print(">>> KẾT LUẬN: Thiết kế BIBD hoàn toàn cân bằng và đạt chuẩn toán học!")

if __name__ == "__main__":
    verify_bibd()
