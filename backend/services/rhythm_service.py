from __future__ import annotations

import random
from dataclasses import dataclass
from typing import Any


ASSET_BASE_URL = "/static/rhythm_v2"

QUESTION_TYPES_BY_UNIT: dict[int, list[str]] = {
    1: ["RHYTHM_CLASSIFICATION", "ACCENT_DETECTION"],
    2: ["RHYTHM_ECHO"],
    3: ["UPBEAT_TRAINING"],
    4: ["RHYTHM_CLASSIFICATION", "ACCENT_DETECTION"],
    5: ["ANTI_DISTRACTION", "SPLIT_BRAIN"],
    6: ["PRODUCER_SANDBOX"],
}

UNITS: list[dict[str, Any]] = [
    {
        "unit_id": 1,
        "unit_name": "基础拍号与强弱感知",
        "unit_description": "先听出二拍、三拍、四拍的重音循环，再用点击锁定每小节的第一拍。",
        "unit_order": 1,
        "is_unlocked": True,
        "best_score": None,
    },
    {
        "unit_id": 2,
        "unit_name": "节奏回声",
        "unit_description": "听到目标节奏就跟着点出来，把时值、休止和密集节奏变成身体反应。",
        "unit_order": 2,
        "is_unlocked": True,
        "best_score": None,
    },
    {
        "unit_id": 3,
        "unit_name": "反拍与切分点击",
        "unit_description": "在稳定底拍上点击反拍、弱拍和切分位置，让身体跟上不落在强拍上的律动。",
        "unit_order": 3,
        "is_unlocked": True,
        "best_score": None,
    },
    {
        "unit_id": 4,
        "unit_name": "复合拍律动",
        "unit_description": "感受 6/8、9/8、12/8 的大拍流动，听出重音分组并跟上摇摆感。",
        "unit_order": 4,
        "is_unlocked": True,
        "best_score": None,
    },
    {
        "unit_id": 5,
        "unit_name": "复合节奏与抗干扰",
        "unit_description": "在干扰声部里保持目标拍稳定，并逐步挑战 3:2、4:3 的双手独立。",
        "unit_order": 5,
        "is_unlocked": True,
        "best_score": None,
    },
    {
        "unit_id": 6,
        "unit_name": "节奏制作人",
        "unit_description": "像编曲软件一样选择乐器、点亮节奏格，循环回听并打磨自己的鼓组 Loop。",
        "unit_order": 6,
        "is_unlocked": True,
        "best_score": None,
    },
]

LEVELS: list[dict[str, Any]] = [
    {"level_id": 101, "unit_id": 1, "difficulty": 1, "bpm_range_min": 88, "bpm_range_max": 96, "time_signature": "2/4", "subdivision_level": 1},
    {"level_id": 102, "unit_id": 1, "difficulty": 2, "bpm_range_min": 84, "bpm_range_max": 96, "time_signature": "3/4", "subdivision_level": 1},
    {"level_id": 103, "unit_id": 1, "difficulty": 3, "bpm_range_min": 92, "bpm_range_max": 108, "time_signature": "4/4", "subdivision_level": 1},
    {"level_id": 104, "unit_id": 1, "difficulty": 4, "bpm_range_min": 96, "bpm_range_max": 112, "time_signature": "4/4", "subdivision_level": 2},
    {"level_id": 201, "unit_id": 2, "difficulty": 1, "bpm_range_min": 72, "bpm_range_max": 84, "time_signature": "4/4", "subdivision_level": 1},
    {"level_id": 202, "unit_id": 2, "difficulty": 2, "bpm_range_min": 80, "bpm_range_max": 92, "time_signature": "4/4", "subdivision_level": 2},
    {"level_id": 203, "unit_id": 2, "difficulty": 3, "bpm_range_min": 86, "bpm_range_max": 100, "time_signature": "4/4", "subdivision_level": 3},
    {"level_id": 204, "unit_id": 2, "difficulty": 4, "bpm_range_min": 92, "bpm_range_max": 108, "time_signature": "4/4", "subdivision_level": 4},
    {"level_id": 301, "unit_id": 3, "difficulty": 1, "bpm_range_min": 72, "bpm_range_max": 84, "time_signature": "4/4", "subdivision_level": 1},
    {"level_id": 302, "unit_id": 3, "difficulty": 2, "bpm_range_min": 84, "bpm_range_max": 96, "time_signature": "4/4", "subdivision_level": 2},
    {"level_id": 303, "unit_id": 3, "difficulty": 3, "bpm_range_min": 92, "bpm_range_max": 104, "time_signature": "4/4", "subdivision_level": 3},
    {"level_id": 304, "unit_id": 3, "difficulty": 4, "bpm_range_min": 100, "bpm_range_max": 112, "time_signature": "4/4", "subdivision_level": 4},
    {"level_id": 401, "unit_id": 4, "difficulty": 1, "bpm_range_min": 66, "bpm_range_max": 76, "time_signature": "6/8", "subdivision_level": 1},
    {"level_id": 402, "unit_id": 4, "difficulty": 2, "bpm_range_min": 72, "bpm_range_max": 84, "time_signature": "9/8", "subdivision_level": 2},
    {"level_id": 403, "unit_id": 4, "difficulty": 3, "bpm_range_min": 78, "bpm_range_max": 92, "time_signature": "12/8", "subdivision_level": 3},
    {"level_id": 404, "unit_id": 4, "difficulty": 4, "bpm_range_min": 80, "bpm_range_max": 96, "time_signature": "6/8", "subdivision_level": 4},
    {"level_id": 501, "unit_id": 5, "difficulty": 1, "bpm_range_min": 72, "bpm_range_max": 84, "time_signature": "4/4", "subdivision_level": 1},
    {"level_id": 502, "unit_id": 5, "difficulty": 2, "bpm_range_min": 84, "bpm_range_max": 96, "time_signature": "4/4", "subdivision_level": 2},
    {"level_id": 503, "unit_id": 5, "difficulty": 3, "bpm_range_min": 90, "bpm_range_max": 104, "time_signature": "4/4", "subdivision_level": 3},
    {"level_id": 504, "unit_id": 5, "difficulty": 4, "bpm_range_min": 96, "bpm_range_max": 112, "time_signature": "4/4", "subdivision_level": 4},
    {"level_id": 601, "unit_id": 6, "difficulty": 1, "bpm_range_min": 84, "bpm_range_max": 96, "time_signature": "4/4", "subdivision_level": 2},
    {"level_id": 602, "unit_id": 6, "difficulty": 2, "bpm_range_min": 96, "bpm_range_max": 108, "time_signature": "4/4", "subdivision_level": 3},
    {"level_id": 603, "unit_id": 6, "difficulty": 3, "bpm_range_min": 108, "bpm_range_max": 124, "time_signature": "4/4", "subdivision_level": 4},
    {"level_id": 604, "unit_id": 6, "difficulty": 4, "bpm_range_min": 84, "bpm_range_max": 124, "time_signature": "4/4", "subdivision_level": 4},
]

