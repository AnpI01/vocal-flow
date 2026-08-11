import logging

from fastapi import HTTPException

from app.engines.registry import get_engine
from app.schemas import GenerationMetadata, VoiceGenerationResponse
from app.storage.local_storage import output_audio_path

logger = logging.getLogger(__name__)

# Separator between the voice's cached-prompt id and this specific
# generation's transaction id. UUIDs only contain hyphens/alphanumerics,
# so "::" can never collide with either half.
REQUEST_ID_SEPARATOR = "::"
 
def split_request_id(combined_id: str) -> tuple[str, str]:
    """
    Splits a combined "<voice_request_id>::<transaction_id>" string.
 
    voice_request_id - looks up the cached voice-clone prompt (must match
                        whatever was used when the voice was created via /prompt)
    transaction_id    - unique per generation call, used only to name the
                        output file so concurrent/repeat generations for the
                        same voice never overwrite each other
    """
    if REQUEST_ID_SEPARATOR not in combined_id:
        raise HTTPException(
            status_code=400,
            detail=(
                "request_id must be formatted as "
                f"'<voice_request_id>{REQUEST_ID_SEPARATOR}<transaction_id>'"
            ),
        )
 
    voice_request_id, _, transaction_id = combined_id.partition(REQUEST_ID_SEPARATOR)
 
    if not voice_request_id or not transaction_id:
        raise HTTPException(
            status_code=400,
            detail="Both voice_request_id and transaction_id must be non-empty",
        )
 
    return voice_request_id, transaction_id

async def generate_cloned_voice(
    request_id: str,
    script_text: str,
    script_lang: str,
) -> VoiceGenerationResponse:
    voice_request_id, transaction_id = split_request_id(request_id)
 
    output_path = output_audio_path(transaction_id)
    engine = get_engine()
 
    try:
        result = engine.generate_voice(
            request_id=voice_request_id,
            script_text=script_text,
            output_path=str(output_path),
            language=script_lang,
        )
    except ValueError as exc:
        # Bad input (unsupported language, script too long) -> 400, not 500
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception("[%s] Error during voice generation", request_id)
        raise HTTPException(status_code=500, detail=str(exc))
 
    logger.info("[%s] Generation completed (transaction=%s)", voice_request_id, transaction_id)
 
    return VoiceGenerationResponse(
        success=True,
        request_id=request_id,
        audio_file=output_path.name,
        metadata=GenerationMetadata(
            duration_seconds=result["duration_seconds"],
            generation_time_seconds=result["generation_time_seconds"],
            sentences_generated=result.get("sentences_generated"),
        ),
    )

    # --------------------------------
    # default voice requires custom voice Qwen model like Qwen3-TTS-12Hz-1.7B-CustomVoice
    # --------------------------------

async def generate_default_voice(
    request_id: str,
    speaker_def: str,
    script_text: str,
    script_lang: str,
) -> VoiceGenerationResponse:
    output_path = output_audio_path(request_id)
    engine = get_engine()

    try:
        result = engine.generate_default_voice(
            script_text=script_text,
            output_path=str(output_path),
            speaker_def=speaker_def,
            language=script_lang,
        )
    except Exception as exc:
        logger.exception("[%s] Error during default voice generation", request_id)
        raise HTTPException(status_code=500, detail=str(exc))

    logger.info("[%s] Default generation completed", request_id)

    return VoiceGenerationResponse(
        success=True,
        request_id=request_id,
        audio_file=output_path.name,
        metadata=GenerationMetadata(
            duration_seconds=result["duration_seconds"],
            generation_time_seconds=result["generation_time_seconds"],
        ),
    )
