"""
=============================================================
  PharmaChain — Blockchain Engine Tests
=============================================================
  This file PROVES the blockchain works correctly.
  Run it with:  python test_blockchain.py
  
  What we test:
    1. Genesis block is created on init
    2. Adding blocks works and links correctly
    3. Valid chain passes validation
    4. Tampered chain FAILS validation
    5. Drug-specific data flows correctly through the chain
=============================================================
"""

import sys
import os

# Add parent directory so we can import our modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.blockchain  import Blockchain, calculate_hash
from backend.drug_models import (
    make_batch_created, make_transfer, make_dispensed, make_flagged
)


# ── Helpers ─────────────────────────────────────────────────
PASS = "✅ PASS"
FAIL = "❌ FAIL"

def check(label: str, condition: bool):
    status = PASS if condition else FAIL
    print(f"  {status}  {label}")
    if not condition:
        print(f"         ^ TEST FAILED — check your blockchain.py")

def section(title: str):
    print(f"\n{'─'*55}")
    print(f"  🧪 {title}")
    print(f"{'─'*55}")


# ════════════════════════════════════════════════════════════
#  TEST 1: Hashing
# ════════════════════════════════════════════════════════════
section("TEST 1: SHA-256 Hashing Basics")

h1 = calculate_hash({"name": "Paracetamol", "batch": "001"})
h2 = calculate_hash({"name": "Paracetamol", "batch": "001"})
h3 = calculate_hash({"name": "Paracetamol", "batch": "002"})  # slightly different

check("Same input always gives same hash",       h1 == h2)
check("Different input gives different hash",    h1 != h3)
check("Hash is 64 characters long (SHA-256)",    len(h1) == 64)
check("Hash is a hex string",                    all(c in "0123456789abcdef" for c in h1))
print(f"\n  Sample hash: {h1}")


# ════════════════════════════════════════════════════════════
#  TEST 2: Genesis Block
# ════════════════════════════════════════════════════════════
section("TEST 2: Genesis Block Creation")

bc = Blockchain()
genesis = bc.chain[0]

check("Chain starts with exactly 1 block",       len(bc) == 1)
check("Genesis block index is 0",                genesis.index == 0)
check("Genesis previous_hash is '0'",            genesis.previous_hash == "0")
check("Genesis has a valid hash",                len(genesis.hash) == 64)
check("Genesis event is 'GENESIS'",              genesis.data["event"] == "GENESIS")


# ════════════════════════════════════════════════════════════
#  TEST 3: Adding Blocks (Drug Supply Chain Simulation)
# ════════════════════════════════════════════════════════════
section("TEST 3: Adding Blocks — Simulating a Drug Journey")

print("\n  Scenario: Paracetamol 500mg batch B001 traveling from")
print("  Manufacturer (Mumbai) → Distributor (Pune) → Pharmacy (Pune)")

# Step 1: Manufacturer creates a batch
batch_data = make_batch_created(
    batch_id       = "B001",
    drug_name      = "Paracetamol 500mg",
    manufacturer   = "Sun Pharma Ltd.",
    quantity       = 5000,
    manufacture_date = "2025-01-15",
    expiry_date    = "2027-01-14",
    location       = "Mumbai, India",
)
block1 = bc.add_block(batch_data)

# Step 2: Transfer to distributor
transfer_data = make_transfer(
    batch_id      = "B001",
    drug_name     = "Paracetamol 500mg",
    from_actor    = "Sun Pharma Ltd.",
    from_location = "Mumbai, India",
    to_actor      = "MedDistrib Pvt. Ltd.",
    to_location   = "Pune, India",
    quantity      = 5000,
    notes         = "Shipped via refrigerated truck",
)
block2 = bc.add_block(transfer_data)

# Step 3: Dispensed at pharmacy
dispense_data = make_dispensed(
    batch_id    = "B001",
    drug_name   = "Paracetamol 500mg",
    pharmacy    = "HealthPlus Pharmacy, Koregaon Park",
    patient_id  = "PAT-7823",  # anonymized
    quantity    = 30,
    prescription = "RX-2025-9912",
)
block3 = bc.add_block(dispense_data)

