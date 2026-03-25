def apply_hard_constraints(obligations, cash, op_min):
    flagged = []
    for ob in obligations:
        flags = {
            "blocked": False,
            "block_reason": None,
            "hard_score_bonus": 0,
            "is_radioactive": False
        }
        if (cash - ob["amount"]) < op_min:
            flags["blocked"] = True
            flags["block_reason"] = "liquidity_floor"
        if ob.get("is_critical_path"):
            flags["hard_score_bonus"] += 1000
        if ob["category"] == "payroll":
            flags["hard_score_bonus"] += 900
        penalty_in_7_days = ob["daily_penalty"] * 7
        if penalty_in_7_days > (cash * 0.3):
            flags["is_radioactive"] = True
            flags["hard_score_bonus"] += 500
        flagged.append({**ob, **flags})
    return flagged