INSTRUMENTS: list[dict[str, Any]] = [
    {"instrument_id": 1, "name": "Kick", "icon": "K", "sound_url": f"{ASSET_BASE_URL}/sounds/kick.wav"},
    {"instrument_id": 2, "name": "Snare", "icon": "S", "sound_url": f"{ASSET_BASE_URL}/sounds/snare.wav"},
    {"instrument_id": 3, "name": "Closed Hat", "icon": "H", "sound_url": f"{ASSET_BASE_URL}/sounds/hat.wav"},
    {"instrument_id": 4, "name": "Clap", "icon": "C", "sound_url": f"{ASSET_BASE_URL}/sounds/clap.wav"},
    {"instrument_id": 5, "name": "Wood", "icon": "W", "sound_url": f"{ASSET_BASE_URL}/sounds/wood.wav"},
    {"instrument_id": 6, "name": "Rim", "icon": "R", "sound_url": f"{ASSET_BASE_URL}/sounds/rim.wav"},
    {"instrument_id": 7, "name": "Shaker", "icon": "Sh", "sound_url": f"{ASSET_BASE_URL}/sounds/shaker.wav"},
    {"instrument_id": 8, "name": "Cowbell", "icon": "Cb", "sound_url": f"{ASSET_BASE_URL}/sounds/cowbell.wav"},
    {"instrument_id": 9, "name": "Low Tom", "icon": "LT", "sound_url": f"{ASSET_BASE_URL}/sounds/tom_low.wav"},
    {"instrument_id": 10, "name": "High Tom", "icon": "HT", "sound_url": f"{ASSET_BASE_URL}/sounds/tom_high.wav"},
    {"instrument_id": 11, "name": "Crash", "icon": "Cr", "sound_url": f"{ASSET_BASE_URL}/sounds/crash.wav"},
]

