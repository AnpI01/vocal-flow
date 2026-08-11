import re

CHARACTERS = {
    "DEFAULT": {
        "desc": "Professional narrator",
        "instruct": "Confident and warm tone, clear articulation, professional narrator style",
    },
    "NARRATOR": {
        "desc": "Documentary narrator",
        "instruct": "Deep authoritative tone, measured pace, documentary narration style",
    },
    "EXPERT": {
        "desc": "Subject matter expert",
        "instruct": "Knowledgeable precise tone, confident explanation style",
    },
    "EXCITED": {
        "desc": "Energetic presenter",
        "instruct": "Energetic enthusiastic tone, fast lively delivery",
    },
    "SERIOUS": {
        "desc": "Serious delivery",
        "instruct": "Serious measured tone, strong emphasis",
    },
    "FRIENDLY": {
        "desc": "Friendly guide",
        "instruct": "Warm friendly conversational tone",
    },
    "DRAMATIC": {
        "desc": "Dramatic storyteller",
        "instruct": "Cinematic dramatic storytelling style",
    },
    "CURIOUS": {
        "desc": "Curious tone",
        "instruct": "Curious questioning delivery",
    },
    "CALM": {
        "desc": "Calm voice",
        "instruct": "Calm soothing slow delivery",
    },
    "WHISPER": {
        "desc": "Whisper style",
        "instruct": "Quiet intimate whisper delivery",
    },
}


def clean_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def parse_script_line(line: str):
    line = line.strip()
    if not line:
        return None, None

    match = re.match(r"^\[([A-Z]+)\]\s*(.*)", line)
    if match:
        character = match.group(1).upper()
        text = match.group(2).strip()
        if character not in CHARACTERS:
            character = "DEFAULT"
        return character, text

    return "DEFAULT", line


def parse_script(script: str):
    units = []
    paragraphs = script.split("\n\n")

    for index, paragraph in enumerate(paragraphs):
        paragraph = paragraph.strip()
        if not paragraph:
            continue

        for line in paragraph.split("\n"):
            character, text = parse_script_line(line)
            if text is None:
                continue

            sentences = re.split(r"(?<=[.!?])\s+", text)
            for sentence in sentences:
                sentence = clean_sentence(sentence)
                if sentence:
                    units.append(("sentence", character, sentence))

        if index < len(paragraphs) - 1:
            units.append(("paragraph_break", None, ""))

    return units


def build_instruction(character: str, sentence: str) -> str:
    instruction = CHARACTERS.get(character, CHARACTERS["DEFAULT"])["instruct"]

    if sentence.endswith("?"):
        instruction += ", rising questioning ending"
    elif sentence.endswith("!"):
        instruction += ", energetic emphasis"

    return instruction
