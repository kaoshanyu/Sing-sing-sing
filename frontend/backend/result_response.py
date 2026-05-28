from enum import Enum
from typing import TypeVar, Generic, Optional, Any

from pydantic import BaseModel

T = TypeVar('T')
class ErrorCode(Enum):
    """Business status codes from API documentation."""
    SUCCESS = 0
    GENERAL_ERROR = 1000
    OPERATION_FAILED = 1001
    DATA_FORMAT_ERROR = 1002
    OPERATION_TIMEOUT = 1003
    AUTHENTICATION_FAILED = 2000
    NO_CREDENTIALS = 2001
    INVALID_CREDENTIALS = 2002
    CREDENTIALS_EXPIRED = 2003
    INSUFFICIENT_PERMISSIONS = 2004
    ACCOUNT_DISABLED = 2005
    VALIDATION_FAILED = 3000
    REQUIRED_PARAM_MISSING = 3001
    PARAM_FORMAT_ERROR = 3002
    PARAM_OUT_OF_RANGE = 3003
    INVALID_PARAM_COMBINATION = 3004
    BUSINESS_ERROR = 4000
    RESOURCE_NOT_FOUND = 4001
    RESOURCE_ALREADY_EXISTS = 4002
    RESOURCE_STATE_ERROR = 4003
    BUSINESS_RULE_FAILED = 4004
    QUOTA_EXHAUSTED = 4005
    RATE_LIMIT_EXCEEDED = 4006
    INTERNAL_ERROR = 5000
    DATABASE_ERROR = 5001
    EXTERNAL_SERVICE_ERROR = 5002
    FILE_OPERATION_ERROR = 5003
    NETWORK_ERROR = 5004
    SERVICE_UNAVAILABLE = 5005
class Error:
    """Error information container."""
    def __init__(self, code: ErrorCode, message: str, details: Any = None):
        self.code = code
        self.message = message
        self.details = details
class Result(Generic[T]):
    """Generic result wrapper for operation outcomes."""
    def __init__(self, data: T = None, error: Optional[Error] = None):
        self._data = data
        self._error = error
    @property
    def is_success(self) -> bool:
        return self._error is None
    @property
    def data(self) -> Optional[T]:
        return self._data
    @property
    def error(self) -> Optional[Error]:
        return self._error
    @classmethod
    def success(cls, data: T = None) -> 'Result[T]':
        return cls(data=data, error=None)
    @classmethod
    def from_error(cls, error: Error) -> 'Result[T]':
        return cls(data=None, error=error)
class ApiResponseModel(BaseModel, Generic[T]):
    """API response model matching response_format structure."""
    code: int
    detail: str
    data: Optional[Any] = None
class ApiResponse:
    """Static factory for creating API responses."""
    @staticmethod
    def success(data: Any = None, detail: str = "Success") -> ApiResponseModel:
        return ApiResponseModel(code=0, detail=detail, data=data)
    @staticmethod
    def error(error: Error) -> ApiResponseModel:
        return ApiResponseModel(code=error.code.value, detail=error.message, data=None)
def create_validation_error(message: str, field: str = None) -> Error:
    """Create a parameter validation failed error."""
    details = {"field": field} if field else None
    return Error(
        code=ErrorCode.VALIDATION_FAILED,
        message=message,
        details=details
    )
def create_required_param_error(param_name: str) -> Error:
    """Create a required parameter missing error."""
    return Error(
        code=ErrorCode.REQUIRED_PARAM_MISSING,
        message=f"Required parameter missing: {param_name}",
        details={"param": param_name}
    )
def create_param_format_error(param_name: str, expected_format: str = None) -> Error:
    """Create a parameter format error."""
    msg = f"Invalid format for parameter: {param_name}"
    if expected_format:
        msg += f" (expected: {expected_format})"
    return Error(
        code=ErrorCode.PARAM_FORMAT_ERROR,
        message=msg,
        details={"param": param_name, "expected_format": expected_format}
    )
def create_not_found_error(resource: str, resource_id: Any = None) -> Error:
    """Create a resource not found error."""
    msg = f"{resource} not found"
    if resource_id is not None:
        msg += f": {resource_id}"
    return Error(
        code=ErrorCode.RESOURCE_NOT_FOUND,
        message=msg,
        details={"resource": resource, "id": resource_id}
    )
def create_resource_exists_error(resource: str, identifier: Any = None) -> Error:
    """Create a resource already exists error."""
    msg = f"{resource} already exists"
    if identifier is not None:
        msg += f": {identifier}"
    return Error(
        code=ErrorCode.RESOURCE_ALREADY_EXISTS,
        message=msg,
        details={"resource": resource, "identifier": identifier}
    )
def create_resource_state_error(resource: str, current_state: str = None) -> Error:
    """Create a resource state does not allow operation error."""
    msg = f"{resource} state does not allow this operation"
    if current_state:
        msg += f" (current state: {current_state})"
    return Error(
        code=ErrorCode.RESOURCE_STATE_ERROR,
        message=msg,
        details={"resource": resource, "current_state": current_state}
    )
def create_auth_error(message: str = "Authentication failed") -> Error:
    """Create an authentication failed error."""
    return Error(
        code=ErrorCode.AUTHENTICATION_FAILED,
        message=message
    )
def create_no_credentials_error(message: str = "Authentication required") -> Error:
    """Create a no credentials provided error."""
    return Error(
        code=ErrorCode.NO_CREDENTIALS,
        message=message
    )
def create_permission_error(action: str = None) -> Error:
    """Create an insufficient permissions error."""
    msg = "Access denied"
    if action:
        msg += f" for action: {action}"
    return Error(
        code=ErrorCode.INSUFFICIENT_PERMISSIONS,
        message=msg,
        details={"action": action}
    )
def create_business_rule_error(message: str, rule: str = None) -> Error:
    """Create a business rule validation failed error."""
    return Error(
        code=ErrorCode.BUSINESS_RULE_FAILED,
        message=message,
        details={"rule": rule} if rule else None
    )
def create_quota_error(resource: str = None) -> Error:
    """Create a quota exhausted error."""
    msg = "Quota exhausted"
    if resource:
        msg += f": {resource}"
    return Error(
        code=ErrorCode.QUOTA_EXHAUSTED,
        message=msg,
        details={"resource": resource}
    )
def create_service_unavailable_error(service: str = None) -> Error:
    """Create a service temporarily unavailable error."""
    msg = "Service temporarily unavailable"
    if service:
        msg += f": {service}"
    return Error(
        code=ErrorCode.SERVICE_UNAVAILABLE,
        message=msg,
        details={"service": service}
    )
def create_internal_error(message: str = "Internal server error") -> Error:
    """Create an internal system error."""
    return Error(
        code=ErrorCode.INTERNAL_ERROR,
        message=message
    )