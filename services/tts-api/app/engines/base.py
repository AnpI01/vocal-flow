from abc import ABC, abstractmethod


class TTSEngine(ABC):
    """Abstract interface every TTS engine implementation must satisfy.

    Swapping models later (Qwen -> something else) means writing a new
    class here and pointing engines/registry.py at it. Nothing in
    services/, storage/, or main.py should ever import a concrete
    engine directly.
    """

    @abstractmethod
    def load(self) -> None:
        """Load the underlying model into memory. Called once at startup."""
        raise NotImplementedError

    @abstractmethod
    def create_voice_prompt(self, request_id: str, audio_path: str, transcript: str) -> str:
        """Create (or reuse a cached) voice-clone prompt. Returns a prompt key."""
        raise NotImplementedError

    @abstractmethod
    def generate_voice(self, request_id: str, script_text: str, output_path: str, language: str) -> dict:
        """Generate cloned-voice audio from a script. Returns generation metadata."""
        raise NotImplementedError

    @abstractmethod
    def generate_default_voice(self, script_text: str, output_path: str, speaker_def: str, language: str) -> dict:
        """Generate audio using a built-in/default speaker (no cloning)."""
        raise NotImplementedError

    @property
    @abstractmethod
    def device(self) -> str:
        raise NotImplementedError