# Every track below has a generated audio file with the same file stem.  The
# private answer data comes from the same config, so audio and scoring cannot
# drift apart.
RHYTHM_TRACKS: list[dict[str, Any]] = [
    {
        "track_id": 1011,
        "unit_id": 1,
        "level_ids": [101],
        "question_type": "RHYTHM_CLASSIFICATION",
        "name": "2/4 拍号听辨",
        "file": "u1_meter_2_4_96.wav",
        "bpm": 96,
        "time_signature": "2/4",
        "duration_ms": 10000,
        "options": ["2/4", "3/4", "4/4"],
        "correct_answer": "2/4",
        "prompt": "听重音是不是每两拍循环一次。",
        "skill_goal": "建立二拍子的行进感。",
    },
    {
        "track_id": 1012,
        "unit_id": 1,
        "level_ids": [102],
        "question_type": "RHYTHM_CLASSIFICATION",
        "name": "3/4 拍号听辨",
        "file": "u1_meter_3_4_90.wav",
        "bpm": 90,
        "time_signature": "3/4",
        "duration_ms": 12000,
        "options": ["2/4", "3/4", "4/4"],
        "correct_answer": "3/4",
        "prompt": "听强弱弱的摆动，三拍会有旋转感。",
        "skill_goal": "听出三拍子的重音循环。",
    },
    {
        "track_id": 1013,
        "unit_id": 1,
        "level_ids": [103],
        "question_type": "RHYTHM_CLASSIFICATION",
        "name": "4/4 拍号听辨",
        "file": "u1_meter_4_4_100.wav",
        "bpm": 100,
        "time_signature": "4/4",
        "duration_ms": 12000,
        "options": ["2/4", "3/4", "4/4"],
        "correct_answer": "4/4",
        "prompt": "听四拍一组的稳定落点。",
        "skill_goal": "分辨最常见的四拍律动。",
    },
    {
        "track_id": 1014,
        "unit_id": 1,
        "level_ids": [104],
        "question_type": "ACCENT_DETECTION",
        "name": "4/4 强拍点击",
        "file": "u1_accent_4_4_104.wav",
        "bpm": 104,
        "time_signature": "4/4",
        "duration_ms": 14000,
        "expected_beats": [0, 4, 8, 12, 16, 20],
        "beats_per_measure": 4,
        "prompt": "只在每小节第一拍点击，其它弱拍不要点。",
        "skill_goal": "把听到的重音落实到点击动作。",
    },
    {
        "track_id": 2011,
        "unit_id": 2,
        "level_ids": [201],
        "question_type": "RHYTHM_ECHO",
        "name": "回声：长短稳定",
        "file": "u2_puzzle_q_q_h.wav",
        "bpm": 76,
        "time_signature": "4/4",
        "duration_ms": 9000,
        "lead_in_beats": 4,
        "correct_sequence": ["QUARTER", "QUARTER", "HALF"],
        "pattern_id": "unit2-basic-half",
        "prompt": "听到更亮的目标音就点击，最后一个长音只点开头。",
        "skill_goal": "把四分音和长音听成稳定动作。",
    },
    {
        "track_id": 2021,
        "unit_id": 2,
        "level_ids": [202],
        "question_type": "RHYTHM_ECHO",
        "name": "回声：八分推进",
        "file": "u2_puzzle_q_e_e_h.wav",
        "bpm": 84,
        "time_signature": "4/4",
        "duration_ms": 9000,
        "lead_in_beats": 4,
        "correct_sequence": ["QUARTER", "EIGHTH", "EIGHTH", "HALF"],
        "pattern_id": "unit2-eighth-pair",
        "prompt": "中间两个目标音靠得更近，手指要跟上密度变化。",
        "skill_goal": "把八分音的更密节奏点出来。",
    },
    {
        "track_id": 2031,
        "unit_id": 2,
        "level_ids": [203],
        "question_type": "RHYTHM_ECHO",
        "name": "回声：休止空拍",
        "file": "u2_puzzle_q_r_e_e_q.wav",
        "bpm": 92,
        "time_signature": "4/4",
        "duration_ms": 9000,
        "lead_in_beats": 4,
        "correct_sequence": ["QUARTER", "REST", "EIGHTH", "EIGHTH", "QUARTER"],
        "pattern_id": "unit2-rest-gap",
        "prompt": "听到空拍时忍住不点，只回应真正出现的目标音。",
        "skill_goal": "把休止转换成手上的控制力。",
    },
    {
        "track_id": 2041,
        "unit_id": 2,
        "level_ids": [204],
        "question_type": "RHYTHM_ECHO",
        "name": "回声：密集开头",
        "file": "u2_puzzle_16ths.wav",
        "bpm": 100,
        "time_signature": "4/4",
        "duration_ms": 9000,
        "lead_in_beats": 4,
        "correct_sequence": ["SIXTEENTH", "SIXTEENTH", "EIGHTH", "QUARTER", "EIGHTH", "EIGHTH", "QUARTER"],
        "pattern_id": "unit2-sixteenth-push",
        "prompt": "开头两个目标音很近，先稳住第一下，再跟上第二下。",
        "skill_goal": "训练十六分密集入口的反应速度。",
    },
    {
        "track_id": 3011,
        "unit_id": 3,
        "level_ids": [301],
        "question_type": "UPBEAT_TRAINING",
        "name": "八分反拍",
        "file": "u3_upbeat_80.wav",
        "bpm": 80,
        "time_signature": "4/4",
        "duration_ms": 12000,
        "lead_in_beats": 4,
        "expected_beat_offsets": [0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5, 7.5],
        "prompt": "先听 4 拍底拍准备，再点击落在底拍中间的高音。",
        "skill_goal": "建立八分反拍的身体反应。",
    },
    {
        "track_id": 3021,
        "unit_id": 3,
        "level_ids": [302],
        "question_type": "UPBEAT_TRAINING",
        "name": "弱拍二四拍",
        "file": "u3_backbeat_92.wav",
        "bpm": 92,
        "time_signature": "4/4",
        "duration_ms": 12000,
        "lead_in_beats": 4,
        "expected_beat_offsets": [1, 3, 5, 7, 9],
        "prompt": "先听 4 拍底拍准备，再点击第二拍和第四拍的高音。",
        "skill_goal": "稳定点击弱拍二、四拍。",
    },
    {
        "track_id": 3031,
        "unit_id": 3,
        "level_ids": [303],
        "question_type": "UPBEAT_TRAINING",
        "name": "切分型一",
        "file": "u3_syncopation_a_100.wav",
        "bpm": 100,
        "time_signature": "4/4",
        "duration_ms": 12000,
        "lead_in_beats": 4,
        "expected_beat_offsets": [0, 1.5, 2.5, 4, 5.5, 6.5, 8],
        "prompt": "先听 4 拍准备；目标有时会提前半拍出现，别等到强拍才点。",
        "skill_goal": "训练常见切分节奏的提前感。",
    },
    {
        "track_id": 3041,
        "unit_id": 3,
        "level_ids": [304],
        "question_type": "UPBEAT_TRAINING",
        "name": "切分型二",
        "file": "u3_syncopation_b_108.wav",
        "bpm": 108,
        "time_signature": "4/4",
        "duration_ms": 12000,
        "lead_in_beats": 4,
        "expected_beat_offsets": [0.5, 1.25, 2, 3.5, 4.5, 5.25, 6, 7.5],
        "prompt": "先听 4 拍准备；这一关目标更碎，宁可少点也不要乱点。",
        "skill_goal": "进入十六分级别的切分点击。",
    },
    {
        "track_id": 4011,
        "unit_id": 4,
        "level_ids": [401],
        "question_type": "ACCENT_DETECTION",
        "name": "6/8 大拍点击",
        "file": "u4_compound_6_8_accent.wav",
        "bpm": 72,
        "time_signature": "6/8",
        "duration_ms": 13000,
        "lead_in_beats": 4,
        "expected_beat_offsets": [0, 1.5, 3, 4.5, 6, 7.5],
        "beats_per_measure": 2,
        "prompt": "先听 4 拍准备；6/8 只点两个大拍，不要每个小拍都点。",
        "skill_goal": "点击 6/8 的大拍重心。",
    },
    {
        "track_id": 4021,
        "unit_id": 4,
        "level_ids": [402],
        "question_type": "RHYTHM_CLASSIFICATION",
        "name": "9/8 复合拍听辨",
        "file": "u4_meter_9_8_78.wav",
        "bpm": 78,
        "time_signature": "9/8",
        "duration_ms": 14000,
        "options": ["6/8", "9/8", "12/8"],
        "correct_answer": "9/8",
        "prompt": "听它是不是三组大拍连在一起。",
        "skill_goal": "分辨 9/8 的三组复合拍。",
    },
    {
        "track_id": 4031,
        "unit_id": 4,
        "level_ids": [403],
        "question_type": "RHYTHM_CLASSIFICATION",
        "name": "12/8 复合拍听辨",
        "file": "u4_meter_12_8_86.wav",
        "bpm": 86,
        "time_signature": "12/8",
        "duration_ms": 14000,
        "options": ["6/8", "9/8", "12/8"],
        "correct_answer": "12/8",
        "prompt": "听它是不是四组大拍连成一个长循环。",
        "skill_goal": "分辨 12/8 的四组复合拍。",
    },
    {
        "track_id": 4041,
        "unit_id": 4,
        "level_ids": [404],
        "question_type": "ACCENT_DETECTION",
        "name": "12/8 大拍点击",
        "file": "u4_compound_12_8_accent.wav",
        "bpm": 84,
        "time_signature": "12/8",
        "duration_ms": 14000,
        "lead_in_beats": 4,
        "expected_beat_offsets": [0, 1.5, 3, 4.5, 6, 7.5, 9],
        "beats_per_measure": 4,
        "prompt": "先听 4 拍准备；12/8 里每组三个小拍合成一个大拍，只点大拍。",
        "skill_goal": "把复合拍听辨转成身体点击。",
    },
    {
        "track_id": 5011,
        "unit_id": 5,
        "level_ids": [501],
        "question_type": "ANTI_DISTRACTION",
        "name": "强拍抗干扰",
        "file": "u5_distraction_84.wav",
        "bpm": 84,
        "time_signature": "4/4",
        "duration_ms": 14000,
        "expected_beats": [0, 4, 8, 12, 16],
        "prompt": "干扰声会穿插出现，只跟更亮的强拍目标。",
        "skill_goal": "在复杂声音里保持一拍稳定。",
    },
    {
        "track_id": 5021,
        "unit_id": 5,
        "level_ids": [502],
        "question_type": "ANTI_DISTRACTION",
        "name": "弱拍抗干扰",
        "file": "u5_backbeat_distraction_92.wav",
        "bpm": 92,
        "time_signature": "4/4",
        "duration_ms": 14000,
        "expected_beats": [1, 3, 5, 7, 9, 11, 13, 15],
        "prompt": "这次目标在二、四拍，别被强拍底声带走。",
        "skill_goal": "在干扰里保持 backbeat 弱拍稳定。",
    },
    {
        "track_id": 5031,
        "unit_id": 5,
        "level_ids": [503],
        "question_type": "SPLIT_BRAIN",
        "name": "左右手 3:2",
        "file": "u5_split_3_2_96.wav",
        "bpm": 96,
        "time_signature": "4/4",
        "duration_ms": 12000,
        "left_beat_offsets": [0, 1, 2, 3, 4, 5, 6, 7],
        "right_beat_offsets": [0, 2 / 3, 4 / 3, 2, 8 / 3, 10 / 3, 4, 14 / 3, 16 / 3, 6, 20 / 3, 22 / 3],
        "ratio": "3:2",
        "prompt": "左手保持低音等分，右手跟高音三连分组。",
        "skill_goal": "初步建立 3:2 复合节奏的双手独立。",
    },
    {
        "track_id": 5041,
        "unit_id": 5,
        "level_ids": [504],
        "question_type": "SPLIT_BRAIN",
        "name": "左右手 4:3",
        "file": "u5_split_4_3_88.wav",
        "bpm": 88,
        "time_signature": "4/4",
        "duration_ms": 13000,
        "left_beat_offsets": [0, 1, 2, 3, 4, 5, 6, 7],
        "right_beat_offsets": [0, 0.75, 1.5, 2.25, 3, 3.75, 4.5, 5.25, 6, 6.75, 7.5],
        "ratio": "4:3",
        "prompt": "左手稳住等拍，右手点击更密的高音层。",
        "skill_goal": "挑战更紧的 4:3 双手分离。",
    },
    {
        "track_id": 6011,
        "unit_id": 6,
        "level_ids": [601, 602, 603, 604],
        "question_type": "PRODUCER_SANDBOX",
        "name": "制作人基础 Loop",
        "file": "u6_producer_loop_96.wav",
        "bpm": 96,
        "time_signature": "4/4",
        "duration_ms": 16000,
    },
]


