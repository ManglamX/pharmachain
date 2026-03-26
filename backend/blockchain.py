"""
=============================================================
  PharmaChain — Core Blockchain Engine
=============================================================
  BLOCKCHAIN BASICS (read this first!):
  
  A blockchain is just a LIST OF BLOCKS where:
    - Each block stores some DATA (e.g. a drug shipment record)
    - Each block has a FINGERPRINT called a "hash"
    - Each block also stores the FINGERPRINT of the PREVIOUS block
  
  This creates a CHAIN. If you change any block's data:
    - Its fingerprint changes
    - But the NEXT block still has the OLD fingerprint stored
    - So the chain is BROKEN — tamper detected! ✓
  
  Think of it like: each page of a book has a photo of the
  previous page's content. Change one page and ALL the photos
  after it become wrong.
=============================================================
"""

import hashlib      # Built-in Python library for hashing
import json         # To convert data to a string for hashing
from datetime import datetime  # For timestamps


# ─────────────────────────────────────────────
#  WHAT IS A HASH?
#  A hash is a fixed-length "fingerprint" of data.
#  SHA-256 takes ANY input and outputs a 64-character hex string.
#  Same input → ALWAYS same output.
#  Change even 1 character → COMPLETELY different output.
#  Example:
#    "hello"  → 2cf24db...
#    "hellO"  → 185f8db...  (totally different!)
#  You CANNOT reverse a hash to get the original data.
# ─────────────────────────────────────────────

def calculate_hash(data: dict) -> str:
    """
    Takes a dictionary and returns its SHA-256 hash (fingerprint).
    
    Steps:
      1. Convert dict → JSON string (so it's a consistent text)
      2. Encode to bytes (SHA-256 needs bytes)
      3. Run SHA-256 algorithm
      4. Return the hex string result
    """
    # json.dumps with sort_keys ensures the order of keys
    # doesn't affect the hash (dict order can vary)
    data_string = json.dumps(data, sort_keys=True)
    
    # encode() converts string → bytes (sha256 needs bytes)
    # hexdigest() returns the hash as a readable hex string
    return hashlib.sha256(data_string.encode()).hexdigest()


# ─────────────────────────────────────────────
#  THE BLOCK CLASS
#  One "block" in our chain. Think of it as one
#  record/entry in a ledger.
# ─────────────────────────────────────────────

class Block:
    """
    Represents a single block in the PharmaChain blockchain.
    
    Each block stores:
      - index        : Position in the chain (0, 1, 2, ...)
      - timestamp    : When this block was created
      - data         : The actual drug/transaction information
      - previous_hash: Fingerprint of the block BEFORE this one
      - hash         : This block's OWN fingerprint (calculated from all above)
    """
    
    def __init__(self, index: int, data: dict, previous_hash: str):
        self.index         = index
        self.timestamp     = datetime.utcnow().isoformat() + "Z"  # UTC time in ISO format
        self.data          = data           # The actual drug transaction data
        self.previous_hash = previous_hash  # Link to previous block's hash
        self.hash          = self._compute_hash()  # This block's own fingerprint
    
    def _compute_hash(self) -> str:
        """
        Computes this block's hash from ALL its fields.
        
        We include every field so that changing ANYTHING
        (timestamp, data, previous_hash, index) will produce
        a completely different hash.
        """
        block_content = {
            "index"         : self.index,
            "timestamp"     : self.timestamp,
            "data"          : self.data,
            "previous_hash" : self.previous_hash,
        }
        return calculate_hash(block_content)
    
    def to_dict(self) -> dict:
        """
        Returns this block as a plain dictionary.
        Useful for sending over API or saving to a file.
        """
        return {
            "index"         : self.index,
            "timestamp"     : self.timestamp,
            "data"          : self.data,
            "previous_hash" : self.previous_hash,
            "hash"          : self.hash,
        }
    
    def __repr__(self):
        return (
            f"Block(index={self.index}, "
            f"hash={self.hash[:10]}..., "
            f"prev={self.previous_hash[:10]}...)"
        )


# ─────────────────────────────────────────────
#  THE BLOCKCHAIN CLASS
#  A collection of Blocks, chained together.
#  This is the main "ledger".
# ─────────────────────────────────────────────

