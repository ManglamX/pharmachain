"""
=============================================================
  PharmaChain — Flask REST API
=============================================================
  WHAT IS A REST API?
  
  REST API = a web server that listens for HTTP requests
  and sends back JSON responses.
  
  Think of it as a "waiter":
    - Frontend (React) places an ORDER (HTTP request)
    - API processes it using our Blockchain engine
    - API brings back the RESULT (JSON response)
  
  HTTP Methods we use:
    GET  → Read/fetch data      (e.g. "show me the chain")
    POST → Create/send data     (e.g. "add a new drug batch")
  
  Our Endpoints:
    GET  /api/chain               → Return entire blockchain
    GET  /api/chain/<index>       → Return one block
    GET  /api/verify              → Validate chain integrity
    POST /api/batch               → Register new drug batch
    POST /api/transfer            → Log ownership transfer
    POST /api/dispense            → Log dispensing to patient
    POST /api/flag                → Flag a batch as suspicious
    POST /api/tamper              → Simulate tampering (demo)
    POST /api/reset               → Reset chain (demo only)
    GET  /api/qr/<batch_id>       → Generate QR code image
    GET  /api/batch/<batch_id>    → Get full history of one batch
    GET  /api/stats               → Dashboard summary stats
=============================================================
"""

import io
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import our blockchain engine and data models
from blockchain  import Blockchain
from drug_models import (
    make_batch_created, make_transfer,
    make_dispensed, make_flagged,
    EVENT_BATCH_CREATED, EVENT_TRANSFERRED,
    EVENT_RECEIVED, EVENT_DISPENSED, EVENT_FLAGGED,
)

# ── App Setup ───────────────────────────────────────────────
app = Flask(__name__)
CORS(app)   # Allow React (running on port 5173) to call this API (port 5000)
            # Without CORS, browsers block cross-origin requests

# ── Global Blockchain Instance ──────────────────────────────
# One shared blockchain for the whole server session.
# In production, this would be stored in a database.
pharma_chain = Blockchain()

# ── Seed with demo data so the UI isn't empty on first load ─
def seed_demo_data():
    """Add realistic demo drug batches to start with."""
    import time

    # Batch 1: Paracetamol — full journey ✅
    pharma_chain.add_block(make_batch_created(
        batch_id="B001", drug_name="Paracetamol 500mg",
        manufacturer="Sun Pharma Ltd.", quantity=10000,
        manufacture_date="2025-01-10", expiry_date="2027-01-09",
        location="Mumbai, India"
    ))
    time.sleep(0.01)
    pharma_chain.add_block(make_transfer(
        batch_id="B001", drug_name="Paracetamol 500mg",
        from_actor="Sun Pharma Ltd.", from_location="Mumbai",
        to_actor="MedDistrib Pvt. Ltd.", to_location="Pune",
        quantity=10000, notes="Cold-chain maintained"
    ))
    time.sleep(0.01)
    pharma_chain.add_block(make_dispensed(
        batch_id="B001", drug_name="Paracetamol 500mg",
        pharmacy="HealthPlus Pharmacy", patient_id="PAT-001",
        quantity=30, prescription="RX-2025-001"
    ))

    # Batch 2: Amoxicillin — in transit 🚚
    time.sleep(0.01)
    pharma_chain.add_block(make_batch_created(
        batch_id="B002", drug_name="Amoxicillin 250mg",
        manufacturer="Cipla Ltd.", quantity=5000,
        manufacture_date="2025-02-05", expiry_date="2026-08-04",
        location="Hyderabad, India"
    ))
    time.sleep(0.01)
    pharma_chain.add_block(make_transfer(
        batch_id="B002", drug_name="Amoxicillin 250mg",
        from_actor="Cipla Ltd.", from_location="Hyderabad",
        to_actor="Apollo Distributors", to_location="Chennai",
        quantity=5000, notes="Standard shipment"
    ))

    # Batch 3: Metformin — just created 🏭
    time.sleep(0.01)
    pharma_chain.add_block(make_batch_created(
        batch_id="B003", drug_name="Metformin 1000mg",
        manufacturer="Dr. Reddy's Labs", quantity=8000,
        manufacture_date="2025-03-01", expiry_date="2027-02-28",
        location="Ahmedabad, India"
    ))

    print(f"[PharmaChain] 🌱 Demo data seeded. Chain has {len(pharma_chain)} blocks.")

