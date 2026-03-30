# PharmaChain

## What Was Built
A blockchain-based pharmaceutical drug authentication system that eliminates
counterfeit medicines from the supply chain. Every drug batch is registered
on-chain at manufacture and tracked through every handoff — distributor,
pharmacy, patient — with tamper detection built in.

---

## All 6 Phases

| Phase | What | Key Files |
|-------|------|-----------|
| 1 | Core blockchain engine — Block, Blockchain, SHA-256 | `backend/blockchain.py`, `backend/drug_models.py` |
| 2 | Flask REST API — 12 endpoints | `backend/app.py` |
| 3 | React UI shell + all 7 pages | `frontend/src/App.jsx`, `pages.jsx` |
| 4 | Multi-step wizard forms + Dispense + Flag | `frontend/src/pages.jsx` |
| 5 | Tamper Lab v2 — 6 attack scenarios, hash diff, forensics | `frontend/src/pages.jsx` (TamperLab) |
| 6 | QR Verify — trust score, journey map, print label, compare | `frontend/src/pages.jsx` (Provenance) |

---

## Standalone HTML Demos (open these right now — no server needed)

| File | What it demos |
|------|---------------|
| `pharmachain_ui.html`            | Full app UI — chain explorer, tamper sim |
| `pharmachain_phase4_forms.html`  | Phase 4 wizard forms with validation |
| `pharmachain_phase5_tamper.html` | Phase 5 Tamper Lab — 6 attack scenarios |
| `pharmachain_phase6_qr.html`     | Phase 6 QR Verify — real QR codes, patient view, print label |

---

## Run the Full Stack

### Backend (Flask API)
```bash
pip install flask flask-cors qrcode[pil] pillow
cd pharmachain/backend
python app.py
# → http://localhost:5000
```

### Frontend (React)
```bash
cd pharmachain/frontend
npm install
npm run dev
# → http://localhost:5173
```

### Run Tests
```bash
python tests/test_blockchain.py   # 21 tests — blockchain engine
python tests/test_api.py          # 37 tests — API endpoints
```

---

## Project Structure
```
pharmachain/
├── backend/
│   ├── blockchain.py       ← Block + Blockchain classes, SHA-256
│   ├── drug_models.py      ← Standardized event data shapes
│   └── app.py              ← Flask REST API, 12 endpoints
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx        ← Entry point
│       ├── App.jsx         ← Shell + routing + sidebar
│       ├── index.css       ← Global tokens (phosphor-green theme)
│       ├── api.js          ← All Axios calls to Flask
│       ├── components.jsx  ← StatCard, ChainTrack, BlockDetail, forms
│       ├── pages.jsx       ← All 9 pages in one file
│       └── pages/          ← Individual re-exports
└── tests/
    ├── test_blockchain.py
    └── test_api.py
```

---

## API Reference

### GET Endpoints
| Endpoint | Returns |
|----------|---------|
| `/api/chain` | Full blockchain |
| `/api/chain/<n>` | Single block |
| `/api/verify` | Chain validity check |
| `/api/stats` | Dashboard stats |
| `/api/batch/<id>` | Full drug provenance history |
| `/api/qr/<id>` | QR code (base64 PNG) |

### POST Endpoints
| Endpoint | Action |
|----------|--------|
| `/api/batch` | Register new drug batch |
| `/api/transfer` | Log ownership transfer |
| `/api/dispense` | Log dispensing to patient |
| `/api/flag` | Flag suspicious batch |
| `/api/tamper` | Simulate tampering (demo) |
| `/api/reset` | Reset to demo state |

---

## Blockchain Concepts Covered
- **SHA-256 hashing** — fingerprint of each block's contents
- **Block chaining** — each block stores the previous block's hash
- **Tamper detection** — recompute + compare hash to catch mutations
- **Immutability** — can't fix one block without fixing all downstream
- **Provenance** — complete chain of custody from manufacturer to patient

---

## Requirements Coverage
| Requirement | Implementation |
|-------------|---------------|
| Store transactions in blocks | Each drug event = one Block with data, hash, prev_hash |
| Implement hashing & chaining | SHA-256 via Python hashlib, chained via prev_hash |
| Simulate data tampering | Tamper Lab — 6 real-world attack scenarios |
| Verify immutability | validate_chain() catches any mutation + counter-tamper demo |
