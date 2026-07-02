# useBeep Tests

## Purpose

Verify the `useBeep` hook creates an AudioContext, plays an 800Hz tone for 300ms, and fails gracefully when audio is unavailable.

## Requirements

### Requirement: BEEP-1 — AudioContext creation

The `beep()` function MUST create an AudioContext, configure an oscillator at 800Hz with gain 0.3, and schedule a 300ms tone.

#### Scenario: Beep creates and connects AudioContext
- GIVEN `useBeep()` with `window.AudioContext` mocked
- WHEN `beep()` is called
- THEN a new `AudioContext` is created, oscillator and gain are configured and connected

### Requirement: BEEP-2 — Graceful fallback

The `beep()` function MUST NOT throw when AudioContext is unavailable or throws on construction.

#### Scenario: AudioContext not available
- GIVEN `useBeep()` with `window.AudioContext` deleted
- WHEN `beep()` is called
- THEN no error is thrown (caught silently)

#### Scenario: AudioContext throws on construction
- GIVEN `useBeep()` with `AudioContext` constructor throwing
- WHEN `beep()` is called
- THEN no error is thrown

### Requirement: BEEP-3 — webkitAudioContext fallback

The hook MUST handle `window.webkitAudioContext` as a fallback for Safari compatibility.

#### Scenario: webkitAudioContext used when AudioContext absent
- GIVEN `useBeep()` with `window.AudioContext` undefined and `window.webkitAudioContext` defined
- WHEN `beep()` is called
- THEN `webkitAudioContext` is used successfully

### Requirement: BEEP-4 — Idempotent calls

Multiple sequential `beep()` calls MUST NOT throw or leak state.

#### Scenario: Multiple beeps
- GIVEN `useBeep()` with mocked AudioContext
- WHEN `beep()` is called 3 times
- THEN each call succeeds without throwing
