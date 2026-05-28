
from pydantic import BaseModel, ConfigDict, Field

from schemas.basic_schema import UserBasicSchema, AuthTokenBasicSchema

class RegisterRequestSchema(BaseModel):
    """Register new user request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    email: str = Field(..., description="Email address (format: email, max 255 chars, e.g., user@example.com)")
    password: str = Field(..., description="Password (min 6 chars, e.g., ********)")
class RegisterResponseDataSchema(BaseModel):
    """Register response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    user: UserBasicSchema = Field(..., description="User information")
    token: AuthTokenBasicSchema = Field(..., description="Authentication token")
class LoginRequestSchema(BaseModel):
    """Login user request schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    email: str = Field(..., description="Email address (format: email, e.g., user@example.com)")
    password: str = Field(..., description="Password (e.g., ********)")
class LoginResponseDataSchema(BaseModel):
    """Login response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    user: UserBasicSchema = Field(..., description="User information")
    token: AuthTokenBasicSchema = Field(..., description="Authentication token")