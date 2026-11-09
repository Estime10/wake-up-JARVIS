//! Bridge TTS — `invoke` → Piper loopback `127.0.0.1:5911` (ADR 0012 / 0014).
//! Runtime : Application Support (bootstrap auto) ou repo DX.
//! Jamais de bind `0.0.0.0` ; pas de fetch cross-origin depuis l’UI https.

use crate::piper_runtime::{self, PiperPaths};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::net::TcpStream;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager};

const PIPER_HOST: &str = "127.0.0.1";
const PIPER_PORT: u16 = 5911;
const PIPER_SYNTHESIZE_URL: &str = "http://127.0.0.1:5911/synthesize";
const MAX_TEXT_CHARS: usize = 4096;
const TIMEOUT_SECS: u64 = 60;
const READY_ATTEMPTS: u32 = 80;
const READY_GAP_MS: u64 = 250;

#[derive(Debug, serde::Serialize)]
struct PiperBody<'a> {
    text: &'a str,
}

/// Process Waitress Piper (un seul, géré par le shell).
pub struct PiperProcess(pub Mutex<Option<Child>>);

fn piper_listening() -> bool {
    let addr = format!("{PIPER_HOST}:{PIPER_PORT}");
    let Ok(sock_addr) = addr.parse() else {
        return false;
    };
    TcpStream::connect_timeout(&sock_addr, Duration::from_millis(400)).is_ok()
}

fn spawn_piper(app: &AppHandle, paths: &PiperPaths) -> Result<(), String> {
    let state = app.state::<PiperProcess>();
    let mut guard = state.0.lock().map_err(|_| "piper_lock")?;

    if let Some(child) = guard.as_mut() {
        match child.try_wait() {
            Ok(None) if piper_listening() => return Ok(()),
            Ok(Some(_)) | Err(_) => {
                *guard = None;
            }
            Ok(None) => {
                return Ok(());
            }
        }
    }

    let child = Command::new(&paths.python)
        .arg(&paths.script)
        .arg("--model")
        .arg(&paths.model)
        .arg("--host")
        .arg(PIPER_HOST)
        .arg("--port")
        .arg(PIPER_PORT.to_string())
        .current_dir(&paths.root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
        .map_err(|e| format!("piper_spawn: {e}"))?;
    *guard = Some(child);
    Ok(())
}

async fn ensure_piper(app: &AppHandle) -> Result<(), String> {
    if piper_listening() {
        return Ok(());
    }
    let paths = piper_runtime::resolve_ready(app)?;
    spawn_piper(app, &paths)?;
    for _ in 0..READY_ATTEMPTS {
        if piper_listening() {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(READY_GAP_MS));
    }
    Err("piper_start_timeout".into())
}

/// Warm-up runtime (venv/modèle) au lancement — thread dédié.
pub fn warm_piper(app: &AppHandle) {
    piper_runtime::warm(app);
}

/// Arrête le process Waitress spawné par le shell (pas un Piper externe).
pub fn shutdown_piper(app: &AppHandle) {
    let Some(state) = app.try_state::<PiperProcess>() else {
        return;
    };
    let Ok(mut guard) = state.0.lock() else {
        return;
    };
    if let Some(mut child) = guard.take() {
        let _ = child.kill();
        let _ = child.wait();
    }
}

/// Synthèse WAV (base64) via Piper HTTP local.
#[tauri::command]
pub async fn voice_speak(app: AppHandle, text: String) -> Result<String, String> {
    let text = text.trim();
    if text.is_empty() || text.chars().count() > MAX_TEXT_CHARS {
        return Err("voice_text_invalid".into());
    }

    ensure_piper(&app).await?;

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
