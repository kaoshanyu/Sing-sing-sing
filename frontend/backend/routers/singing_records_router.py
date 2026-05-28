
from all_enums import StorageCategoryEnum
from fastapi import APIRouter, Depends, Path, UploadFile, File, Form
from result_response import ApiResponse, ApiResponseModel, create_not_found_error, create_permission_error, create_param_format_error, create_business_rule_error
from sqlalchemy.orm import Session

from database import get_db
from depends.auth import get_current_user
from depends.storage import save_uploaded_file
from models import UserModel
from schemas.api.singing_records_schema import (
CreateSingingRecordResponseDataSchema,
GetSingingRecordResponseDataSchema,
)
from schemas.basic_schema import SyllableFeedbackItemBasicSchema, SingingFeedbackBasicSchema
from services.files_service import FilesService
from services.singing_records_service import SingingRecordsService
from services.songs_service import SongsService

router = APIRouter(prefix="/singing-records", tags=["singing_records"])
@router.post("")
async def create_record(
    song_id: int = Form(..., description="Song ID (big integer, e.g. 10001)"),
    audio_file: UploadFile = File(..., description="WAV audio recording (max size: 10MB)"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> ApiResponseModel[CreateSingingRecordResponseDataSchema]:
    song_result = await SongsService.get_song_by_id(
        db=db,
        song_id=song_id
    )
    if not song_result.is_success:
        return ApiResponse.error(song_result.error)
    if song_result.data is None:
        return ApiResponse.error(create_not_found_error("Song", song_id))
    song = song_result.data
    if not audio_file.filename or not audio_file.filename.lower().endswith('.wav'):
        return ApiResponse.error(create_param_format_error("audio_file", "WAV format"))
    try:
        file_metadata = await save_uploaded_file(audio_file, StorageCategoryEnum.AUDIO)
        audio_url = file_metadata["file_url"]
    except Exception as e:
        return ApiResponse.error(create_business_rule_error(str(e)))
    analysis_result = await FilesService.analyze_pitch_accuracy(
        file_path=file_metadata["file_path"],
        reference_melody=song.reference_melody
    )
    if not analysis_result.is_success:
        return ApiResponse.error(analysis_result.error)
    analysis_data = analysis_result.data
    create_result = await SingingRecordsService.create_singing_record(
        db=db,
        user_id=current_user.user_id,
        song_id=song_id,
        audio_url=audio_url,
        score=analysis_data["score"],
        stars_earned=analysis_data["stars_earned"],
        feedback_data=analysis_data["feedback_data"]
    )
    if not create_result.is_success:
        return ApiResponse.error(create_result.error)
    record = create_result.data
    syllable_feedback_list = [
        SyllableFeedbackItemBasicSchema(
            syllable_index=item.syllable_index,
            expected_note=item.expected_note,
            detected_note=item.detected_note,
            deviation_cents=item.deviation_cents,
            accuracy_level=item.accuracy_level
        )
        for item in record.feedback_data.syllables
    ]
    feedback_schema = SingingFeedbackBasicSchema(
        syllables=syllable_feedback_list,
        overall_pitch_accuracy=record.feedback_data.overall_pitch_accuracy
    )
    response_data = CreateSingingRecordResponseDataSchema(
        record_id=record.record_id,
        user_id=record.user_id,
        song_id=record.song_id,
        audio_url=record.audio_url,
        score=record.score,
        stars_earned=record.stars_earned,
        feedback_data=feedback_schema,
        created_at=record.created_at
    )
    return ApiResponse.success(data=response_data, detail="Recording analyzed")
@router.get("/{record_id}")
async def get_record(
    record_id: int = Path(..., description="Record ID (big integer, e.g. 10001)"),
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_user)
) -> ApiResponseModel[GetSingingRecordResponseDataSchema]:
    result = await SingingRecordsService.get_singing_record(
        db=db,
        record_id=record_id
    )
    if not result.is_success:
        return ApiResponse.error(result.error)
    if result.data is None:
        return ApiResponse.error(create_not_found_error("Record", record_id))
    record = result.data
    if record.user_id != current_user.user_id:
        return ApiResponse.error(create_permission_error("access this record"))
    syllable_feedback_list = [
        SyllableFeedbackItemBasicSchema(
            syllable_index=item.syllable_index,
            expected_note=item.expected_note,
            detected_note=item.detected_note,
            deviation_cents=item.deviation_cents,
            accuracy_level=item.accuracy_level
        )
        for item in record.feedback_data.syllables
    ]
    feedback_schema = SingingFeedbackBasicSchema(
        syllables=syllable_feedback_list,
        overall_pitch_accuracy=record.feedback_data.overall_pitch_accuracy
    )
    response_data = GetSingingRecordResponseDataSchema(
        record_id=record.record_id,
        user_id=record.user_id,
        song_id=record.song_id,
        audio_url=record.audio_url,
        score=record.score,
        stars_earned=record.stars_earned,
        feedback_data=feedback_schema,
        created_at=record.created_at
    )
    return ApiResponse.success(data=response_data, detail="Record retrieved")