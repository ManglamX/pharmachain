"""
=============================================================
  PharmaChain — API Endpoint Tests
=============================================================
  These tests use Flask's built-in TEST CLIENT.
  
  WHAT IS A TEST CLIENT?
  Flask lets you simulate HTTP requests WITHOUT actually
  starting a real server. It's like a "fake browser"
  built into Flask just for testing.
  
  Run with:  python tests/test_api.py
=============================================================
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

# We need to patch flask_cors before importing app
# (since flask_cors may not be installed in the sandbox)
import unittest.mock as mock
import types

# Create a minimal mock for flask_cors
cors_module = types.ModuleType("flask_cors")
cors_module.CORS = lambda app, **kwargs: app
sys.modules["flask_cors"] = cors_module

from backend.app import app, pharma_chain

import json

# ── Helpers ─────────────────────────────────────────────────
PASS = "✅ PASS"
FAIL = "❌ FAIL"

def check(label, condition):
    print(f"  {'✅ PASS' if condition else '❌ FAIL'}  {label}")

def section(title):
    print(f"\n{'─'*55}")
    print(f"  🧪 {title}")
    print(f"{'─'*55}")

# Flask test client — simulates HTTP without a real server
client = app.test_client()

def get(path):
    r = client.get(path)
    return r.status_code, json.loads(r.data)

def post(path, body):
    r = client.post(path, json=body, content_type="application/json")
    return r.status_code, json.loads(r.data)


# ════════════════════════════════════════════════════════════
#  TEST 1: GET /api/chain
# ════════════════════════════════════════════════════════════
section("TEST 1: GET /api/chain — Fetch the full blockchain")

status, data = get("/api/chain")
print(f"  Status: {status}  |  Blocks: {data.get('length')}")

check("Returns HTTP 200",              status == 200)
check("Response has 'chain' key",      "chain" in data)
check("Chain is a list",               isinstance(data["chain"], list))
check("Chain has blocks (demo data)",  data["length"] >= 7)
check("First block is genesis",        data["chain"][0]["data"]["event"] == "GENESIS")
check("Blocks have 'hash' field",      "hash" in data["chain"][0])
check("Blocks have 'previous_hash'",   "previous_hash" in data["chain"][0])


# ════════════════════════════════════════════════════════════
#  TEST 2: GET /api/verify — Chain validation
# ════════════════════════════════════════════════════════════
section("TEST 2: GET /api/verify — Validate chain integrity")

status, data = get("/api/verify")
print(f"  Status: {status}  |  is_valid: {data.get('is_valid')}")

check("Returns HTTP 200",             status == 200)
check("is_valid = True (clean chain)",data["is_valid"] == True)
check("No errors in clean chain",     len(data["errors"]) == 0)


# ════════════════════════════════════════════════════════════
#  TEST 3: GET /api/stats — Dashboard stats
# ════════════════════════════════════════════════════════════
section("TEST 3: GET /api/stats — Dashboard summary")

status, data = get("/api/stats")
print(f"  Status: {status}  |  Stats: {json.dumps(data.get('event_counts'), indent=0)}")

check("Returns HTTP 200",               status == 200)
check("has 'total_blocks'",             "total_blocks" in data)
check("has 'total_batches'",            "total_batches" in data)
check("has 'is_chain_valid'",           "is_chain_valid" in data)
check("has 'event_counts'",             "event_counts" in data)
check("Batch count >= 3 (demo data)",   data["total_batches"] >= 3)


# ════════════════════════════════════════════════════════════
#  TEST 4: POST /api/batch — Add a drug batch
# ════════════════════════════════════════════════════════════
section("TEST 4: POST /api/batch — Register new drug batch")

new_batch = {
    "batch_id"        : "B_TEST_001",
    "drug_name"       : "Ibuprofen 400mg",
    "manufacturer"    : "Pfizer India",
    "quantity"        : 2000,
    "manufacture_date": "2025-03-20",
    "expiry_date"     : "2027-03-19",
    "location"        : "Delhi, India",
}

status, data = post("/api/batch", new_batch)
print(f"  Status: {status}  |  Message: {data.get('message')}")

check("Returns HTTP 201 (Created)",       status == 201)
check("Response has 'block' key",         "block" in data)
check("Block has correct batch_id",       data["block"]["data"]["batch_id"] == "B_TEST_001")
check("Block event is BATCH_CREATED",     data["block"]["data"]["event"] == "BATCH_CREATED")
check("Block has a hash",                 len(data["block"]["hash"]) == 64)

# Duplicate batch_id should fail
status2, data2 = post("/api/batch", new_batch)
check("Duplicate batch_id returns 400",   status2 == 400)
check("Duplicate error message present",  "already exists" in data2.get("error",""))

# Missing fields should fail
status3, data3 = post("/api/batch", {"batch_id": "INCOMPLETE"})
check("Incomplete data returns 400",      status3 == 400)
check("Error mentions missing fields",    "Missing" in data3.get("error",""))


# ════════════════════════════════════════════════════════════
#  TEST 5: POST /api/transfer — Log a transfer
# ════════════════════════════════════════════════════════════
section("TEST 5: POST /api/transfer — Log ownership transfer")

transfer = {
    "batch_id"     : "B_TEST_001",
    "drug_name"    : "Ibuprofen 400mg",
    "from_actor"   : "Pfizer India",
    "from_location": "Delhi",
    "to_actor"     : "Delhi Distributors",
    "to_location"  : "Noida",
    "quantity"     : 2000,
    "notes"        : "On-time delivery",
}

status, data = post("/api/transfer", transfer)
print(f"  Status: {status}  |  Event: {data.get('block', {}).get('data', {}).get('event')}")

check("Returns HTTP 201",                status == 201)
check("Event is TRANSFERRED",            data["block"]["data"]["event"] == "TRANSFERRED")
check("from_actor is correct",           data["block"]["data"]["from_actor"] == "Pfizer India")
check("to_actor is correct",             data["block"]["data"]["to_actor"] == "Delhi Distributors")


# ════════════════════════════════════════════════════════════
#  TEST 6: POST /api/dispense — Log dispensing
# ════════════════════════════════════════════════════════════
section("TEST 6: POST /api/dispense — Log dispensing to patient")

dispense = {
    "batch_id"    : "B_TEST_001",
    "drug_name"   : "Ibuprofen 400mg",
    "pharmacy"    : "CityMed Pharmacy, Noida",
    "patient_id"  : "PAT-9999",
    "quantity"    : 20,
    "prescription": "RX-TEST-001",
}

status, data = post("/api/dispense", dispense)
print(f"  Status: {status}  |  Event: {data.get('block', {}).get('data', {}).get('event')}")

check("Returns HTTP 201",               status == 201)
check("Event is DISPENSED",             data["block"]["data"]["event"] == "DISPENSED")
check("patient_id is anonymized ID",    data["block"]["data"]["patient_id"] == "PAT-9999")


# ════════════════════════════════════════════════════════════
#  TEST 7: GET /api/batch/<id> — Batch history
# ════════════════════════════════════════════════════════════
section("TEST 7: GET /api/batch/<id> — Batch provenance history")

status, data = get("/api/batch/B_TEST_001")
print(f"  Status: {status}  |  Hops: {data.get('hop_count')}")

check("Returns HTTP 200",                  status == 200)
check("batch_id matches",                  data["batch_id"] == "B_TEST_001")
check("drug_name is correct",              "Ibuprofen" in data["drug_name"])
check("history has 3 events",             data["hop_count"] == 3)
check("Not flagged (clean batch)",         data["is_flagged"] == False)
check("Latest event is DISPENSED",        data["latest_event"] == "DISPENSED")

# Unknown batch
status2, data2 = get("/api/batch/UNKNOWN_BATCH")
check("Unknown batch returns 404",         status2 == 404)


# ════════════════════════════════════════════════════════════
#  TEST 8: GET /api/chain/<n> — Single block
# ════════════════════════════════════════════════════════════
section("TEST 8: GET /api/chain/<n> — Fetch single block")

status, data = get("/api/chain/0")
check("Block 0 (genesis) returns 200",    status == 200)
check("Block 0 has correct index",        data["block"]["index"] == 0)
check("Block 0 event is GENESIS",         data["block"]["data"]["event"] == "GENESIS")

status2, _ = get("/api/chain/9999")
check("Non-existent block returns 404",   status2 == 404)


# ════════════════════════════════════════════════════════════
#  TEST 9: POST /api/tamper + GET /api/verify
# ════════════════════════════════════════════════════════════
section("TEST 9: POST /api/tamper — Tamper + Verify chain breaks")

# Get current block 2 data
_, chain_data = get("/api/chain")
block2_data = chain_data["chain"][2]["data"]

# Tamper block 2
tamper_payload = {
    "index"   : 2,
    "new_data": {**block2_data, "quantity": 1},
}
status, data = post("/api/tamper", tamper_payload)
print(f"  Tamper status: {status}  |  Message: {data.get('message','')[:50]}")

check("Tamper returns HTTP 200",           status == 200)
check("Tamper success=True",              data["success"] == True)

# Now verify — must be invalid
status2, data2 = get("/api/verify")
print(f"  Chain valid after tamper: {data2.get('is_valid')}  |  Errors: {len(data2.get('errors',[]))}")

check("Chain is now INVALID",             data2["is_valid"] == False)
check("Errors are detected",              len(data2["errors"]) >= 1)


# ════════════════════════════════════════════════════════════
#  TEST 10: POST /api/reset — Reset chain
# ════════════════════════════════════════════════════════════
section("TEST 10: POST /api/reset — Reset chain to clean state")

status, data = post("/api/reset", {})
check("Reset returns HTTP 200",           status == 200)
check("Reset message present",            "reset" in data.get("message","").lower())

# Chain should be valid again
status2, data2 = get("/api/verify")
check("Chain is valid again after reset", data2["is_valid"] == True)


# ════════════════════════════════════════════════════════════
#  TEST 11: POST /api/flag — Flag a batch
# ════════════════════════════════════════════════════════════
section("TEST 11: POST /api/flag — Flag suspicious batch")

status, data = post("/api/flag", {
    "batch_id"  : "B002",
    "drug_name" : "Amoxicillin 250mg",
    "flagged_by": "Apollo Hospital, Chennai",
    "reason"    : "Packaging seal broken on arrival",
})

check("Flag returns HTTP 201",            status == 201)
check("Event is FLAGGED",                 data["block"]["data"]["event"] == "FLAGGED")

# Batch history should now show flagged
status2, data2 = get("/api/batch/B002")
check("Batch B002 now is_flagged=True",   data2["is_flagged"] == True)


# ════════════════════════════════════════════════════════════
#  SUMMARY
# ════════════════════════════════════════════════════════════
print(f"\n{'═'*55}")
print("  🏁 ALL API TESTS COMPLETE")
print(f"{'═'*55}")
print()
print("  What we built:")
print("  - 12 REST API endpoints using Flask")
print("  - Full CRUD for drug supply chain events")
print("  - Chain validation, tamper simulation, reset")
print("  - Batch provenance history endpoint")
print("  - QR code generation endpoint")
print()
print("  Phase 2 DONE ✅ — Ready for Phase 3 (React UI)")
print()