seed_demo_data()


# ════════════════════════════════════════════════════════════
#  HELPER
# ════════════════════════════════════════════════════════════

def success(data: dict, status: int = 200):
    """Standard success response wrapper."""
    return jsonify({"success": True, **data}), status

def error(message: str, status: int = 400):
    """Standard error response wrapper."""
    return jsonify({"success": False, "error": message}), status


# ════════════════════════════════════════════════════════════
#  ENDPOINTS
# ════════════════════════════════════════════════════════════

# ── GET /api/chain ──────────────────────────────────────────
@app.route("/api/chain", methods=["GET"])
def get_chain():
    """
    Returns the entire blockchain as a JSON array.
    
    Response:
      { success: true, chain: [...blocks], length: N }
    """
    return success({
        "chain" : pharma_chain.get_chain_as_list(),
        "length": len(pharma_chain),
    })


# ── GET /api/chain/<index> ──────────────────────────────────
@app.route("/api/chain/<int:index>", methods=["GET"])
def get_block(index):
    """
    Returns a single block by its index.
    """
    block = pharma_chain.get_block(index)
    if block is None:
        return error(f"Block #{index} not found", 404)
    return success({"block": block})


# ── GET /api/verify ─────────────────────────────────────────
@app.route("/api/verify", methods=["GET"])
def verify_chain():
    """
    Validates the entire blockchain.
    Checks every block's hash and chain links.
    
    Response:
      { success, is_valid, total_blocks, errors, details }
    """
    result = pharma_chain.validate_chain()
    return success(result)


# ── GET /api/stats ──────────────────────────────────────────
@app.route("/api/stats", methods=["GET"])
def get_stats():
    """
    Returns summary statistics for the dashboard.
    """
    chain     = pharma_chain.get_chain_as_list()
    events    = [b["data"].get("event", "") for b in chain]
    batches   = set(b["data"].get("batch_id") for b in chain if "batch_id" in b["data"])
    validity  = pharma_chain.validate_chain()

    return success({
        "total_blocks"   : len(chain),
        "total_batches"  : len(batches),
        "is_chain_valid" : validity["is_valid"],
        "event_counts"   : {
            "batch_created": events.count(EVENT_BATCH_CREATED),
            "transferred"  : events.count(EVENT_TRANSFERRED),
            "dispensed"    : events.count(EVENT_DISPENSED),
            "flagged"      : events.count(EVENT_FLAGGED),
        },
        "batch_ids": list(batches),
    })


# ── POST /api/batch ─────────────────────────────────────────
@app.route("/api/batch", methods=["POST"])
def add_batch():
    """
    Register a new drug batch (manufacturer creates it).
    
    Request body (JSON):
      {
        "batch_id"        : "B004",
        "drug_name"       : "Ibuprofen 400mg",
        "manufacturer"    : "Pfizer India",
        "quantity"        : 2000,
        "manufacture_date": "2025-03-20",
        "expiry_date"     : "2027-03-19",
        "location"        : "Delhi, India"
      }
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    # Validate required fields
    required = ["batch_id", "drug_name", "manufacturer", "quantity",
                "manufacture_date", "expiry_date"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}")

    # Check duplicate batch ID
    existing_batches = set(
        b["data"].get("batch_id")
        for b in pharma_chain.get_chain_as_list()
        if "batch_id" in b["data"]
    )
    if body["batch_id"] in existing_batches:
        return error(f"Batch ID '{body['batch_id']}' already exists on the chain")

    data  = make_batch_created(**{k: body[k] for k in required},
                                location=body.get("location", "Unknown"))
    block = pharma_chain.add_block(data)

    return success({"block": block.to_dict(), "message": "Drug batch registered on blockchain"}, 201)


# ── POST /api/transfer ──────────────────────────────────────
@app.route("/api/transfer", methods=["POST"])
def add_transfer():
    """
    Log an ownership transfer between supply chain actors.
    
    Request body (JSON):
      {
        "batch_id"     : "B001",
        "drug_name"    : "Paracetamol 500mg",
        "from_actor"   : "Sun Pharma",
        "from_location": "Mumbai",
        "to_actor"     : "MedDistrib",
        "to_location"  : "Pune",
        "quantity"     : 5000,
        "notes"        : "Optional notes"
      }
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    required = ["batch_id", "drug_name", "from_actor",
                "from_location", "to_actor", "to_location", "quantity"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}")

    data  = make_transfer(**{k: body[k] for k in required},
                          notes=body.get("notes", ""))
    block = pharma_chain.add_block(data)

    return success({"block": block.to_dict(), "message": "Transfer recorded on blockchain"}, 201)


