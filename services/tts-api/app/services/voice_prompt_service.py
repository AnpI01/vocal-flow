import logging
import time

from fastapi import HTTPException, UploadFile

from app.core.config import settings
from app.engines.registry import get_engine
from app.schemas import VoicePromptResponse
from app.storage.local_storage import upload_audio_path

logger = logging.getLogger(__name__)


async def create_voice_clone_prompt(
    request_id: str,
    sample_audio: UploadFile,
    sample_transcript: UploadFile,
) -> VoicePromptResponse:
    start_time = time.time()
    logger.info("[%s] Voice prompt generation started", request_id)

    # --------------------------------
    # Validate audio
    # --------------------------------
    logger.info("[%s] Validating audio file: %s", request_id, sample_audio.filename)

    if not sample_audio.filename.lower().endswith(".wav"):
        logger.warning("[%s] Invalid audio format: %s", request_id, sample_audio.filename)
        raise HTTPException(status_code=400, detail="Only WAV files are supported")

    audio_bytes = await sample_audio.read()
    logger.info("[%s] Audio loaded size=%d bytes", request_id, len(audio_bytes))

    if len(audio_bytes) > settings.MAX_AUDIO_SIZE:
        logger.warning("[%s] Audio exceeds size limit size=%d", request_id, len(audio_bytes))
        raise HTTPException(status_code=400, detail="Audio file exceeds 20MB limit")

    # --------------------------------
    # Save reference audio
    # --------------------------------
    audio_path = upload_audio_path(request_id)
    logger.info("[%s] Saving reference audio path=%s", request_id, audio_path)

    with open(audio_path, "wb") as file:
        file.write(audio_bytes)

    # --------------------------------
    # Read transcript
    # --------------------------------
    transcript_bytes = await sample_transcript.read()
    transcript = transcript_bytes.decode("utf-8").strip()
    logger.info("[%s] Transcript loaded length=%d characters", request_id, len(transcript))

    if not transcript:
        logger.warning("[%s] Empty transcript received", request_id)
        raise HTTPException(status_code=400, detail="Transcript cannot be empty")

    # --------------------------------
    # Generate voice prompt via engine
    # --------------------------------
    logger.info("[%s] Starting voice prompt generation", request_id)

    engine = get_engine()
    engine.create_voice_prompt(
        request_id=request_id,
        audio_path=str(audio_path),
        transcript=transcript,
    )

    duration = time.time() - start_time
    logger.info("[%s] Voice prompt generation completed duration=%.2fs", request_id, duration)

    return VoicePromptResponse(success=True, request_id=request_id)
