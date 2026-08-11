from pathlib import Path

from app.core.config import settings


def upload_audio_path(request_id: str) -> Path:
    return settings.UPLOAD_DIR / f"{request_id}.wav"


def output_audio_path(request_id: str) -> Path:
    return settings.OUTPUT_DIR / f"{request_id}.wav"


def get_output_file(filename: str) -> Path:
    return settings.OUTPUT_DIR / filename


def output_file_exists(filename: str) -> bool:
    return get_output_file(filename).exists()
