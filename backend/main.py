from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import json, sys, os

sys.path.insert(0, os.path.dirname(__file__))

from engine.financial_model import build_financial_state
from engine.decision_engine import run_knapsack
from engine.explanation_engine import build_chain_of_thought, get_reason
from engine.email_generator import generate_email

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_methods=["*"], allow_headers=["*"])

with open(os.path.join(os.path.dirname(__file__), "data/mock_data.json")) as f:
    MOCK_DATA = json.load(f)

@app.get("/api/state")
def get_state():
    return build_financial_state(MOCK_DATA)

@app.get("/api/decisions")
def get_decisions():
    state = build_financial_state(MOCK_DATA)
    results, cash_left = run_knapsack(
        MOCK_DATA["obligations"],
        MOCK_DATA["cash_available"],
        MOCK_DATA["operational_minimum"]
    )
    for ob in results:
        ob["reasoning"] = get_reason(ob)
    cot = build_chain_of_thought(results, state)
    return {"decisions": results, "cash_remaining": cash_left,
            "chain_of_thought": cot, "state": state}

@app.post("/api/whatif")
def what_if(payload: dict):
    modified = {**MOCK_DATA, "cash_available": payload["cash"]}
    state = build_financial_state(modified)
    results, cash_left = run_knapsack(
        modified["obligations"],
        modified["cash_available"],
        modified["operational_minimum"]
    )
    for ob in results:
        ob["reasoning"] = get_reason(ob)
    return {"decisions": results, "cash_remaining": cash_left, "state": state}

@app.post("/api/email")
def get_email(payload: dict):
    email_text = generate_email(
        payload["obligation"],
        payload["action"],
        MOCK_DATA["business_name"]
    )
    return {"email": email_text}
