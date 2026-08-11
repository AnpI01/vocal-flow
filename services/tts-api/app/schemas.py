from typing import Optional

from pydantic import BaseModel


class VoicePromptResponse(BaseModel):
    success: bool
    request_id: str


class GenerationMetadata(BaseModel):
    duration_seconds: float
    generation_time_seconds: float
    sentences_generated: Optional[int] = None


class VoiceGenerationResponse(BaseModel):
    success: bool
    request_id: str
    audio_file: str
    metadata: GenerationMetadata
