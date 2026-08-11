import os
from pathlib import Path


class Settings:
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent

    UPLOAD_DIR: Path = BASE_DIR / "temp" / "uploads"
    OUTPUT_DIR: Path = BASE_DIR / "temp" / "outputs"
    CACHE_DIR: Path = Path(os.getenv("VOICE_CACHE_DIR", str(BASE_DIR / "cache")))

    API_KEY: str = os.getenv("API_KEY", "api key")
    # NOTE: os.getenv always returns a str when the var IS set, so this must
    # be cast to int explicitly or "20 > MAX_AUDIO_SIZE" comparisons break
    # the moment someone sets MAX_AUDIO_SIZE in the environment.
    MAX_AUDIO_SIZE: int = int(os.getenv("MAX_AUDIO_SIZE", 20 * 1024 * 1024))

    MODEL_NAME: str = os.getenv("MODEL_NAME", "Qwen/Qwen3-TTS-12Hz-1.7B-Base")

    MAX_SCRIPT_LENGTH: int = 5000
    SUPPORTED_LANGUAGES = ["English", "Chinese", "Japanese", "Korean"]


settings = Settings()

settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
settings.CACHE_DIR.mkdir(parents=True, exist_ok=True)
