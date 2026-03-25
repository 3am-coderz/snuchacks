def build_financial_state(data):
    cash = data["cash_available"]
    burn = data["daily_burn"]
    op_min = data["operational_minimum"]
    obligations = data["obligations"]
    variance = data.get("revenue_variance", 0)

    total_obligations = sum(o["amount"] for o in obligations)
    shortfall = max(0, total_obligations - cash)
    dynamic_buffer = op_min * (1 + variance)
    allocatable_cash = max(0, cash - dynamic_buffer)
    current_runway = int(cash / burn)
    alert_level = "critical" if current_runway < 7 else \
                  "warning" if current_runway < 14 else "safe"

    return {
        "cash": cash,
        "total_obligations": total_obligations,
        "shortfall": shortfall,
        "allocatable_cash": allocatable_cash,
        "dynamic_buffer": dynamic_buffer,
        "current_runway": current_runway,
        "alert_level": alert_level,
        "daily_burn": burn
    }
