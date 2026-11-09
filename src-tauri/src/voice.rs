//! Bridge TTS — `invoke` → Piper loopback `127.0.0.1:5911` (ADR 0012 / 0014).
//! Jamais de bind `0.0.0.0` ; pas de fetch cross-origin depuis l’UI https.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::time::Duration;

const PIPER_SYNTHESIZE_URL: &str = "http://127.0.0.1:5911/synthesize";
const MAX_TEXT_CHARS: usize = 4096;
const TIMEOUT_SECS: u64 = 60;

#[derive(Debug, serde::Serialize)]
struct PiperBody<'a> {
    text: &'a str,
}

/// Synthèse WAV (base64) via Piper HTTP local.
/// Args plats `{ text }` — aligné `webview_pane_*` / invoke front.
#[tauri::command]
pub async fn voice_speak(text: String) -> Result<String, String> {
    let text = text.trim();
    if text.is_empty() || text.chars().count() > MAX_TEXT_CHARS {
        return Err("voice_text_invalid".into());
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(TIMEOUT_SECS))
        .build()
        .map_err(|e| format!("voice_client: {e}"))?;

    let response = client
        .post(PIPER_SYNTHESIZE_URL)
        .header("Content-Type", "application/json")
        .json(&PiperBody { text })
        .send()
        .await
        .map_err(|e| format!("voice_upstream: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("voice_http_{}", response.status().as_u16()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("voice_body: {e}"))?;
    if bytes.is_empty() {
        return Err("voice_empty_wav".into());
    }

    Ok(B64.encode(bytes))
}

/// Annulation synthesize in-flight — V0 : no-op (stop lecture = AbortSignal front).
#[tauri::command]
pub async fn voice_stop() -> Result<(), String> {
    Ok(())
}
