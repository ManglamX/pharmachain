"""
=============================================================
  PharmaChain — Drug Data Models
=============================================================
  These are helper functions to create STANDARDIZED data
  dictionaries for each type of event in the drug supply chain.
  
  Think of these as "forms" — each event type has specific
  fields that must be filled in.
  
  Event types:
    1. BATCH_CREATED   — Manufacturer creates a new drug batch
    2. TRANSFERRED     — Ownership passes to next actor
    3. RECEIVED        — Recipient confirms receiving the batch
    4. DISPENSED       — Pharmacy dispenses to patient
    5. FLAGGED         — Reported as suspicious/tampered
=============================================================
"""

from datetime import datetime

# ── Actor types in the supply chain ────────────────────────
ACTORS = ["Manufacturer", "Distributor", "Wholesaler", "Pharmacy", "Hospital", "Patient"]

# ── Event types ─────────────────────────────────────────────
EVENT_BATCH_CREATED  = "BATCH_CREATED"
EVENT_TRANSFERRED    = "TRANSFERRED"
EVENT_RECEIVED       = "RECEIVED"
EVENT_DISPENSED      = "DISPENSED"
EVENT_FLAGGED        = "FLAGGED"


def make_batch_created(
    batch_id      : str,
    drug_name     : str,
    manufacturer  : str,
    quantity      : int,
    manufacture_date: str,
    expiry_date   : str,
    location      : str = "Unknown",
) -> dict:
    """
    Called when a drug batch is first created at the manufacturing plant.
    This becomes the FIRST block in that batch's chain entry.
    """
    return {
        "event"           : EVENT_BATCH_CREATED,
        "batch_id"        : batch_id,
        "drug_name"       : drug_name,
        "manufacturer"    : manufacturer,
        "quantity"        : quantity,
        "manufacture_date": manufacture_date,
        "expiry_date"     : expiry_date,
        "location"        : location,
        "timestamp"       : datetime.utcnow().isoformat() + "Z",
    }


def make_transfer(
    batch_id      : str,
    drug_name     : str,
    from_actor    : str,
    from_location : str,
    to_actor      : str,
    to_location   : str,
    quantity      : int,
    notes         : str = "",
) -> dict:
    """
    Called when ownership transfers from one party to another.
    E.g., Manufacturer ships to Distributor.
    """
    return {
        "event"        : EVENT_TRANSFERRED,
        "batch_id"     : batch_id,
        "drug_name"    : drug_name,
        "from_actor"   : from_actor,
        "from_location": from_location,
        "to_actor"     : to_actor,
        "to_location"  : to_location,
        "quantity"     : quantity,
        "notes"        : notes,
        "timestamp"    : datetime.utcnow().isoformat() + "Z",
    }


def make_dispensed(
    batch_id     : str,
    drug_name    : str,
    pharmacy     : str,
    patient_id   : str,   # anonymized patient identifier
    quantity     : int,
    prescription : str = "",
) -> dict:
    """
    Called when a pharmacy dispenses the drug to a patient.
    Final step in the chain.
    """
    return {
        "event"       : EVENT_DISPENSED,
        "batch_id"    : batch_id,
        "drug_name"   : drug_name,
        "pharmacy"    : pharmacy,
        "patient_id"  : patient_id,
        "quantity"    : quantity,
        "prescription": prescription,
        "timestamp"   : datetime.utcnow().isoformat() + "Z",
    }


def make_flagged(
    batch_id : str,
    drug_name: str,
    flagged_by: str,
    reason   : str,
) -> dict:
    """
    Called when a batch is reported as suspicious or potentially counterfeit.
    """
    return {
        "event"     : EVENT_FLAGGED,
        "batch_id"  : batch_id,
        "drug_name" : drug_name,
        "flagged_by": flagged_by,
        "reason"    : reason,
        "timestamp" : datetime.utcnow().isoformat() + "Z",
    }
