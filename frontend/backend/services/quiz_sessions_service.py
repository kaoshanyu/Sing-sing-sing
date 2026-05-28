from typing import Optional
import random

from all_enums import ModuleTypeEnum, SessionStatusEnum
from result_response import Result, create_not_found_error, create_validation_error, create_business_rule_error
from sqlalchemy import select, func, and_
from sqlalchemy.orm import Session
import pendulum

from models import QuizSessionModel, QuestionModel, UserQuestionRecordModel
from schemas.basic_schema import QuizSessionQuestionItemBasicSchema

class QuizSessionsService:
    @staticmethod
    async def create_quiz_session(db: Session, user_id: int, module_type: ModuleTypeEnum) -> Result[QuizSessionModel]:
        try:
            wrong_records_query = select(UserQuestionRecordModel).join(
                QuestionModel, UserQuestionRecordModel.question_id == QuestionModel.question_id
            ).where(
                and_(
                    UserQuestionRecordModel.user_id == user_id,
                    UserQuestionRecordModel.is_correct == False,
                    QuestionModel.module_type == module_type
                )
            ).order_by(
                UserQuestionRecordModel.last_attempt_at.desc()
            ).limit(10)
            wrong_records = db.execute(wrong_records_query).scalars().all()
            wrong_question_ids = [record.question_id for record in wrong_records]
            wrong_questions = []
            if wrong_question_ids:
                wrong_questions_query = select(QuestionModel).where(
                    QuestionModel.question_id.in_(wrong_question_ids)
                )
                wrong_questions = db.execute(wrong_questions_query).scalars().all()
            wrong_count = len(wrong_questions)
            remaining_slots = 20 - wrong_count
            new_questions = []
            if remaining_slots > 0:
                new_questions_query = select(QuestionModel).where(
                    and_(
                        QuestionModel.module_type == module_type,
                        QuestionModel.question_id.notin_(wrong_question_ids) if wrong_question_ids else True
                    )
                ).order_by(func.random()).limit(remaining_slots)
                new_questions = db.execute(new_questions_query).scalars().all()
            all_questions = list(wrong_questions) + list(new_questions)
            if len(all_questions) < 20:
                return Result.from_error(
                    create_business_rule_error(
                        f"Not enough questions in database for this module. Found {len(all_questions)}, need 20.",
                        rule="minimum_questions"
                    )
                )
            random.shuffle(all_questions)
            questions_list = []
            for question in all_questions:
                question_item = QuizSessionQuestionItemBasicSchema(
                    question_id=question.question_id,
                    question_data=question.question_data,
                    difficulty=question.difficulty,
                    is_from_wrong_book=(question.question_id in wrong_question_ids)
                )
                questions_list.append(question_item)
            session = QuizSessionModel(
                user_id=user_id,
                module_type=module_type,
                questions=questions_list,
                current_index=0,
                correct_count=0,
                hearts_remaining=5,
                combo_count=0,
                session_status=SessionStatusEnum.IN_PROGRESS,
                score=None,
                stars_earned=None,
                started_at=pendulum.now(),
                completed_at=None
            )
            db.add(session)
            db.commit()
            db.refresh(session)
            return Result.success(session)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def get_quiz_session(db: Session, session_id: int) -> Result[Optional[QuizSessionModel]]:
        try:
            session = db.execute(
                select(QuizSessionModel).where(QuizSessionModel.session_id == session_id)
            ).scalars().first()
            return Result.success(session)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def submit_answer(db: Session, session_id: int, question_id: int, answer: str) -> Result[dict]:
        try:
            session = db.execute(
                select(QuizSessionModel).where(QuizSessionModel.session_id == session_id)
            ).scalars().first()
            if not session:
                return Result.from_error(create_not_found_error("Quiz session", session_id))
            if session.session_status != SessionStatusEnum.IN_PROGRESS:
                return Result.from_error(
                    create_business_rule_error(
                        f"Session is not in progress (current status: {session.session_status})",
                        rule="session_in_progress"
                    )
                )
            if session.current_index >= len(session.questions):
                return Result.from_error(
                    create_business_rule_error(
                        "No more questions in this session",
                        rule="questions_available"
                    )
                )
            current_question_item = session.questions[session.current_index]
            if current_question_item.question_id != question_id:
                return Result.from_error(
                    create_validation_error(
                        f"Question ID mismatch. Expected {current_question_item.question_id}, got {question_id}",
                        field="question_id"
                    )
                )
            correct_answer = current_question_item.question_data.get("answer", "")
            is_correct = (answer.strip().lower() == correct_answer.strip().lower())
            if is_correct:
                session.correct_count += 1
                session.combo_count += 1
                feedback = "答对了！"
            else:
                session.hearts_remaining = max(0, session.hearts_remaining - 1)
                session.combo_count = 0
                feedback = "答错了，再接再厉！"
            session.current_index += 1
            session.updated_at = pendulum.now()
            if session.hearts_remaining == 0:
                session.session_status = SessionStatusEnum.FAILED
                session.completed_at = pendulum.now()
            db.commit()
            db.refresh(session)
            existing_record = db.execute(
                select(UserQuestionRecordModel).where(
                    and_(
                        UserQuestionRecordModel.user_id == session.user_id,
                        UserQuestionRecordModel.question_id == question_id
                    )
                )
            ).scalars().first()
            if existing_record:
                existing_record.is_correct = is_correct
                existing_record.attempt_count += 1
                existing_record.last_attempt_at = pendulum.now()
            else:
                new_record = UserQuestionRecordModel(
                    user_id=session.user_id,
                    question_id=question_id,
                    is_correct=is_correct,
                    attempt_count=1,
                    last_attempt_at=pendulum.now()
                )
                db.add(new_record)
            db.commit()
            result_dict = {
                "is_correct": is_correct,
                "correct_answer": correct_answer,
                "feedback": feedback,
                "hearts_remaining": session.hearts_remaining,
                "combo_count": session.combo_count
            }
            return Result.success(result_dict)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))
    @staticmethod
    async def complete_session(db: Session, session_id: int) -> Result[dict]:
        try:
            session = db.execute(
                select(QuizSessionModel).where(QuizSessionModel.session_id == session_id)
            ).scalars().first()
            if not session:
                return Result.from_error(create_not_found_error("Quiz session", session_id))
            if session.session_status == SessionStatusEnum.COMPLETED:
                return Result.from_error(
                    create_business_rule_error(
                        "Session already completed",
                        rule="session_not_completed"
                    )
                )
            if session.session_status == SessionStatusEnum.FAILED:
                return Result.from_error(
                    create_business_rule_error(
                        "Session has failed (no hearts remaining)",
                        rule="session_not_failed"
                    )
                )
            session.session_status = SessionStatusEnum.COMPLETED
            session.completed_at = pendulum.now()
            total_questions = 20
            score = int((session.correct_count / total_questions) * 100)
            session.score = score
            if score >= 90:
                stars_earned = 3
            elif score >= 70:
                stars_earned = 2
            elif score >= 50:
                stars_earned = 1
            else:
                stars_earned = 0
            session.stars_earned = stars_earned
            duration_seconds = int((session.completed_at - session.started_at).total_seconds())
            db.commit()
            db.refresh(session)
            result_dict = {
                "score": score,
                "stars_earned": stars_earned,
                "correct_count": session.correct_count,
                "total_questions": total_questions,
                "duration_seconds": duration_seconds
            }
            return Result.success(result_dict)
        except Exception as e:
            db.rollback()
            return Result.from_error(create_validation_error(str(e)))