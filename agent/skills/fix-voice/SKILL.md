---
name: fix-voice
description: Clean up and correct voice-to-text transcriptions. Use when the user prefixes with "fix voice:" or indicates voice/speech input. Handles repeated words, transcription errors, context-based corrections, and translates Chinese portions to English.
---

# Fix Voice

Process and clean up voice-to-text transcriptions by correcting common speech recognition errors and producing clear, corrected English output.

## Trigger Phrases

Activate this skill when the user prefixes with:

- "fix voice:"
- "fix voice"
- Or when the text clearly shows voice transcription artifacts (repetitions, fillers)

## Processing Steps

### 1. Remove Repetitions

Voice input often produces repeated words or phrases. Remove duplicates:

**Before:** "I want to to to create a new file"
**After:** "I want to create a new file"

**Before:** "so you need to after the correction to translate to English"
**After:** "after the correction, translate to English"

### 2. Remove Filler Words

Clean up common speech fillers that don't add meaning:

- "um", "uh", "er"
- "like" (when used as filler)
- "you know"
- "basically"
- "actually" (when redundant)
- "so" at the start of sentences (when unnecessary)
- "or or or" → "or"

### 3. Fix Transcription Errors

Correct misheard words based on context:

| Common Error                  | Likely Intended                |
| ----------------------------- | ------------------------------ |
| "their" / "there" / "they're" | Choose based on context        |
| "your" / "you're"             | Choose based on context        |
| "its" / "it's"                | Choose based on context        |
| Homophones                    | Resolve using sentence meaning |

### 4. Translate Chinese to English

If the input contains Chinese characters (混合中英文), translate the Chinese portions to English while preserving the English parts.

**Before:** "我想要 create a new 文件"
**After:** "I want to create a new file"

**Before:** "请帮我修改这个 function"
**After:** "Please help me modify this function"

### 5. Improve Grammar and Structure

- Fix sentence structure issues
- Add proper punctuation
- Capitalize appropriately
- Form coherent sentences from fragmented speech

## Output Format

Provide the corrected text in a clear format:

```
**Corrected:**
[The clean, corrected English text]
```

If significant changes were made, optionally show what was fixed:

```
**Corrected:**
[The clean, corrected English text]

**Changes made:**
- Removed repeated words: "to to to" → "to"
- Translated Chinese: "文件" → "file"
- Fixed grammar: added comma after "correction"
```

## Examples

### Example 1: Repetition and fillers

**Input:** "voice input: I want to to to um create a a new function that that handles the the user input"

**Output:**

```
**Corrected:**
I want to create a new function that handles the user input.
```

### Example 2: Mixed Chinese-English

**Input:** "voice: 我需要你帮我 fix this bug，这个 error 是关于 null pointer 的"

**Output:**

```
**Corrected:**
I need you to help me fix this bug. This error is about null pointer.
```

### Example 3: Complex correction

**Input:** "voice input: so basically I I was thinking that maybe we could we could like add a new a new feature that that allows users to to to upload there files"

**Output:**

```
**Corrected:**
I was thinking that we could add a new feature that allows users to upload their files.

**Changes made:**
- Removed filler words: "so basically", "like", "maybe"
- Removed repetitions: "I I", "we could we could", "a new a new", "that that", "to to to"
- Fixed homophone: "there" → "their"
```
