"""
Kiểm thử thuật toán phân nhóm ngẫu nhiên cân bằng:
- Phiên bản thứ tự (A/B): tỷ lệ 50/50, cân bằng động (gán vào nhóm ít hơn, hòa thì ngẫu nhiên)
- Khối DCE (K1, K2, K3): tỷ lệ 1/3 mỗi khối, cân bằng động độc lập
- Mô phỏng 1.000 người trả lời ảo
- Kiểm tra độ lệch không vượt quá +-2% so với tỷ lệ lý thuyết
"""

import random
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def allocate_order(count_a, count_b):
    if count_a < count_b:
        return "A"
    elif count_b < count_a:
        return "B"
    else:
        return random.choice(["A", "B"])

def allocate_block(counts):
    # counts is dict {"K1": int, "K2": int, "K3": int}
    min_count = min(counts.values())
    candidates = [b for b, c in counts.items() if c == min_count]
    return random.choice(candidates)

def test_simulation(n_respondents=1000):
    print(f"=== MÔ PHỎNG PHÂN BỔ {n_respondents} NGƯỜI TRẢ LỜI ẢO ===")
    
    order_counts = {"A": 0, "B": 0}
    block_counts = {"K1": 0, "K2": 0, "K3": 0}

    for _ in range(n_respondents):
        # 1. Phân bổ phiên bản thứ tự
        chosen_order = allocate_order(order_counts["A"], order_counts["B"])
        order_counts[chosen_order] += 1

        # 2. Phân bổ khối DCE độc lập
        chosen_block = allocate_block(block_counts)
        block_counts[chosen_block] += 1

    pct_a = order_counts["A"] / n_respondents * 100
    pct_b = order_counts["B"] / n_respondents * 100

    print(f"Thứ tự A: {order_counts['A']} ({pct_a:.1f}%), Thứ tự B: {order_counts['B']} ({pct_b:.1f}%)")
    assert abs(pct_a - 50.0) <= 2.0, f"Độ lệch thứ tự A vượt quá +-2%: {pct_a}%"
    assert abs(pct_b - 50.0) <= 2.0, f"Độ lệch thứ tự B vượt quá +-2%: {pct_b}%"
    print("[PASS] Phiên bản thứ tự A/B cân bằng xuất sắc trong phạm vi +-2% (thực tế lệch <= 1%).")

    for b in ["K1", "K2", "K3"]:
        pct = block_counts[b] / n_respondents * 100
        print(f"Khối {b}: {block_counts[b]} ({pct:.1f}%)")
        assert abs(pct - 33.33) <= 2.0, f"Độ lệch khối {b} vượt quá +-2%: {pct}%"
    print("[PASS] Phân bổ khối DCE K1/K2/K3 cân bằng chuẩn xác trong phạm vi +-2%.")
    print(">>> KẾT LUẬN: Thuật toán phân nhóm ngẫu nhiên cân bằng động đạt chuẩn hoàn toàn!")

if __name__ == "__main__":
    test_simulation(1000)
