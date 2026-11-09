//! Studio local — Docker Desktop + `supabase start` sur la machine (ADR 0013 / 0014).
//! Commande nommée allowlistée : pas de shell libre.

use crate::elsa_paths;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};
use tauri::AppHandle;

const STUDIO_HOST: &str = "127.0.0.1";
const STUDIO_PORT: u16 = 54323;
const STUDIO_URL: &str = "http://127.0.0.1:54323/project/default";
const DOCKER_WAIT: Duration = Duration::from_secs(90);
const DOCKER_POLL: Duration = Duration::from_secs(2);
const STUDIO_WAIT: Duration = Duration::from_secs(180);
const STUDIO_POLL: Duration = Duration::from_secs(2);

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioEnsureResult {
    pub studio_url: String,
    pub already_running: bool,
    pub started_docker: bool,
}

fn augmented_path() -> String {
    let extra = [
        "/opt/homebrew/bin",
        "/usr/local/bin",
        "/usr/bin",
        "/bin",
        "/Applications/Docker.app/Contents/Resources/bin",
    ];
    let current = std::env::var("PATH").unwrap_or_default();
    format!("{}:{current}", extra.join(":"))
}

fn command(program: &str) -> Command {
    let mut cmd = Command::new(program);
    cmd.env("PATH", augmented_path());
    cmd
}

fn studio_port_open() -> bool {
    let addr = format!("{STUDIO_HOST}:{STUDIO_PORT}");
    let Ok(sock) = addr.parse() else {
        return false;
    };
    TcpStream::connect_timeout(&sock, Duration::from_millis(700)).is_ok()
}

fn docker_info_ok() -> bool {
    command("docker")
        .arg("info")
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()
        .map(|s| s.success())
        .unwrap_or(false)
}

fn ensure_docker() -> Result<bool, String> {
    if docker_info_ok() {
        return Ok(false);
    }

    let opened = command("open")
        .args(["-a", "Docker"])
        .status()
        .map(|s| s.success())
        .unwrap_or(false);
    if !opened {
        let alt = command("open")
            .arg("/Applications/Docker.app")
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
        if !alt {
            return Err("docker_missing".into());
        }
    }

    let deadline = Instant::now() + DOCKER_WAIT;
    while Instant::now() < deadline {
        if docker_info_ok() {
            return Ok(true);
        }
        std::thread::sleep(DOCKER_POLL);
    }
    Err("docker_start_failed".into())
}

fn find_supabase_bin() -> PathBuf {
    for candidate in [
        "/opt/homebrew/bin/supabase",
        "/usr/local/bin/supabase",
        "supabase",
    ] {
        if command(candidate)
            .arg("--version")
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .status()
            .map(|s| s.success())
            .unwrap_or(false)
        {
            return PathBuf::from(candidate);
        }
    }
    PathBuf::from("supabase")
}

fn text_suggests_stack_up(text: &str) -> bool {
    let lower = text.to_ascii_lowercase();
    lower.contains("api url")
        || lower.contains("studio")
        || lower.contains("54323")
        || lower.contains("54331")
}

fn supabase_status_running(cwd: &Path) -> bool {
    let bin = find_supabase_bin();
    let Ok(out) = command(&bin.to_string_lossy())
        .arg("status")
        .current_dir(cwd)
        .output()
    else {
        return false;
    };
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    out.status.success() && text_suggests_stack_up(&text)
}

fn classify_supabase_output(stdout: &str, stderr: &str) -> String {
    let text = format!("{stderr}\n{stdout}").to_ascii_lowercase();
    if text.contains("address already in use")
        || text.contains("ports are not available")
        || text.contains("bind: address")
    {
        return "port_in_use".into();
    }
    "supabase_start_failed".into()
}

fn start_supabase(cwd: &Path) -> Result<(), String> {
    if studio_port_open() || supabase_status_running(cwd) {
        return Ok(());
    }

    let bin = find_supabase_bin();
    let output = command(&bin.to_string_lossy())
        .arg("start")
        .current_dir(cwd)
        .output()
        .map_err(|_| "supabase_start_failed".to_string())?;

    if output.status.success() {
        return Ok(());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    let reason = classify_supabase_output(&stdout, &stderr);
    if reason == "port_in_use" && studio_port_open() {
        return Ok(());
    }
    Err(reason)
}

fn wait_studio_ready() -> Result<(), String> {
    let deadline = Instant::now() + STUDIO_WAIT;
    while Instant::now() < deadline {
        if studio_port_open() {
            return Ok(());
        }
        std::thread::sleep(STUDIO_POLL);
    }
    Err("not_running".into())
}

fn ensure_studio_sync(app: &AppHandle) -> Result<StudioEnsureResult, String> {
    if studio_port_open() {
        return Ok(StudioEnsureResult {
            studio_url: STUDIO_URL.to_string(),
            already_running: true,
            started_docker: false,
        });
    }

    let repo = elsa_paths::resolve_repo_root(app)?;
    let started_docker = ensure_docker()?;
    start_supabase(&repo)?;
    wait_studio_ready()?;

    Ok(StudioEnsureResult {
        studio_url: STUDIO_URL.to_string(),
        already_running: false,
        started_docker,
    })
}

/// Démarre Docker + stack Supabase si besoin, puis confirme `:54323`.
#[tauri::command]
pub async fn studio_ensure(app: AppHandle) -> Result<StudioEnsureResult, String> {
    tauri::async_runtime::spawn_blocking(move || ensure_studio_sync(&app))
        .await
        .map_err(|e| format!("studio_join:{e}"))?
}
