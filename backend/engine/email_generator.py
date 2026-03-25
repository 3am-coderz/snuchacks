import anthropic

client = anthropic.Anthropic()

TONE_PROFILES = {
    "payroll": "urgent and transparent, like talking to your own team",
    "supplier": "warm, collaborative, relationship-first",
    "rent": "professional, direct, formal Indian business tone"
}

def generate_email(obligation, action, business_name):
    tone = TONE_PROFILES.get(obligation["category"], "professional and direct")
    prompt = f"""
You are a business communication assistant for Indian SMBs.
Generate a professional email for this situation:

Business: {business_name}
Recipient: {obligation['name']}
Category: {obligation['category']}
Amount: ₹{obligation['amount']:,}
Action: {action}
Due in: {obligation['due_days']} days

Tone: {tone}

Rules:
- delay: Request 3-5 day extension with specific repayment date
- negotiate: Propose partial payment arrangement
- partial_pay: Confirm partial sent, commit to remainder date
- Under 120 words
- Start with Subject: line
- End with a hard commitment date
- No filler phrases

Return ONLY the email. No explanation.
"""
    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=400,
        messages=[{"role": "user", "content": prompt}]
    )
    return message.content[0].text
