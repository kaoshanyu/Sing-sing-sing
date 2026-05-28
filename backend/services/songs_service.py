from typing import List, Optional, Tuple

from all_enums import DifficultyEnum
from result_response import Result, create_not_found_error
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from models import SongModel

class SongsService:
    """Song data access service for singing practice."""
    @staticmethod
    async def get_song_by_id(db: Session, song_id: int) -> Result[Optional[SongModel]]:
        """
        Gets song by ID with reference_melody field.
        Args:
            db: Database session
            song_id: Song ID to retrieve
        Returns:
            Result containing SongModel if found, or error if not found
        """
        song = db.execute(
            select(SongModel).where(SongModel.song_id == song_id)
        ).scalars().first()
        if not song:
            return Result.from_error(create_not_found_error("Song", song_id))
        return Result.success(song)
    @staticmethod
    async def list_songs(
        db: Session,
        page: int,
        limit: int,
        difficulty: Optional[DifficultyEnum] = None
    ) -> Result[Tuple[List[SongModel], int]]:
        """
        Gets paginated list of songs with optional difficulty filter.
        Filters by difficulty if provided, orders by created_at DESC,
        applies pagination with OFFSET and LIMIT.
        Args:
            db: Database session
            page: Page number (1-based)
            limit: Items per page
            difficulty: Optional difficulty filter
        Returns:
            Result containing tuple of (song list, total count)
        """
        base_query = select(SongModel)
        if difficulty is not None:
            base_query = base_query.where(SongModel.difficulty == difficulty)
        count_query = select(func.count()).select_from(base_query.subquery())
        total_count = db.scalar(count_query) or 0
        data_query = base_query.order_by(
            SongModel.created_at.desc()
        ).limit(limit).offset((page - 1) * limit)
        songs = db.execute(data_query).scalars().all()
        return Result.success((list(songs), total_count))