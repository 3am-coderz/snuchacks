def get_reason(ob):
    reasons = {
        "pay": f"Critical path or high penalty risk. Score {ob['priority_score']} — paying immediately protects operations.",
        "partial_pay": f"Full payment breaches cash floor. Paying {ob.get('percent_paid', 0)}% now pauses collections.",
        "delay": f"Negotiation probability is {ob['negotiation_probability']*100:.0f}%. Safe to request 3-day delay.",
        "negotiate": f"Insufficient cash. Low negotiation probability — communicate early and offer restructured plan."
    }
    return reasons.get(ob.get("action", "negotiate"), "Manual review required.")

def build_chain_of_thought(results, state):
    lines = []
    lines.append("STEP 1: HARD CONSTRAINT FILTER")
    lines.append(f"  Cash Floor: Retain ₹{state['dynamic_buffer']:,.0f} | Allocatable: ₹{state['allocatable_cash']:,.0f}")
    for ob in results:
        if ob.get("is_critical_path"):
            lines.append(f"  Critical Path: {ob['name']} → Priority +1000")
        if ob["category"] == "payroll":
            lines.append(f"  Retention Risk: {ob['name']} → Priority +900")
        if ob.get("is_radioactive"):
            lines.append(f"  Radioactive Debt: {ob['name']} → Penalty compounding")
    lines.append("")
    lines.append("STEP 2: SOFT CONSTRAINT SCORING")
    for ob in results:
        lines.append(f"  {ob['name']}: Score={ob['priority_score']} | Trust={ob['vendor_trust_score']} | NegProb={ob['negotiation_probability']}")
    lines.append("")
    lines.append("STEP 3: KNAPSACK OPTIMIZATION")
    lines.append(f"  Capacity: ₹{state['allocatable_cash']:,.0f} | Goal: Maximize survival probability")
    lines.append("")
    lines.append("FINAL ALLOCATION")
    for ob in results:
        action_map = {
            "pay": f"PAY ₹{ob['allocated']:,} (100%)",
            "partial_pay": f"PARTIAL PAY ₹{ob['allocated']:,} ({ob.get('percent_paid',0)}%)",
            "delay": "DELAY — Request 3-day extension",
            "negotiate": "NEGOTIATE — Offer partial or restructure"
        }
        lines.append(f"  {ob['name']}: {action_map.get(ob['action'], 'REVIEW')}")
    return "\n".join(lines)
