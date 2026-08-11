from functools import lru_cache

from app.engines.base import TTSEngine
from app.engines.qwen_engine import QwenTTSEngine


@lru_cache
def get_engine() -> TTSEngine:
    """Returns the singleton TTS engine instance.

    To swap models later, add a new engine class under app/engines/
    and change what's returned here. Callers never import a concrete
    engine directly - they only ever call get_engine().
    """
    return QwenTTSEngine()
