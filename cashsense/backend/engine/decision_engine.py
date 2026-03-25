from engine.constraint_engine import apply_hard_constraints

PARTIAL_PAY_THRESHOLD = 0.20

def score_obligation(ob):
    score = ob.get("hard_score_bonus", 0)
    true_cost_of_delay = ob["daily_penalty"] * ob["due_days"]
    score += min(true_cost_of_delay / 100, 300)
    score += ob["vendor_trust_score"] * 0.5
    if ob.get("reports_to_bureau"):
        score += 400
    score -= ob["negotiation_probability"] * 200
    return round(score, 2)

def run_knapsack(obligations, cash_available, op_min):
    flagged = apply_hard_constraints(obligations, cash_available, op_min)
    for ob in flagged:
        ob["priority_score"] = score_obligation(ob)
    sorted_obs = sorted(flagged, key=lambda x: x["priority_score"], reverse=True)

    remaining_cash = cash_available
    results = []

    for ob in sorted_obs:
        if ob.get("blocked") and ob.get("block_reason") == "liquidity_floor":
            partial_amount = remaining_cash - op_min
            min_acceptable = ob["amount"] * PARTIAL_PAY_THRESHOLD
            if partial_amount >= min_acceptable:
                results.append({**ob, "action": "partial_pay",
                                "allocated": round(partial_amount),
                                "percent_paid": round((partial_amount / ob["amount"]) * 100)})
                remaining_cash -= partial_amount
            else:
                results.append({**ob, "action": "negotiate",
                                "allocated": 0, "percent_paid": 0})
            continue

        if remaining_cash - ob["amount"] >= op_min:
            results.append({**ob, "action": "pay",
                           "allocated": ob["amount"], "percent_paid": 100})
            remaining_cash -= ob["amount"]
        elif ob["negotiation_probability"] > 0.6:
            results.append({**ob, "action": "delay",
                           "allocated": 0, "percent_paid": 0})
        else:
            partial = max(0, remaining_cash - op_min)
            results.append({**ob, "action": "negotiate",
                           "allocated": round(partial),
                           "percent_paid": round((partial / ob["amount"]) * 100) if partial > 0 else 0})
            remaining_cash -= partial

    return results, round(remaining_cash)