@dataclass
class StoredQuestion:
    question: dict[str, Any]
    private_payload: dict[str, Any]


_QUESTIONS: dict[int, StoredQuestion] = {}
_NEXT_QUESTION_ID = 50000


def list_units() -> list[dict[str, Any]]:
    return UNITS


def get_unit(unit_id: int) -> dict[str, Any] | None:
    return next((unit for unit in UNITS if unit["unit_id"] == unit_id), None)


def list_levels(unit_id: int) -> list[dict[str, Any]]:
    return [
        {**level, "is_unlocked": True, "is_completed": False, "best_score": None}
        for level in LEVELS
        if level["unit_id"] == unit_id
    ]


def get_level(level_id: int) -> dict[str, Any] | None:
    level = next((level for level in LEVELS if level["level_id"] == level_id), None)
    if level is None:
        return None
    return {**level, "is_unlocked": True, "is_completed": False, "best_score": None}


def list_instruments() -> list[dict[str, Any]]:
    return INSTRUMENTS


def list_audio_tracks() -> list[dict[str, Any]]:
    return [
        {
            "track_id": track["track_id"],
            "name": track["name"],
            "audio_url": _audio_url(track),
            "bpm": track["bpm"],
        }
        for track in RHYTHM_TRACKS
    ]


def generate_question(level_id: int) -> dict[str, Any] | None:
    global _NEXT_QUESTION_ID

    level = get_level(level_id)
    if level is None:
        return None

    allowed_types = QUESTION_TYPES_BY_UNIT[level["unit_id"]]
    candidates = [
        track
        for track in RHYTHM_TRACKS
        if level_id in track["level_ids"] and track["question_type"] in allowed_types
    ]
    if not candidates:
        candidates = [
            track
            for track in RHYTHM_TRACKS
            if track["unit_id"] == level["unit_id"] and track["question_type"] in allowed_types
        ]
    if not candidates:
        return None

    track = random.choice(candidates)
    private_payload = _build_private_payload(track, level)
    public_payload = _public_payload(private_payload)
    for key in ("name", "prompt", "skill_goal"):
        if key in track:
            public_payload[key] = track[key]
    expected = private_payload.get("expected_hit_times_ms", [])

    _NEXT_QUESTION_ID += 1
    question = {
        "question_id": _NEXT_QUESTION_ID,
        "level_id": level_id,
        "question_type": track["question_type"],
        "bpm": track["bpm"],
        "time_signature": track["time_signature"],
        "duration_ms": track["duration_ms"],
        "audio_url": _audio_url(track),
        "question_payload": public_payload,
        "expected_hit_times_ms": expected,
    }
    _QUESTIONS[_NEXT_QUESTION_ID] = StoredQuestion(question=question, private_payload=private_payload)
    return question


