"""System Initialization Module — creates PostgreSQL trigger functions and triggers for system data seeding and first-user admin promotion."""

import logging

from sqlalchemy import text

from database import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
def create_first_user_triggers(db):
    """Create PostgreSQL BEFORE/AFTER INSERT trigger functions and triggers on the usermodel table.
    When the first user registers (INSERT into usermodel):
    1. BEFORE INSERT trigger function: sets is_admin to true (admin promotion)
    2. AFTER INSERT trigger function: seeds system data (questions, songs) on first registration
    All logic lives inside the trigger function SQL — no Python-level ORM seed functions.
    Idempotent — drops existing triggers and functions before creating.
    """
    users_table = "usermodel"
    admin_column = "is_admin"
    admin_value = "true"
    db.execute(text(f"DROP TRIGGER IF EXISTS trg_first_user_admin_promotion ON {users_table}"))
    db.execute(text("DROP FUNCTION IF EXISTS fn_first_user_admin_promotion()"))
    db.execute(text(f"DROP TRIGGER IF EXISTS trg_first_user_system_seed ON {users_table}"))
    db.execute(text("DROP FUNCTION IF EXISTS fn_first_user_system_seed()"))
    logger.info("Dropped existing triggers and functions (if any)")
    db.execute(text(f"""
        CREATE FUNCTION fn_first_user_admin_promotion()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (SELECT COUNT(*) FROM {users_table}) = 0 THEN
                NEW.{admin_column} := {admin_value};
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    db.execute(text(f"""
        CREATE TRIGGER trg_first_user_admin_promotion
        BEFORE INSERT ON {users_table}
        FOR EACH ROW EXECUTE FUNCTION fn_first_user_admin_promotion();
    """))
    logger.info("Created BEFORE INSERT trigger function + trigger: fn_first_user_admin_promotion / trg_first_user_admin_promotion")
    db.execute(text(f"""
        CREATE FUNCTION fn_first_user_system_seed()
        RETURNS TRIGGER AS $$
        BEGIN
            IF (SELECT COUNT(*) FROM {users_table}) = 1 THEN
                -- System Entity: QuestionModel (questionmodel table)
                -- Seed data from backend_implementation_spec.json seed_data.Question
                INSERT INTO questionmodel (module_type, question_data, difficulty, created_at)
                VALUES
                    ('PITCH_DISCRIMINATION', '{{"note1": 60, "note2": 64, "answer": "higher"}}'::json, 'EASY', NOW()),
                    ('PITCH_DISCRIMINATION', '{{"note1": 67, "note2": 60, "answer": "lower"}}'::json, 'EASY', NOW()),
                    ('PITCH_DISCRIMINATION', '{{"note1": 60, "note2": 60, "answer": "same"}}'::json, 'EASY', NOW()),
                    ('PITCH_DISCRIMINATION', '{{"note1": 48, "note2": 55, "answer": "higher"}}'::json, 'MEDIUM', NOW()),
                    ('PITCH_DISCRIMINATION', '{{"note1": 72, "note2": 65, "answer": "lower"}}'::json, 'MEDIUM', NOW()),
                    ('INTERVAL_DICTATION', '{{"note1": 60, "note2": 62, "interval": "MAJOR_2ND"}}'::json, 'EASY', NOW()),
                    ('INTERVAL_DICTATION', '{{"note1": 60, "note2": 64, "interval": "MAJOR_3RD"}}'::json, 'EASY', NOW()),
                    ('INTERVAL_DICTATION', '{{"note1": 60, "note2": 65, "interval": "PERFECT_4TH"}}'::json, 'EASY', NOW()),
                    ('INTERVAL_DICTATION', '{{"note1": 60, "note2": 67, "interval": "PERFECT_5TH"}}'::json, 'MEDIUM', NOW()),
                    ('INTERVAL_DICTATION', '{{"note1": 60, "note2": 72, "interval": "PERFECT_OCTAVE"}}'::json, 'MEDIUM', NOW()),
                    ('RHYTHM_TRAINING', '{{"pattern": [1, 1, 1, 1], "time_signature": "4/4"}}'::json, 'EASY', NOW()),
                    ('RHYTHM_TRAINING', '{{"pattern": [1, 1, 0.5, 0.5, 1], "time_signature": "4/4"}}'::json, 'EASY', NOW()),
                    ('RHYTHM_TRAINING', '{{"pattern": [0.5, 0.5, 1, 0.5, 0.5, 1], "time_signature": "4/4"}}'::json, 'MEDIUM', NOW()),
                    ('MELODY_DICTATION', '{{"notes": [60, 62, 64, 65], "options": [["do", "re", "mi", "fa"], ["do", "mi", "so", "la"], ["re", "mi", "fa", "so"], ["mi", "fa", "so", "la"]]}}'::json, 'EASY', NOW()),
                    ('MELODY_DICTATION', '{{"notes": [60, 64, 67, 72], "options": [["do", "mi", "so", "do"], ["do", "re", "mi", "fa"], ["so", "la", "si", "do"], ["mi", "so", "si", "re"]]}}'::json, 'MEDIUM', NOW())
                ON CONFLICT DO NOTHING;
                -- System Entity: SongModel (songmodel table)
                -- Seed data from backend_implementation_spec.json seed_data.Song
                INSERT INTO songmodel (title, lyrics, reference_melody, difficulty, created_at)
                VALUES
                    ('小星星', '一闪一闪亮晶晶，满天都是小星星', '[60, 60, 67, 67, 69, 69, 67]'::json, 'EASY', NOW()),
                    ('生日快乐', '祝你生日快乐，祝你生日快乐', '[60, 60, 62, 60, 65, 64]'::json, 'EASY', NOW()),
                    ('两只老虎', '两只老虎，两只老虎，跑得快，跑得快', '[60, 62, 64, 60, 60, 62, 64, 60, 64, 65, 67]'::json, 'EASY', NOW()),
                    ('世上只有妈妈好', '世上只有妈妈好，有妈的孩子像块宝', '[67, 65, 64, 62, 60, 62, 64, 65, 67, 67, 69, 67]'::json, 'MEDIUM', NOW()),
                    ('茉莉花', '好一朵美丽的茉莉花', '[60, 62, 64, 65, 67, 65, 64, 62, 60]'::json, 'MEDIUM', NOW()),
                    ('青藏高原', '是谁带来 远古的呼唤，是谁留下 千年的祈盼，难道说还有 无言的歌，还是那久久不能忘怀的眷恋。哦 我看见 一座座山 一座座山川，一座座山川相连，呀啦索 那可是青藏高原', '[64, 66, 67, 71, 69, 67, 66, 64, 64, 67, 69, 71, 69, 67, 69, 67, 64, 67, 69, 71, 72, 71, 69, 67, 66, 64, 66, 67, 69, 67, 66, 64, 64, 66, 67, 69, 71, 72, 71, 69, 72, 71, 69, 67, 69, 71, 72, 71, 69, 67, 69, 71, 72, 74, 76, 74, 72, 71, 69, 67, 64]'::json, 'HARD', NOW())
                ON CONFLICT DO NOTHING;
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
    """))
    db.execute(text(f"""
        CREATE TRIGGER trg_first_user_system_seed
        AFTER INSERT ON {users_table}
        FOR EACH ROW EXECUTE FUNCTION fn_first_user_system_seed();
    """))
    logger.info("Created AFTER INSERT trigger function + trigger: fn_first_user_system_seed / trg_first_user_system_seed")
    logger.info("All PostgreSQL trigger functions and triggers created successfully.")
def main():
    """Execute: create PostgreSQL trigger functions and triggers for system initialization."""
    db = next(get_db())
    try:
        create_first_user_triggers(db)
        db.commit()
        logger.info("seed_data.py execution completed — triggers installed successfully.")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create triggers: {e}")
        raise
    finally:
        db.close()
if __name__ == "__main__":
    main()