class Blockchain:
    """
    The main PharmaChain blockchain.
    
    Manages:
      - A list of Block objects (the chain)
      - Adding new blocks
      - Validating the entire chain
      - Simulating tampering (for demo purposes)
    """
    
    def __init__(self):
        self.chain: list[Block] = []  # The list of all blocks
        self._create_genesis_block()  # Every blockchain starts with a "genesis" block
    
    def _create_genesis_block(self):
        """
        The Genesis Block is block #0. It's the very first block.
        It has no previous block, so its previous_hash is "0" by convention.
        Think of it as the "foundation" of the chain.
        """
        genesis_data = {
            "event"       : "GENESIS",
            "description" : "PharmaChain initialized — the root of the chain",
            "created_by"  : "System",
        }
        genesis_block = Block(index=0, data=genesis_data, previous_hash="0")
        self.chain.append(genesis_block)
        print(f"[PharmaChain] ✅ Genesis block created. Hash: {genesis_block.hash[:20]}...")
    
    def get_latest_block(self) -> Block:
        """Returns the most recently added block."""
        return self.chain[-1]
    
    def add_block(self, data: dict) -> Block:
        """
        Adds a new block to the chain.
        
        The key step: we take the PREVIOUS BLOCK'S HASH and
        store it inside the new block. This is what "chains" them.
        """
        previous_block = self.get_latest_block()
        new_block = Block(
            index         = len(self.chain),         # Next index
            data          = data,
            previous_hash = previous_block.hash,     # ← THE CHAIN LINK
        )
        self.chain.append(new_block)
        print(f"[PharmaChain] ➕ Block #{new_block.index} added. Hash: {new_block.hash[:20]}...")
        return new_block
    
    def validate_chain(self) -> dict:
        """
        Validates the ENTIRE chain by checking two things for each block:
        
          1. SELF-INTEGRITY: Re-compute the block's hash from its data.
             If it doesn't match the stored hash → data was tampered.
          
          2. CHAIN-INTEGRITY: Check that this block's `previous_hash`
             matches the ACTUAL hash of the previous block.
             If it doesn't → someone broke the chain link.
        
        Returns a dict with:
          - is_valid: True/False
          - errors  : List of problems found
          - details : Per-block status
        """
        errors  = []
        details = []
        
        for i in range(1, len(self.chain)):  # Start at 1 (skip genesis, it has no prev)
            current  = self.chain[i]
            previous = self.chain[i - 1]
            
            block_status = {
                "index"          : current.index,
                "self_valid"     : True,
                "chain_valid"    : True,
                "error"          : None,
            }
            
            # ── CHECK 1: Self-integrity ──────────────────────────
            # Re-calculate the hash from current block's data
            recalculated_hash = current._compute_hash()
            if recalculated_hash != current.hash:
                block_status["self_valid"] = False
                block_status["error"] = (
                    f"Block #{i} data was TAMPERED! "
                    f"Stored hash: {current.hash[:12]}... "
                    f"but computed: {recalculated_hash[:12]}..."
                )
                errors.append(block_status["error"])
            
            # ── CHECK 2: Chain-integrity ─────────────────────────
            # The current block's 'previous_hash' must equal
            # the ACTUAL hash of the block before it
            if current.previous_hash != previous.hash:
                block_status["chain_valid"] = False
                block_status["error"] = (
                    f"Block #{i} chain BROKEN! "
                    f"previous_hash field: {current.previous_hash[:12]}... "
                    f"but Block #{i-1} actual hash: {previous.hash[:12]}..."
                )
                errors.append(block_status["error"])
            
            details.append(block_status)
        
        return {
            "is_valid"    : len(errors) == 0,
            "total_blocks": len(self.chain),
            "errors"      : errors,
            "details"     : details,
        }
    
    def tamper_block(self, index: int, new_data: dict) -> dict:
        """
        SIMULATES TAMPERING for demo/educational purposes.
        
        This directly modifies a block's data WITHOUT updating its hash.
        This is what a real attacker would do — they change the data
        but can't re-chain everything without being detected.
        
        After calling this, validate_chain() will catch it.
        """
        if index <= 0 or index >= len(self.chain):
            return {"success": False, "error": "Invalid block index (cannot tamper genesis block)"}
        
        target_block = self.chain[index]
        old_data     = target_block.data.copy()
        
        # Directly overwrite the data (bypassing normal add_block flow)
        target_block.data = new_data
        # NOTE: We do NOT update target_block.hash here.
        # The hash still reflects the OLD data — mismatch = tamper detected!
        
        print(f"[PharmaChain] ⚠️  Block #{index} TAMPERED (for demo). Chain is now invalid.")
        return {
            "success"  : True,
            "block"    : index,
            "old_data" : old_data,
            "new_data" : new_data,
            "note"     : "Hash NOT updated. validate_chain() will now detect this tampering.",
        }
    
    def get_chain_as_list(self) -> list[dict]:
        """Returns the entire chain as a list of dictionaries."""
        return [block.to_dict() for block in self.chain]
    
    def get_block(self, index: int) -> dict | None:
        """Returns a single block by index, or None if not found."""
        if 0 <= index < len(self.chain):
            return self.chain[index].to_dict()
        return None
    
    def __len__(self):
        return len(self.chain)
    
    def __repr__(self):
        return f"Blockchain(blocks={len(self.chain)}, latest_hash={self.get_latest_block().hash[:16]}...)"
