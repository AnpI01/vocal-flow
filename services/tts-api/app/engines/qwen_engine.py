import os
import time
import pickle
import threading

import numpy as np
import soundfile as sf
import torch

from qwen_tts import Qwen3TTSModel

from app.core.config import settings
from app.engines.base import TTSEngine
from app.engines.text_processing import parse_script, build_instruction


def _detect_device() -> str:
    if torch.cuda.is_available():
        print(f"GPU detected: {torch.cuda.get_device_name(0)}")
        return "cuda"
    print("Running on CPU")
    return "cpu"


class QwenTTSEngine(TTSEngine):
    """Wraps Qwen3-TTS model loading, voice-clone prompts, and generation.

    All Qwen-specific details (model class, dtype selection, the
    generate_voice_clone/generate_custom_voice call signatures) are
    contained here. Nothing outside this file should import qwen_tts.
    """

    def __init__(self):
        self._model = None
        self._device = _detect_device()
        self._lock = threading.Lock()

    @property
    def device(self) -> str:
        return self._device

    def load(self) -> None:
        if self._model is None:
            print("Loading Qwen3-TTS model...")
            self._model = Qwen3TTSModel.from_pretrained(
                settings.MODEL_NAME,
                device_map=self._device,
                dtype=torch.float16 if self._device == "cuda" else torch.float32,
            )
            print("Qwen3-TTS model ready")

    def _get_model(self):
        if self._model is None:
            self.load()
        return self._model

    # ------------------------------------------------------------
    # Voice clone prompt
    # ------------------------------------------------------------

    def _cache_path(self, key: str) -> str:
        return os.path.join(settings.CACHE_DIR, f"{key}.pkl")

    def _get_cached_prompt(self, key: str):
        cache_file = self._cache_path(key)
        if not os.path.exists(cache_file):
            return None
        with open(cache_file, "rb") as file:
            return pickle.load(file)

    def create_voice_prompt(self, request_id: str, audio_path: str, transcript: str) -> str:
        key = request_id
        cache_file = self._cache_path(key)

        if os.path.exists(cache_file):
            print("Using cached voice prompt")
            return key

        print("Creating voice prompt")
        model = self._get_model()

        prompt = model.create_voice_clone_prompt(
            ref_audio=audio_path,
            ref_text=transcript,
        )

        with open(cache_file, "wb") as file:
            pickle.dump(prompt, file)

        return key

    # ------------------------------------------------------------
    # Cloned-voice generation
    # ------------------------------------------------------------

    def generate_voice(
        self,
        request_id: str,
        script_text: str,
        output_path: str,
        language: str = "English",
        sentence_gap: float = 0.3,
        paragraph_gap: float = 0.7,
    ) -> dict:
        start_time = time.time()

        if language not in settings.SUPPORTED_LANGUAGES:
            raise ValueError("Unsupported language")

        if len(script_text) > settings.MAX_SCRIPT_LENGTH:
            raise ValueError("Script too long")

        units = parse_script(script_text)
        sentences = [u for u in units if u[0] == "sentence"]

        voice_prompt = self._get_cached_prompt(request_id)
        model = self._get_model()

        audio_parts = []
        sample_rate = 24000

        with self._lock:
            for unit_type, character, text in units:
                if unit_type == "paragraph_break":
                    audio_parts.append(np.zeros(int(paragraph_gap * sample_rate)))
                    continue

                instruction = build_instruction(character, text)

                try:
                    wavs, sample_rate = model.generate_voice_clone(
                        text=text,
                        language=language,
                        voice_clone_prompt=voice_prompt,
                        instruct=instruction,
                    )
                except TypeError:
                    wavs, sample_rate = model.generate_voice_clone(
                        text=text,
                        language=language,
                        voice_clone_prompt=voice_prompt,
                    )

                audio_parts.append(wavs[0])
                audio_parts.append(np.zeros(int(sentence_gap * sample_rate)))

        combined_audio = np.concatenate(audio_parts)
        sf.write(output_path, combined_audio, sample_rate)

        duration = len(combined_audio) / sample_rate

        return {
            "output_file": output_path,
            "duration_seconds": round(duration, 2),
            "sentences_generated": len(sentences),
            "generation_time_seconds": round(time.time() - start_time, 2),
        }

    # ------------------------------------------------------------
    # Default/built-in speaker generation
    # ------------------------------------------------------------

    def generate_default_voice(
        self,
        script_text: str,
        output_path: str,
        speaker_def: str,
        language: str = "English",
    ) -> dict:
        start_time = time.time()
        model = self._get_model()

        wavs, sample_rate = model.generate_custom_voice(
            text=script_text,
            language=language,
            speaker=speaker_def,
        )

        sf.write(output_path, wavs, sample_rate)

        duration = len(wavs) / sample_rate

        return {
            "output_file": output_path,
            "duration_seconds": round(duration, 2),
            "generation_time_seconds": round(time.time() - start_time, 2),
        }
