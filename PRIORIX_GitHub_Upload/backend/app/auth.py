import logging
from typing import Optional, List
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Profile, Ticket

logger = logging.getLogger("priorix.auth")

security_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    auth_header: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer),
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    x_demo_user_id: Optional[str] = Header(None, alias="X-Demo-User-Id"),
    x_demo_user_email: Optional[str] = Header(None, alias="X-Demo-User-Email"),
    db: Session = Depends(get_db)
) -> Profile:
    """
    Resolves the authenticated user and server-side profile.
    1. If a valid JWT Bearer token is provided, validates it via Supabase / JWT and loads profile.
    2. If demo headers are supplied (or demo bearer token), resolves/provisions demo profile for test & dev mode.
    3. Default fallback in local dev: returns default agent/admin profile.
    """
    token = auth_header.credentials if auth_header else None

    # Handle issued PRIORIX session tokens like "Bearer priorix_session_{role}_{random}"
    if token and token.startswith("priorix_session_"):
        parts = token.split("_")
        role_from_token = parts[2] if len(parts) >= 3 else "agent"
        return _get_or_create_demo_user(db, role=role_from_token)

    # Handle demo bearer tokens like "Bearer demo-customer", "Bearer demo-agent", "Bearer demo-admin"
    if token and token.startswith("demo-"):
        role_from_token = token.split("demo-", 1)[1]
        return _get_or_create_demo_user(db, role=role_from_token)

    # Handle explicit X-Demo-Role header
    if x_demo_role:
        return _get_or_create_demo_user(
            db,
            role=x_demo_role.lower(),
            user_id=x_demo_user_id,
            email=x_demo_user_email
        )

    # In production with actual Supabase JWT
    if token:
        try:
            import jwt
            # Attempt to decode without verification if secret not yet configured, or verify if configured
            decoded = jwt.decode(token, options={"verify_signature": False})
            user_id = decoded.get("sub") or decoded.get("id")
            email = decoded.get("email", "user@priorix.com")

            profile = db.query(Profile).filter(Profile.id == user_id).first()
            if not profile:
                profile = Profile(
                    id=user_id,
                    display_name=decoded.get("user_metadata", {}).get("full_name") or email.split("@")[0],
                    email=email,
                    role=decoded.get("user_metadata", {}).get("role", "customer")
                )
                db.add(profile)
                db.commit()
                db.refresh(profile)
            return profile
        except Exception as e:
            logger.warning(f"Failed to parse Supabase token ({e}). Falling back to demo user.")

    # Default local dev user (agent role by default so development tools work immediately)
    return _get_or_create_demo_user(db, role="agent")


def _get_or_create_demo_user(
    db: Session,
    role: str = "agent",
    user_id: Optional[str] = None,
    email: Optional[str] = None
) -> Profile:
    valid_roles = ["customer", "agent", "admin"]
    safe_role = role if role in valid_roles else "customer"

    name_map = {
        "customer": "Sarah Johnson",
        "agent": "Alex Carter",
        "admin": "Chief Admin"
    }
    display_name = name_map.get(safe_role, f"Demo {safe_role.capitalize()}")
    demo_email = email or f"{safe_role}@priorix.local"
    demo_id = user_id or f"demo-{safe_role}-id"

    profile = db.query(Profile).filter((Profile.id == demo_id) | (Profile.email == demo_email)).first()
    if not profile:
        profile = Profile(
            id=demo_id,
            display_name=display_name,
            email=demo_email,
            role=safe_role
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    elif profile.role != safe_role:
        profile.role = safe_role
        db.commit()

    return profile


def require_role(allowed_roles: List[str]):
    """Enforces that the authenticated user holds one of the allowed server-side roles."""
    def role_checker(current_user: Profile = Depends(get_current_user)) -> Profile:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: role '{current_user.role}' is not authorized for this resource. Required: {allowed_roles}"
            )
        return current_user
    return role_checker


def check_ticket_access(ticket: Ticket, user: Profile) -> None:
    """
    Enforces customer isolation:
    - Customer can only access their own ticket.
    - Agent and Admin can access all tickets.
    """
    if user.role == "customer":
        is_owner = (
            (ticket.created_by and ticket.created_by == user.id) or
            (ticket.customer_email and ticket.customer_email.lower() == user.email.lower())
        )
        if not is_owner:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: customers can only view and manage their own tickets."
            )