# ── POST /api/dispense ──────────────────────────────────────
@app.route("/api/dispense", methods=["POST"])
def add_dispense():
    """
    Log that a pharmacy dispensed a drug to a patient.
    
    Request body (JSON):
      {
        "batch_id"    : "B001",
        "drug_name"   : "Paracetamol 500mg",
        "pharmacy"    : "HealthPlus Pharmacy",
        "patient_id"  : "PAT-001",
        "quantity"    : 30,
        "prescription": "RX-2025-001"
      }
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    required = ["batch_id", "drug_name", "pharmacy", "patient_id", "quantity"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}")

    data  = make_dispensed(**{k: body[k] for k in required},
                           prescription=body.get("prescription", ""))
    block = pharma_chain.add_block(data)

    return success({"block": block.to_dict(), "message": "Dispensing recorded on blockchain"}, 201)


# ── POST /api/flag ──────────────────────────────────────────
@app.route("/api/flag", methods=["POST"])
def flag_batch():
    """
    Flag a drug batch as suspicious or counterfeit.
    
    Request body (JSON):
      {
        "batch_id"  : "B002",
        "drug_name" : "Amoxicillin 250mg",
        "flagged_by": "Apollo Hospital",
        "reason"    : "Packaging seal broken on arrival"
      }
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    required = ["batch_id", "drug_name", "flagged_by", "reason"]
    missing = [f for f in required if not body.get(f)]
    if missing:
        return error(f"Missing required fields: {', '.join(missing)}")

    data  = make_flagged(**{k: body[k] for k in required})
    block = pharma_chain.add_block(data)

    return success({"block": block.to_dict(), "message": "Batch flagged on blockchain"}, 201)


# ── POST /api/tamper ─────────────────────────────────────────
@app.route("/api/tamper", methods=["POST"])
def tamper_block():
    """
    DEMO ONLY: Simulate tampering a block's data.
    This directly changes block data without updating its hash,
    which breaks chain validation — showing immutability in action.
    
    Request body (JSON):
      {
        "index"   : 2,
        "new_data": { "quantity": 50, "event": "TRANSFERRED", ... }
      }
    """
    body = request.get_json()
    if not body:
        return error("Request body must be JSON")

    index    = body.get("index")
    new_data = body.get("new_data")

    if index is None or new_data is None:
        return error("Both 'index' and 'new_data' are required")

    result = pharma_chain.tamper_block(index, new_data)

    if not result["success"]:
        return error(result["error"])

    return success({
        "message" : f"Block #{index} tampered successfully (demo mode)",
        "result"  : result,
        "warning" : "Chain is now INVALID. Run /api/verify to confirm.",
    })


# ── POST /api/reset ──────────────────────────────────────────
@app.route("/api/reset", methods=["POST"])
def reset_chain():
    """
    DEMO ONLY: Resets the blockchain to a fresh state with demo data.
    Useful for resetting after a tamper demo.
    """
    global pharma_chain
    pharma_chain = Blockchain()
    seed_demo_data()
    return success({"message": "Chain reset to demo state", "blocks": len(pharma_chain)})


