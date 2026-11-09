//! Bridge TTS — `invoke` → Piper loopback `127.0.0.1:5911` (ADR 0012 / 0014).
//! Spawn Waitress (`scripts/piper_waitress_server.py`) si le port est down.
//! Jamais de bind `0.0.0.0` ; pas de fetch cross-origin depuis l’UI https.

use base64::{engine::general_purpose::STANDARD as B64, Engine};
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Manager};

const PIPER_HOST: &str = "127.0.0.1";
const PIPER_PORT: u16 = 5911;
const PIPER_SYNTHESIZE_URL: &str = "http://127.0.0.1:5911/synthesize";
const MAX_TEXT_CHARS: usize = 4096;
const TIMEOUT_SECS: u64 = 60;
const READY_ATTEMPTS: u32 = 40;
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

fn resolve_repo_root(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(root) = std::env::var("ELSA_ROOT") {
        let path = PathBuf::from(root);
        if looks_like_repo(&path) {
            return Ok(path);
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        if looks_like_repo(&cwd) {
            return Ok(cwd);
        }
        if looks_like_repo(&cwd.join("..")) {
            return cwd
                .join("..")
                .canonicalize()
                .map_err(|e| format!("piper_root: {e}"));
        }
    }
    if let Ok(resource) = app.path().resource_dir() {
        if looks_like_repo(&resource) {
            return Ok(resource);
        }
    }
    Err("piper_root_missing".into())
}

fn looks_like_repo(root: &Path) -> bool {
    root.join("scripts/piper_waitress_server.py").is_file()
        && root
            .join("models/piper/fr_FR-siwis-medium.onnx")
            .is_file()
}

fn spawn_piper(app: &AppHandle) -> Result<(), String> {
    let root = resolve_repo_root(app)?;
    let python = root.join(".venv-piper/bin/python");
    let script = root.join("scripts/piper_waitress_server.py");
    let model = root.join("models/piper/fr_FR-siwis-medium.onnx");

    if !python.is_file() {
        return Err("piper_venv_missing".into());
    }
    if !script.is_file() {
        return Err("piper_script_missing".into());
    }
    if !model.is_file() {
        return Err("piper_model_missing".into());
    }

    let state = app.state::<PiperProcess>();
    let mut guard = state.0.lock().map_err(|_| "piper_lock")?;

    if let Some(child) = guard.as_mut() {
        match child.try_wait() {
            Ok(None) if piper_listening() => return Ok(()),
            Ok(Some(_)) | Err(_) => {
                *guard = None;
            }
            Ok(None) => {
                // Process vivant mais port pas prêt → on attend côté ensure.
                return Ok(());
            }
        }
    }

    let child = Command::new(&python)
        .arg(&script)
        .arg("--model")
        .arg(&model)
        .arg("--host")
        .arg(PIPER_HOST)
        .arg("--port")
        .arg(PIPER_PORT.to_string())
        .current_dir(&root)
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
    spawn_piper(app)?;
    for _ in 0..READY_ATTEMPTS {
        if piper_listening() {
            return Ok(());
        }
        std::thread::sleep(Duration::from_millis(READY_GAP_MS));
    }
    Err("piper_start_timeout".into())
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
