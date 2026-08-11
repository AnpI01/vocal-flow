from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

from app.core.security import verify_api_key
from app.engines.registry import get_engine
from app.schemas import VoiceGenerationResponse, VoicePromptResponse
from app.services.voice_generation_service import generate_cloned_voice, generate_default_voice
from app.services.voice_prompt_service import create_voice_clone_prompt
from app.storage.local_storage import get_output_file, output_file_exists


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing voice generation service...")
    get_engine().load()
    print("Voice generation service ready")
    yield


app = FastAPI(
    title="Voice Clone Inference Service",
    description="Private Qwen3-TTS voice generation service",
    version="1.0.0",
    lifespan=lifespan,
)


# ============================================================
# Health
# ============================================================

@app.get("/")
def root():
    return {"service": "voice-clone-inference", "status": "running"}


@app.get("/health")
def health():
    engine = get_engine()
    return {"status": "ok", "model": "Qwen3-TTS-12Hz-1.7B", "device": engine.device}


# ============================================================
# Create voice-clone prompt
# ============================================================

@app.post("/prompt", response_model=VoicePromptResponse)
async def prompt_endpoint(
    request_id: str = Form(...),
    sample_audio: UploadFile = File(...),
    sample_transcript: UploadFile = File(...),
    _: None = Depends(verify_api_key),
):
    return await create_voice_clone_prompt(
        request_id=request_id,
        sample_audio=sample_audio,
        sample_transcript=sample_transcript,
    )


# ============================================================
# Generate cloned voice
# ============================================================

@app.post("/generate", response_model=VoiceGenerationResponse)
async def generate_endpoint(
    request_id: str = Form(...),
    script_text: str = Form(...),
    script_lang: str = Form(...),
    _: None = Depends(verify_api_key),
):
    return await generate_cloned_voice(
        request_id=request_id,
        script_text=script_text,
        script_lang=script_lang,
    )


# ============================================================
# Generate with a default/built-in speaker
# ============================================================

@app.post("/default", response_model=VoiceGenerationResponse)
async def default_endpoint(
    request_id: str = Form(...),
    speaker_def: str = Form(...),
    script_text: str = Form(...),
    script_lang: str = Form(...),
    _: None = Depends(verify_api_key),
):
    return await generate_default_voice(
        request_id=request_id,
        speaker_def=speaker_def,
        script_text=script_text,
        script_lang=script_lang,
    )


# ============================================================
# Audio retrieval
# ============================================================

@app.get("/audio/{filename}")
def get_audio(filename: str, _: None = Depends(verify_api_key)):
    if not output_file_exists(filename):
        raise HTTPException(status_code=404, detail="Audio file not found")

    return FileResponse(
        path=str(get_output_file(filename)),
        media_type="audio/wav",
        filename=filename,
    )