def submit_answer(question_id: int, answer: dict[str, Any]) -> dict[str, Any] | None:
    stored = _QUESTIONS.get(question_id)
    if stored is None:
        return None

    question_type = stored.question["question_type"]
    private_payload = stored.private_payload

    if question_type == "RHYTHM_CLASSIFICATION":
        selected = answer.get("selected_answer")
        score = 100 if selected == private_payload["correct_answer"] else 0
        detail = _empty_detail(hit_count=1 if score else 0, miss_count=0 if score else 1)
    elif question_type == "RHYTHM_PUZZLE":
        selected_count = answer.get("selected_count")
        if selected_count is not None:
            score = 100 if int(selected_count) == private_payload["correct_count"] else 0
            detail = _empty_detail(hit_count=1 if score else 0, miss_count=0 if score else 1)
        elif answer.get("selected_pattern"):
            selected_pattern = answer.get("selected_pattern")
            score = 100 if selected_pattern == private_payload["correct_pattern_id"] else 0
            detail = _empty_detail(hit_count=1 if score else 0, miss_count=0 if score else 1)
        else:
            selected_notes = answer.get("selected_notes") or []
            selected_types = [item.get("note_type") for item in selected_notes]
            correct = private_payload["correct_sequence"]
            exact_matches = sum(a == b for a, b in zip(selected_types, correct))
            score = 100 if selected_types == correct else int(100 * exact_matches / max(1, len(correct)))
            if len(selected_types) != len(correct):
                score = max(0, score - abs(len(selected_types) - len(correct)) * 10)
            detail = _empty_detail(hit_count=exact_matches, miss_count=max(0, len(correct) - exact_matches))
    elif question_type == "SPLIT_BRAIN":
        left = _timing_score(private_payload["left_expected_ms"], answer.get("left_hand_timestamps_ms") or [])
        right = _timing_score(private_payload["right_expected_ms"], answer.get("right_hand_timestamps_ms") or [])
        score = int((left["score"] + right["score"]) / 2)
        detail = _merge_details(left, right)
    elif question_type == "PRODUCER_SANDBOX":
        loop_tracks = answer.get("loop_tracks") or []
        score, radar = _producer_score(loop_tracks, private_payload["quantize_grid_ms"])
        hit_count = sum(len(track.get("hit_times_ms", [])) for track in loop_tracks)
        detail = _empty_detail(hit_count=hit_count, miss_count=0 if hit_count else 1)
        return _result(score=score, detail=detail, radar_chart=radar)
    else:
        expected = private_payload.get("expected_hit_times_ms", [])
        timing = _timing_score(expected, answer.get("hit_timestamps_ms") or [])
        score = timing["score"]
        detail = timing

    return _result(score=score, detail=detail)