check("Chain now has 4 blocks (genesis + 3)",           len(bc) == 4)
check("Block 1 index is 1",                              block1.index == 1)
check("Block 2 previous_hash == Block 1 hash (LINKED!)", block2.previous_hash == block1.hash)
check("Block 3 previous_hash == Block 2 hash (LINKED!)", block3.previous_hash == block2.hash)
check("Block 1 has correct batch_id",                    bc.chain[1].data["batch_id"] == "B001")

print("\n  Chain visualization:")
for block in bc.chain:
    arrow = "    ↓" if block.index < len(bc) - 1 else ""
    print(f"  [{block.index}] {block.data.get('event','?'):20s} hash:{block.hash[:12]}...  prev:{block.previous_hash[:12]}...")
    if arrow:
        print(arrow)


# ════════════════════════════════════════════════════════════
#  TEST 4: Valid Chain Passes Validation
# ════════════════════════════════════════════════════════════
section("TEST 4: Chain Validation — Untampered Chain")

result = bc.validate_chain()
print(f"\n  Validation result: is_valid = {result['is_valid']}")
print(f"  Total blocks checked: {result['total_blocks']}")
print(f"  Errors found: {len(result['errors'])}")

check("Valid chain returns is_valid = True",       result["is_valid"] == True)
check("No errors found in untampered chain",       len(result["errors"]) == 0)


# ════════════════════════════════════════════════════════════
#  TEST 5: Tamper Simulation — Chain Must Break
# ════════════════════════════════════════════════════════════
section("TEST 5: TAMPER SIMULATION — The Core Feature!")

print("\n  🔴 Simulating attack: someone changes Block 2's quantity")
print("     from 5000 units to 50 units (to divert drugs illegally)\n")

# Save the original hash before tampering
original_block2_hash = bc.chain[2].hash

# TAMPER: change the quantity in block 2
tamper_result = bc.tamper_block(
    index    = 2,
    new_data = {
        **transfer_data,   # keep all original fields
        "quantity": 50,    # ← FRAUDULENT CHANGE: 5000 → 50
        "notes"   : "Quantity reduced (TAMPERED)",
    }
)

check("Tamper function reports success",                     tamper_result["success"])
check("Block 2 data is now changed",                         bc.chain[2].data["quantity"] == 50)
check("Block 2 hash is STILL the old hash (mismatch!)",      bc.chain[2].hash == original_block2_hash)

# Now validate — it must FAIL
tampered_result = bc.validate_chain()
print(f"\n  Validation after tampering: is_valid = {tampered_result['is_valid']}")
print(f"  Errors detected: {len(tampered_result['errors'])}")
for err in tampered_result["errors"]:
    print(f"    ⚠️  {err}")

check("Tampered chain returns is_valid = False",      tampered_result["is_valid"] == False)
check("At least 1 error detected",                    len(tampered_result["errors"]) >= 1)
check("Error mentions Block #2",                      any("2" in e for e in tampered_result["errors"]))


# ════════════════════════════════════════════════════════════
#  TEST 6: get_block() and get_chain_as_list()
# ════════════════════════════════════════════════════════════
section("TEST 6: API Helper Methods")

single_block = bc.get_block(1)
all_blocks   = bc.get_chain_as_list()

check("get_block(1) returns a dict",              isinstance(single_block, dict))
check("get_block(1) has correct index",           single_block["index"] == 1)
check("get_block(1) has 'hash' key",              "hash" in single_block)
check("get_block(999) returns None",              bc.get_block(999) is None)
check("get_chain_as_list() returns a list",       isinstance(all_blocks, list))
check("get_chain_as_list() has correct length",   len(all_blocks) == len(bc))


# ════════════════════════════════════════════════════════════
#  SUMMARY
# ════════════════════════════════════════════════════════════
print(f"\n{'═'*55}")
print("  🏁 ALL TESTS COMPLETE")
print(f"{'═'*55}")
print()
print("  What just happened:")
print("  1. We built a blockchain from scratch in Python")
print("  2. Stored drug supply chain events as blocks")
print("  3. Each block is SHA-256 fingerprinted and linked")
print("  4. Tampering a block breaks the hash chain")
print("  5. Our validator catches the tamper automatically")
print()
print("  Phase 1 DONE ✅ — Ready for Phase 2 (Flask API)")
print()