# ── GET /api/batch/<batch_id> ───────────────────────────────
@app.route("/api/batch/<batch_id>", methods=["GET"])
def get_batch_history(batch_id):
    """
    Returns all blockchain blocks related to a specific batch_id.
    This is the "provenance history" of a drug.
    
    Used by the QR scan page to show full drug journey.
    """
    all_blocks = pharma_chain.get_chain_as_list()
    batch_blocks = [
        b for b in all_blocks
        if b["data"].get("batch_id") == batch_id
    ]

    if not batch_blocks:
        return error(f"No records found for batch '{batch_id}'", 404)

    # Check if this batch has been flagged
    is_flagged  = any(b["data"]["event"] == EVENT_FLAGGED for b in batch_blocks)
    # Final event in the chain
    latest_event = batch_blocks[-1]["data"].get("event", "UNKNOWN")

    return success({
        "batch_id"    : batch_id,
        "drug_name"   : batch_blocks[0]["data"].get("drug_name", "Unknown"),
        "is_flagged"  : is_flagged,
        "latest_event": latest_event,
        "history"     : batch_blocks,
        "hop_count"   : len(batch_blocks),
    })


# ── GET /api/qr/<batch_id> ──────────────────────────────────
@app.route("/api/qr/<batch_id>", methods=["GET"])
def get_qr_code(batch_id):
    """
    Generates a QR code image for a given batch_id.
    The QR encodes a URL like: http://localhost:5173/verify/B001
    
    Returns the QR as a base64-encoded PNG so the frontend
    can display it in an <img> tag directly.
    
    Response:
      { success, batch_id, qr_base64, verify_url }
    """
    try:
        import qrcode

        # The URL a patient would scan to see provenance
        verify_url = f"http://localhost:5173/verify/{batch_id}"

        qr = qrcode.QRCode(
            version       = 1,
            error_correction = qrcode.constants.ERROR_CORRECT_H,
            box_size      = 10,
            border        = 4,
        )
        qr.add_data(verify_url)
        qr.make(fit=True)

        img    = qr.make_image(fill_color="black", back_color="white")
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        buffer.seek(0)

        qr_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return success({
            "batch_id"  : batch_id,
            "qr_base64" : qr_base64,
            "verify_url": verify_url,
        })

    except ImportError:
        # qrcode not installed — return a placeholder message
        return success({
            "batch_id"  : batch_id,
            "qr_base64" : None,
            "verify_url": f"http://localhost:5173/verify/{batch_id}",
            "note"      : "Install 'qrcode[pil]' package to generate actual QR images",
        })


# ════════════════════════════════════════════════════════════
#  ERROR HANDLERS
# ════════════════════════════════════════════════════════════

@app.errorhandler(404)
def not_found(e):
    return error("Endpoint not found", 404)

@app.errorhandler(405)
def method_not_allowed(e):
    return error("Method not allowed on this endpoint", 405)

@app.errorhandler(500)
def internal_error(e):
    return error(f"Internal server error: {str(e)}", 500)


# ════════════════════════════════════════════════════════════
#  RUN
# ════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("\n" + "═"*55)
    print("  💊 PharmaChain API Server")
    print("═"*55)
    print("  Listening on: http://localhost:5000")
    print()
    print("  Endpoints:")
    print("    GET  /api/chain              → Full blockchain")
    print("    GET  /api/chain/<n>          → Single block")
    print("    GET  /api/verify             → Validate chain")
    print("    GET  /api/stats              → Dashboard stats")
    print("    GET  /api/batch/<id>         → Batch history")
    print("    GET  /api/qr/<id>            → QR code")
    print("    POST /api/batch              → Add drug batch")
    print("    POST /api/transfer           → Log transfer")
    print("    POST /api/dispense           → Log dispense")
    print("    POST /api/flag               → Flag suspicious")
    print("    POST /api/tamper             → Tamper (demo)")
    print("    POST /api/reset              → Reset (demo)")
    print("═"*55 + "\n")

    app.run(debug=True, port=5000)
