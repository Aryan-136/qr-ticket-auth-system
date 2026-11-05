import pytest
import re

def validate_token_format(token: str) -> bool:
    """Validate that token follows standard prefix and zero-padded sequence."""
    pattern = r"^THMFOOD\d{3,}$"
    return bool(re.match(pattern, token))

def process_checkin(registry: dict, token: str) -> dict:
    """Simulate atomic verification and replay prevention."""
    if token not in registry:
        return {"status": "INVALID_TOKEN", "code": 404}
    
    if registry[token]["redeemed"]:
        return {"status": "ALREADY_USED", "code": 409, "attendee": registry[token]["name"]}
    
    registry[token]["redeemed"] = True
    return {"status": "SUCCESS", "code": 200, "attendee": registry[token]["name"]}

def test_token_format():
    assert validate_token_format("THMFOOD001") == True
    assert validate_token_format("THMFOOD999") == True
    assert validate_token_format("INVALID123") == False
    assert validate_token_format("THMFOOD") == False

def test_single_use_admission():
    db = {
        "THMFOOD001": {"name": "Aryan Pandya", "redeemed": False}
    }
    
    # First scan -> Must pass
    res1 = process_checkin(db, "THMFOOD001")
    assert res1["status"] == "SUCCESS"
    assert res1["code"] == 200
    
    # Second scan -> Must be rejected with 409 Conflict
    res2 = process_checkin(db, "THMFOOD001")
    assert res2["status"] == "ALREADY_USED"
    assert res2["code"] == 409
