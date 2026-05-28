from typing import Optional

from all_enums import StorageCategoryEnum
from pydantic import BaseModel, ConfigDict, Field

class UploadFileResponseDataSchema(BaseModel):
    """Upload file response data schema - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    file_url: str = Field(
        ...,
        description="Permanent static URL (format: /static/{category}/{filename}), e.g. /static/uploads/avatar_10001.jpg",
    )
    filename: str = Field(..., description="Original filename, e.g. avatar.jpg")
    content_type: str = Field(..., description="MIME type, e.g. image/jpeg")
    file_size: int = Field(..., description="File size (unit: bytes), e.g. 51200")
class UploadFileRequestSchema(BaseModel):
    """Upload file request schema (multipart/form-data) - ENDPOINT-SPECIFIC."""
    model_config = ConfigDict(arbitrary_types_allowed=True)
    category: Optional[StorageCategoryEnum] = Field(
        StorageCategoryEnum.AVATAR,
        description="Storage category (enum: AVATAR|AUDIO, default: AVATAR), e.g. AVATAR",
    )