def _audio_url(track: dict[str, Any]) -> str:
    return f"{ASSET_BASE_URL}/{track['file']}"


def _beat_ms(track: dict[str, Any]) -> int:
    return int(60_000 / track["bpm"])


def _offsets_to_ms(track: dict[str, Any], offsets: list[float]) -> list[int]:
    beat_ms = _beat_ms(track)
    lead = float(track.get("lead_in_beats", 0))
    return [int(round((offset + lead) * beat_ms)) for offset in offsets if int(round((offset + lead) * beat_ms)) <= track["duration_ms"]]


def _beats_to_ms(track: dict[str, Any], beats: list[int]) -> list[int]:
    beat_ms = _beat_ms(track)
    lead = float(track.get("lead_in_beats", 0))
    return [int(round((beat + lead) * beat_ms)) for beat in beats if int(round((beat + lead) * beat_ms)) <= track["duration_ms"]]


def _beat_timeline(track: dict[str, Any]) -> list[int]:
    beat_ms = _beat_ms(track)
    return list(range(0, track["duration_ms"] + 1, beat_ms))


def _note_duration_ms(note_type: str, beat_ms: int) -> int:
    multipliers = {
        "WHOLE": 4.0,
        "HALF": 2.0,
        "QUARTER": 1.0,
        "EIGHTH": 0.5,
        "SIXTEENTH": 0.25,
        "REST": 1.0,
    }
    return int(round(beat_ms * multipliers[note_type]))


def _sequence_steps(sequence: list[str]) -> list[int]:
    durations = {
        "WHOLE": 16,
        "HALF": 8,
        "QUARTER": 4,
        "EIGHTH": 2,
        "SIXTEENTH": 1,
        "REST": 4,
    }
    step = 0
    hits: list[int] = []
    for note_type in sequence:
        if note_type != "REST" and step < 16:
            hits.append(step)
        step += durations[note_type]
    return hits


def _sequence_offsets(sequence: list[str]) -> list[float]:
    durations = {
        "WHOLE": 4.0,
        "HALF": 2.0,
        "QUARTER": 1.0,
        "EIGHTH": 0.5,
        "SIXTEENTH": 0.25,
        "REST": 1.0,
    }
    offset = 0.0
    hits: list[float] = []
    for note_type in sequence:
        if note_type != "REST":
            hits.append(offset)
        offset += durations[note_type]
    return hits


def _pattern_options(track: dict[str, Any]) -> list[dict[str, Any]]:
    unit_two_sequences = [
        (candidate["pattern_id"], candidate["correct_sequence"])
        for candidate in RHYTHM_TRACKS
        if candidate["unit_id"] == 2 and candidate["question_type"] == "RHYTHM_PUZZLE"
    ]
    options = [
        {
            "pattern_id": pattern_id,
            "label": _sequence_label(sequence),
            "sequence": sequence,
            "grid_steps": 16,
            "hit_steps": _sequence_steps(sequence),
        }
        for pattern_id, sequence in unit_two_sequences
    ]
    correct_id = track["pattern_id"]
    if correct_id not in {option["pattern_id"] for option in options}:
        options.append(
            {
                "pattern_id": correct_id,
                "label": _sequence_label(track["correct_sequence"]),
                "sequence": track["correct_sequence"],
                "grid_steps": 16,
                "hit_steps": _sequence_steps(track["correct_sequence"]),
            }
        )
    random.shuffle(options)
    return options


def _count_options(correct_count: int) -> list[int]:
    candidates = {max(1, correct_count - 2), max(1, correct_count - 1), correct_count, correct_count + 1, correct_count + 2}
    options = sorted(candidates, key=lambda value: (abs(value - correct_count), value))[:4]
    if correct_count not in options:
        options[-1] = correct_count
    random.shuffle(options)
    return options


def _sequence_label(sequence: list[str]) -> str:
    names = {
        "WHOLE": "全",
        "HALF": "二分",
        "QUARTER": "四分",
        "EIGHTH": "八分",
        "SIXTEENTH": "十六分",
        "REST": "休止",
    }
    return " · ".join(names.get(note, note) for note in sequence)


def _producer_step_count(level: dict[str, Any]) -> int:
    return {1: 16, 2: 24, 3: 32, 4: 48}.get(level.get("difficulty", 1), 16)


def _producer_instrument_ids(level: dict[str, Any]) -> list[int]:
    difficulty = level.get("difficulty", 1)
    if difficulty <= 1:
        return [1, 2, 3, 4, 5]
    if difficulty == 2:
        return [1, 2, 3, 4, 5, 6, 7, 8]
    if difficulty == 3:
        return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    return [instrument["instrument_id"] for instrument in INSTRUMENTS]


def _scale_steps(base_steps: list[int], step_count: int) -> list[int]:
    scale = step_count / 16
    return sorted({min(step_count - 1, int(round(step * scale))) for step in base_steps})


