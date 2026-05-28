"""Import question bank from JSON into the database using ORM.
Reads questionBank.v1.json and inserts into questionmodel table.
"""

import json
import logging
import os
from datetime import datetime, timezone

from database import get_db
from models import QuestionModel
from all_enums import ModuleTypeEnum, DifficultyEnum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MODULE_MAP = {
    "pitch": ModuleTypeEnum.PITCH_DISCRIMINATION,
    "interval": ModuleTypeEnum.INTERVAL_DICTATION,
    "sing": ModuleTypeEnum.SINGING_PRACTICE,
}

DIFFICULTY_MAP = {
    "L1": DifficultyEnum.EASY,
    "L2": DifficultyEnum.MEDIUM,
    "L3": DifficultyEnum.HARD,
}


def import_questions(db, json_path: str):
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])
    logger.info(f"Loaded {len(questions)} questions from {json_path}")

    # Check existing count
    existing = db.query(QuestionModel).count()
    logger.info(f"Existing questions in database: {existing}")

    if existing > 0:
        logger.info("Questions already exist, skipping import")
        return

    now = datetime.now(timezone.utc)
    inserted = 0

    for q in questions:
        module_id = q.get("moduleId", "")
        level = q.get("level", "L1")

        module_type = MODULE_MAP.get(module_id, ModuleTypeEnum.PITCH_DISCRIMINATION)
        difficulty = DIFFICULTY_MAP.get(level, DifficultyEnum.EASY)

        question_data = {
            "id": q["id"],
            "moduleId": module_id,
            "level": level,
            "type": q["type"],
            "title": q.get("title", ""),
            "prompt": q.get("prompt", ""),
            "audios": q.get("audios", {}),
            "options": q.get("options", []),
            "answer": q.get("answer", []),
            "skillTags": q.get("skillTags", []),
            "difficulty_score": q.get("difficulty", 1.0),
            "explain": q.get("explain", ""),
        }

        # T5 specific
        if "keyboardAudios" in q:
            question_data["keyboardAudios"] = q["keyboardAudios"]
        if "melodyNotes" in q:
            question_data["melodyNotes"] = q["melodyNotes"]

        # T6/T7 specific
        for field in ["target", "targetText", "targetDisplay", "targetMidiSequence"]:
            if field in q:
                question_data[field] = q[field]

        question = QuestionModel(
            module_type=module_type,
            question_data=question_data,
            difficulty=difficulty,
            created_at=now,
        )
        db.add(question)
        inserted += 1

        if inserted % 100 == 0:
            db.flush()
            logger.info(f"  Processed {inserted}/{len(questions)}")

    db.commit()
    logger.info(f"Successfully imported {inserted} questions")


def main():
    # Look for JSON relative to this script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(script_dir, "data", "questionBank.v1.json")

    # Support command-line argument: python seed_question_bank.py /path/to/file.json
    import sys
    if len(sys.argv) > 1:
        json_path = os.path.expanduser(sys.argv[1])

    if not os.path.exists(json_path):
        logger.error(f"Question bank not found at {json_path}")
        logger.error(f"Place questionBank.v1.json in backend/data/ or pass path as argument")
        return

    db = next(get_db())
    try:
        import_questions(db, json_path)
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to import questions: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
