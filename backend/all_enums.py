from enum import StrEnum

class ModuleTypeEnum(StrEnum):
    """Training module type enumeration for ear training sessions."""
    PITCH_DISCRIMINATION = "PITCH_DISCRIMINATION"
    INTERVAL_DICTATION = "INTERVAL_DICTATION"
    RHYTHM_TRAINING = "RHYTHM_TRAINING"
    MELODY_DICTATION = "MELODY_DICTATION"
    SINGING_PRACTICE = "SINGING_PRACTICE"
class DifficultyEnum(StrEnum):
    """Difficulty level enumeration for training modules and exercises."""
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"
class SessionStatusEnum(StrEnum):
    """Training session status enumeration."""
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
class AccuracyLevelEnum(StrEnum):
    """Accuracy level enumeration for evaluating user performance."""
    ACCURATE = "ACCURATE"
    SLIGHTLY_OFF = "SLIGHTLY_OFF"
    OFF = "OFF"
class StorageCategoryEnum(StrEnum):
    """Storage category enumeration for file uploads."""
    AVATAR = "AVATAR"
    AUDIO = "AUDIO"
class MessageRoleEnum(StrEnum):
    """Message role enumeration for chat or conversation messages."""
    USER = "USER"
    ASSISTANT = "ASSISTANT"