def _producer_presets(step_count: int, available_ids: list[int]) -> list[dict[str, Any]]:
    base_presets = [
        {
            "preset_id": "steady-rock",
            "name": "稳定律动",
            "tracks": [
                {"instrument_id": 1, "steps": [0, 8]},
                {"instrument_id": 2, "steps": [4, 12]},
                {"instrument_id": 3, "steps": [0, 2, 4, 6, 8, 10, 12, 14]},
            ],
        },
        {
            "preset_id": "four-floor",
            "name": "四拍推进",
            "tracks": [
                {"instrument_id": 1, "steps": [0, 4, 8, 12]},
                {"instrument_id": 2, "steps": [4, 12]},
                {"instrument_id": 3, "steps": [0, 2, 4, 6, 8, 10, 12, 14]},
                {"instrument_id": 4, "steps": [12]},
            ],
        },
        {
            "preset_id": "syncopated-pop",
            "name": "切分律动",
            "requires_any": [6, 7],
            "tracks": [
                {"instrument_id": 1, "steps": [0, 6, 10]},
                {"instrument_id": 2, "steps": [4, 12]},
                {"instrument_id": 3, "steps": [0, 2, 4, 6, 8, 10, 12, 14]},
                {"instrument_id": 6, "steps": [3, 11]},
                {"instrument_id": 7, "steps": [1, 5, 9, 13]},
            ],
        },
        {
            "preset_id": "drum-fill",
            "name": "结尾加花",
            "requires_any": [9, 10, 11],
            "tracks": [
                {"instrument_id": 1, "steps": [0, 8]},
                {"instrument_id": 2, "steps": [4, 12]},
                {"instrument_id": 3, "steps": [0, 2, 4, 6, 8, 10, 12, 14]},
                {"instrument_id": 9, "steps": [13, 15]},
                {"instrument_id": 10, "steps": [14]},
                {"instrument_id": 11, "steps": [0]},
            ],
        },
    ]

    presets: list[dict[str, Any]] = []
    allowed = set(available_ids)
    for preset in base_presets:
        required = set(preset.get("requires_any", []))
        if required and not (required & allowed):
            continue
        tracks = [
            {
                "instrument_id": track["instrument_id"],
                "steps": _scale_steps(track["steps"], step_count),
            }
            for track in preset["tracks"]
            if track["instrument_id"] in allowed
        ]
        if tracks:
            public_preset = {key: value for key, value in preset.items() if key != "requires_any"}
            presets.append({**public_preset, "tracks": tracks})
    return presets


