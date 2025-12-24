import random
import string
from datetime import datetime, timedelta
from typing import Optional


def generate_otp() -> str:
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))


def get_otp_expiry() -> datetime:
    """Get OTP expiry time (10 minutes from now)"""
    return datetime.utcnow() + timedelta(minutes=10)


async def store_otp(db, email: str, otp: str):
    """Store OTP in MongoDB with TTL"""
    otp_collection = db["otps"]
    
    # Delete existing OTP for this email
    await otp_collection.delete_one({"email": email})
    
    # Create new OTP document
    otp_doc = {
        "email": email,
        "otp": otp,
        "attempts": 0,
        "created_at": datetime.utcnow(),
        "expires_at": get_otp_expiry()
    }
    
    await otp_collection.insert_one(otp_doc)
    
    # Create TTL index if it doesn't exist
    await otp_collection.create_index("created_at", expireAfterSeconds=600)  # 10 minutes
    
    return True


async def verify_otp(db, email: str, otp: str) -> dict:
    """Verify OTP and handle attempts"""
    otp_collection = db["otps"]
    
    otp_doc = await otp_collection.find_one({"email": email})
    
    if not otp_doc:
        return {"success": False, "message": "OTP not found or expired"}
    
    # Check if expired
    if datetime.utcnow() > otp_doc["expires_at"]:
        await otp_collection.delete_one({"email": email})
        return {"success": False, "message": "OTP has expired"}
    
    # Check if OTP matches
    if otp_doc["otp"] == otp:
        await otp_collection.delete_one({"email": email})
        return {"success": True, "message": "OTP verified successfully"}
    
    # Increment attempts
    attempts = otp_doc.get("attempts", 0) + 1
    
    if attempts >= 3:
        await otp_collection.delete_one({"email": email})
        return {
            "success": False,
            "message": "Maximum attempts reached. Please request a new OTP.",
            "max_attempts_reached": True
        }
    
    await otp_collection.update_one(
        {"email": email},
        {"$set": {"attempts": attempts}}
    )
    
    return {
        "success": False,
        "message": f"Invalid OTP. {3 - attempts} attempts remaining.",
        "attempts_remaining": 3 - attempts
    }
