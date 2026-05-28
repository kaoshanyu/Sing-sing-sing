
from pydantic import BaseModel, ConfigDict, Field

from schemas.basic_schema import SingingRecordBasicSchema

class CreateSingingRecordResponseDataSchema(SingingRecordBasicSchema):
    """Create singing record response data schema - ENDPOINT-SPECIFIC.
    Returns the newly created singing record with pitch analysis results.
    Inherits all fields from SingingRecordBasicSchema.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
class CreateSingingRecordRequestSchema(BaseModel):
    """Create singing record request schema - ENDPOINT-SPECIFIC.
    Represents the form-data fields for uploading a singing recording.
    Note: audio_file (WAV, max 10MB) is handled as FastAPI UploadFile at the router layer.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
    song_id: int = Field(..., description="Song ID (big integer, e.g. 10001)")
class SingingRecordPathParamsSchema(BaseModel):
    """Singing record path parameters schema - ENDPOINT-SPECIFIC.
    Path parameters for GET /singing-records/{record_id}.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
    record_id: int = Field(..., description="Record ID (big integer, e.g. 10001)")
class GetSingingRecordResponseDataSchema(SingingRecordBasicSchema):
    """Get singing record response data schema - ENDPOINT-SPECIFIC.
    Returns the singing record details with score and per-syllable feedback.
    Inherits all fields from SingingRecordBasicSchema.
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)