def _build_private_payload(track: dict[str, Any], level: dict[str, Any]) -> dict[str, Any]:
    question_type = track["question_type"]
    beat_ms = _beat_ms(track)

    if question_type == "RHYTHM_CLASSIFICATION":
        options = list(track["options"])
        random.shuffle(options)
        return {
            "audio_track_id": track["track_id"],
            "options": options,
            "correct_answer": track["correct_answer"],
        }

    if question_type == "ACCENT_DETECTION":
        expected = (
            _offsets_to_ms(track, track["expected_beat_offsets"])
            if "expected_beat_offsets" in track
            else _beats_to_ms(track, track["expected_beats"])
        )
        return {
            "beat_timeline": _beat_timeline(track),
            "beats_per_measure": track.get("beats_per_measure", int(track["time_signature"].split("/")[0])),
            "expected_hit_times_ms": expected,
        }

    if question_type == "RHYTHM_PUZZLE":
        note_types = ["WHOLE", "HALF", "QUARTER", "EIGHTH", "SIXTEENTH", "REST"]
        correct_id = track["pattern_id"]
        hit_count = len(_sequence_steps(track["correct_sequence"]))
        return {
            "note_pool": [
                {
                    "note_id": note_type.lower(),
                    "note_type": note_type,
                    "duration_ms": _note_duration_ms(note_type, beat_ms),
                }
                for note_type in note_types
            ],
            "count_options": _count_options(hit_count),
            "target_label": "高亮目标音",
            "correct_count": hit_count,
            "correct_pattern_id": correct_id,
            "correct_sequence": track["correct_sequence"],
        }

    if question_type == "RHYTHM_ECHO":
        expected = _offsets_to_ms(track, _sequence_offsets(track["correct_sequence"]))
        return {
            "beat_timeline": _beat_timeline(track),
            "echo_steps": _sequence_steps(track["correct_sequence"]),
            "grid_steps": 16,
            "expected_hit_times_ms": expected,
        }

    if question_type == "UPBEAT_TRAINING":
        expected = _offsets_to_ms(track, track["expected_beat_offsets"])
        return {
            "kick_timeline": _beat_timeline(track),
            "subdivision": track.get("subdivision", 2),
            "background_instrument": "kick",
            "expected_hit_times_ms": expected,
        }

    if question_type == "ANTI_DISTRACTION":
        return {
            "kick_timeline": _beat_timeline(track),
            "distraction_tracks": ["hat", "wood"],
            "time_signature": track["time_signature"],
            "expected_hit_times_ms": _beats_to_ms(track, track["expected_beats"]),
        }

    if question_type == "SPLIT_BRAIN":
        return {
            "ratio": track["ratio"],
            "left_expected_ms": _offsets_to_ms(track, track["left_beat_offsets"]),
            "right_expected_ms": _offsets_to_ms(track, track["right_beat_offsets"]),
        }

    step_count = _producer_step_count(level)
    available_ids = _producer_instrument_ids(level)
    quantize_grid_ms = max(1, beat_ms // 4)
    loop_duration_ms = quantize_grid_ms * step_count
    return {
        "available_instruments": available_ids,
        "groove_presets": _producer_presets(step_count, available_ids),
        "step_count": step_count,
        "loop_duration_ms": loop_duration_ms,
        "quantize_grid_ms": quantize_grid_ms,
        "quantize_grid_timestamps_ms": [step * quantize_grid_ms for step in range(step_count)],
    }


def _public_payload(payload: dict[str, Any]) -> dict[str, Any]:
    hidden_keys = {
        "correct_answer",
        "correct_count",
        "correct_pattern_id",
        "correct_sequence",
        "expected_hit_times_ms",
        "left_expected_ms",
        "right_expected_ms",
    }
    return {key: value for key, value in payload.items() if key not in hidden_keys}


def _timing_score(expected: list[int], user_times: list[int]) -> dict[str, Any]:
    if not expected:
        return {**_empty_detail(), "score": 0}

    remaining = sorted(user_times)
    deviations: list[int] = []
    hits = 0
    points = 0

    for expected_time in expected:
        if not remaining:
            deviations.append(0)
            continue

        closest = min(remaining, key=lambda time: abs(time - expected_time))
        deviation = abs(closest - expected_time)
        remaining.remove(closest)
        deviations.append(deviation)

        if deviation <= 100:
            hits += 1
            points += 100
        elif deviation <= 180:
            hits += 1
            points += 75
        elif deviation <= 280:
            hits += 1
            points += 45

    extra_taps = len(remaining)
    miss_count = len(expected) - hits + extra_taps
    score = max(0, min(100, int(points / max(1, len(expected) + extra_taps))))
    real_deviations = [deviation for deviation in deviations if deviation > 0]

    return {
        "score": score,
        "hit_count": hits,
        "miss_count": miss_count,
        "avg_deviation_ms": float(sum(real_deviations) / len(real_deviations)) if real_deviations else 0.0,
        "max_deviation_ms": max(real_deviations) if real_deviations else 0,
        "deviation_list": deviations,
    }


def _empty_detail(hit_count: int = 0, miss_count: int = 0) -> dict[str, Any]:
    return {
        "hit_count": hit_count,
        "miss_count": miss_count,
        "avg_deviation_ms": 0.0,
        "max_deviation_ms": 0,
        "deviation_list": [],
    }


def _merge_details(left: dict[str, Any], right: dict[str, Any]) -> dict[str, Any]:
    deviations = left.get("deviation_list", []) + right.get("deviation_list", [])
    real_deviations = [deviation for deviation in deviations if deviation > 0]
    return {
        "hit_count": left.get("hit_count", 0) + right.get("hit_count", 0),
        "miss_count": left.get("miss_count", 0) + right.get("miss_count", 0),
        "avg_deviation_ms": float(sum(real_deviations) / len(real_deviations)) if real_deviations else 0.0,
        "max_deviation_ms": max(real_deviations) if real_deviations else 0,
        "deviation_list": deviations,
    }


def _producer_score(loop_tracks: list[dict[str, Any]], quantize_grid_ms: int) -> tuple[int, dict[str, int]]:
    hits = [hit for track in loop_tracks for hit in track.get("hit_times_ms", [])]
    instruments = {track.get("instrument_id") for track in loop_tracks if track.get("hit_times_ms")}
    if not hits:
        return 0, {"precision": 0, "theory_logic": 0, "complexity": 0}

    deviations = [min(hit % quantize_grid_ms, quantize_grid_ms - (hit % quantize_grid_ms)) for hit in hits]
    avg_deviation = sum(deviations) / len(deviations)
    precision = max(0, min(100, int(100 - avg_deviation * 1.5)))
    has_kick = 1 in instruments
    has_snare = 2 in instruments
    has_timekeeper = bool({3, 7} & instruments)
    has_color = bool({4, 6, 8, 9, 10, 11} & instruments)
    theory_logic = min(
        100,
        35
        + (24 if has_kick else 0)
        + (18 if has_snare else 0)
        + (16 if has_timekeeper else 0)
        + (8 if has_color else 0)
        + min(14, len(set(hits)) * 2),
    )
    complexity = min(100, 32 + len(instruments) * 10 + min(38, len(set(hits)) * 2))
    score = int((precision + theory_logic + complexity) / 3)
    return score, {"precision": precision, "theory_logic": theory_logic, "complexity": complexity}


def _grade(score: int) -> str:
    if score >= 95:
        return "S"
    if score >= 80:
        return "A"
    if score >= 65:
        return "B"
    if score >= 50:
        return "C"
    return "F"


def _result(score: int, detail: dict[str, Any], radar_chart: dict[str, int] | None = None) -> dict[str, Any]:
    return {
        "score": score,
        "grade": _grade(score),
        "feedback": "节奏很稳，音频与点击目标已经对齐，继续保持。" if score >= 80 else "先跟着目标音色慢速点击，再逐渐只听底拍，会更容易稳定。",
        "is_passed": score >= 60,
        "statistics": {
            "hit_count": detail.get("hit_count", 0),
            "miss_count": detail.get("miss_count", 0),
            "avg_deviation_ms": detail.get("avg_deviation_ms", 0.0),
            "max_deviation_ms": detail.get("max_deviation_ms", 0),
            "deviation_list": detail.get("deviation_list", []),
        },
        "radar_chart": radar_chart,
        "reward": None,
    }
