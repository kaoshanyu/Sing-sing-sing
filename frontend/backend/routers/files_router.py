from typing import Optional

from all_enums import StorageCategoryEnum
from fastapi import APIRouter, Depends, UploadFile, File, Form
from result_response import ApiResponse, ApiResponseModel
from sqlalchemy.orm import Session

from database import get_db
from depends.auth import get_current_user
from models import UserModel
from schemas.api.files_schema import (
UploadFileResponseDataSchema,
)
from services.files_service import FilesService

router = APIRouter(prefix="/files", tags=["files"])
@router.post("")
async def upload_file(
    file: UploadFile = File(..., description="File to upload (max size: 10MB)"),
    category: Optional[StorageCategoryEnum] = Form(
        StorageCategoryEnum.AVATAR,
        description="Storage category (enum: AVATAR|AUDIO, default: AVATAR)"
    ),
    current_user: UserModel = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ApiResponseModel[UploadFileResponseDataSchema]:
    result = await FilesService.save_uploaded_file(
        file=file,
        category=category
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    file_metadata = result.data
    response_data = UploadFileResponseDataSchema(
        file_url=file_metadata.get("file_url", ""),
        filename=file_metadata.get("filename", ""),
        content_type=file_metadata.get("content_type", file.content_type or "application/octet-stream"),
        file_size=file_metadata.get("file_size", 0)
    )
    return ApiResponse.success(data=response_data, detail="File uploaded successfully")