# 💰 Cash Flow Decision Engine (AI CFO)

> Turning financial data into **real decisions** for small businesses.

---

## 🚨 Problem

Small businesses don’t fail because they lack data —
they fail because they **don’t know what to do when cash is limited**.

* Multiple payments due
* Limited cash
* No clear prioritization
* High risk of wrong decisions

---

## 💡 Solution

This project is an **AI-powered financial decision engine** that:

* Analyzes real financial data
* Detects cash shortages
* Prioritizes obligations
* Suggests **actionable decisions** (Pay / Delay / Negotiate)
* Generates negotiation emails automatically
* Simulates scenarios using a **What-If engine**

👉 Not a dashboard.
👉 Not an expense tracker.
👉 A **decision-making system (AI CFO)**.

---

## 🧠 Core Features

### 🔥 Deterministic Decision Engine

* Uses rule-based scoring (not random AI guesses)
* Prioritizes payments based on:

  * urgency
  * risk
  * penalties
  * flexibility

---

### ⚠️ Crisis Detection

* Detects cash shortfall
* Calculates runway (days before cash runs out)
* Flags critical financial risk

---

### 📊 Actionable Recommendations

* Pay critical obligations
* Delay flexible payments
* Negotiate when needed

---

### 🤝 Smart Negotiation Generator

* Auto-generates professional emails
* Context-aware messaging
* Helps businesses communicate delays

---

### 🔮 What-If Simulation

* Adjust available cash
* Instantly see decision changes
* Explore financial scenarios

---

### 📂 OCR-Based Data Ingestion

* Accepts:

  * invoices
  * receipts
  * bank statements
* Extracts structured financial data

---

## 🏗️ Project Structure

```
cashsense/
│
├── frontend/
│   ├── src/
│   │   ├── App.js          # Main UI (dashboard + decision engine)
│   │   ├── App.css
│   │   └── index.js
│
├── backend/
│   ├── engine/
│   │   ├── constraint_engine.py
│   │   ├── decision_engine.py
│   │   ├── explanation_engine.py
│   │   ├── financial_model.py
│   │   └── email_generator.py
│   │
│   ├── ocr/
│   │   └── parser.py       # OCR + parsing logic
│   │
│   ├── data/
│   │   └── mock_data.json  # Sample business data
│   │
│   └── main.py             # API server
│
└── README.md
```

---

## ⚙️ Tech Stack

### Frontend

* React.js
* Axios
* Custom UI (no heavy frameworks)

### Backend

* Python (FastAPI / Flask)
* Deterministic financial logic engine

### AI Usage

* Email generation
* Explanation layer

### Data Processing

* OCR parsing (images → structured data)

---

## 🔄 How It Works

1. **Input Data**

   * Upload invoice / receipt / financial data

2. **Data Processing**

   * OCR extracts key fields
   * Structured into financial model

3. **Decision Engine**

   * Applies constraints
   * Scores obligations
   * Optimizes payment allocation

4. **Output**

   * Clear action plan:

     * Pay
     * Delay
     * Negotiate

---

## 📌 Example Output

```
AI Recommendation:

✔ Pay Staff Salaries
⚠ Delay Supplier (3 days)
💬 Negotiate Rent
```

---

## 🚀 Running the Project

### Backend

```bash
cd backend
python main.py
```

---

### Frontend

```bash
cd frontend
npm install
npm start
```

---

## 🎯 Why This Project Stands Out

* ✅ Focuses on **decision-making**, not just data visualization
* ✅ Uses **deterministic logic**, not unreliable LLM guesses
* ✅ Provides **real-world actionable outputs**
* ✅ Handles **messy real data (OCR support)**
* ✅ Built for **practical business impact**

---

## 🧠 Future Improvements

* Bank API integration
* Automated payment execution
* Advanced risk prediction
* Multi-business support

---

## 🏆 Vision

To build a system where:

> Every small business has access to a **smart financial decision engine**

---

## 👨‍💻 Author

Built for hackathon — designed to solve real-world financial problems.

