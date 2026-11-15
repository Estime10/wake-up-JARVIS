//! Studio local — Docker Desktop + `supabase start` sur la machine (ADR 0013 / 0014).
//! Étapes séquentielles (docker → stack → sync) — pas de shell libre.

use crate::elsa_paths;
use std::fs;
use std::net::TcpStream;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::time::{Duration, Instant};
use tauri::AppHandle;

const STUDIO_HOST: &str = "127.0.0.1";
const STUDIO_PORT: u16 = 54323;
const STUDIO_URL: &str = "http://127.0.0.1:54323/project/default/editor";
const DOCKER_WAIT: Duration = Duration::from_secs(90);
const DOCKER_POLL: Duration = Duration::from_secs(2);
const DOCKER_SETTLE: Duration = Duration::from_secs(2);
const STUDIO_WAIT: Duration = Duration::from_secs(180);
const STUDIO_POLL: Duration = Duration::from_secs(2);

#[derive(Debug, Clone, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioSyncArgs {
    pub project_ref: Option<String>,
    pub access_token: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioDockerResult {
    pub started_docker: bool,
    pub already_running: bool,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioStackResult {
    pub already_running: bool,
    pub studio_url: String,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioSyncResult {
    pub skipped: bool,
    pub studio_url: String,
    pub project_ref: String,
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
            // Daemon up ≠ engine stable — courte pause avant supabase start.
            std::thread::sleep(DOCKER_SETTLE);
            if docker_info_ok() {
                return Ok(true);
            }
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
    // « container is not ready: starting » → status échoue : on ne considère pas ready.
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
    if text.contains("docker")
        || text.contains("cannot connect")
        || text.contains("is the docker daemon running")
    {
        return "docker_start_failed".into();
    }
    "supabase_start_failed".into()
}

fn start_supabase(cwd: &Path) -> Result<(), String> {
    if studio_port_open() && supabase_status_running(cwd) {
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
    if reason == "port_in_use" && studio_port_open() && supabase_status_running(cwd) {
        return Ok(());
    }
    Err(reason)
}

/// Port Studio + `supabase status` OK — pas seulement un TCP ouvert trop tôt.
fn wait_stack_ready(cwd: &Path) -> Result<(), String> {
    let deadline = Instant::now() + STUDIO_WAIT;
    while Instant::now() < deadline {
        if studio_port_open() && supabase_status_running(cwd) {
            return Ok(());
        }
        std::thread::sleep(STUDIO_POLL);
    }
    Err("not_running".into())
}

fn studio_browser_url(project_ref: Option<&str>) -> String {
    // `t` = cache-bust — évite de réouvrir l’onglet Studio figé sur l’ancien schéma.
    let ts = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_millis())
        .unwrap_or(0);
    match project_ref.map(str::trim).filter(|r| !r.is_empty()) {
        Some(ref_) => format!("{STUDIO_URL}?jarvis={ref_}&t={ts}"),
        None => format!("{STUDIO_URL}?t={ts}"),
    }
}

const SYNCED_REF_FILE: &str = "jarvis-synced-ref";
const REMOTE_SCHEMA_FILE: &str = "remote-schema.sql";
const WIPE_PUBLIC_FILE: &str = "wipe-public.sql";
const LOCAL_DB_URL_FALLBACK: &str =
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const WIPE_PUBLIC_SQL: &str = "CREATE SCHEMA IF NOT EXISTS extensions;\nCREATE EXTENSION IF NOT EXISTS \"pg_trgm\" WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS \"btree_gist\" WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS \"unaccent\" WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS \"pgcrypto\" WITH SCHEMA extensions;\nCREATE EXTENSION IF NOT EXISTS \"uuid-ossp\" WITH SCHEMA extensions;\nDROP SCHEMA IF EXISTS public CASCADE;\nCREATE SCHEMA public;\nGRANT ALL ON SCHEMA public TO postgres;\nGRANT ALL ON SCHEMA public TO public;\nGRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;\n";

fn temp_dir(cwd: &Path) -> PathBuf {
    cwd.join("supabase").join(".temp")
}

fn find_psql_bin() -> PathBuf {
    for candidate in ["/opt/homebrew/bin/psql", "/usr/local/bin/psql", "psql"] {
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
    PathBuf::from("psql")
}

fn resolve_local_db_url(cwd: &Path) -> String {
    let bin = find_supabase_bin();
    let Ok(out) = command(&bin.to_string_lossy())
        .args(["status", "-o", "env"])
        .current_dir(cwd)
        .output()
    else {
        return LOCAL_DB_URL_FALLBACK.to_string();
    };
    let text = format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    for line in text.lines() {
        if let Some(rest) = line.strip_prefix("DB_URL=\"") {
            if let Some(url) = rest.strip_suffix('"') {
                if !url.is_empty() {
                    return url.to_string();
                }
            }
        }
    }
    LOCAL_DB_URL_FALLBACK.to_string()
}

/// `supabase db query` refuse le multi-statements — apply via psql.
fn psql_apply_file(db_url: &str, file: &Path, stop_on_error: bool) -> Result<(), String> {
    let bin = find_psql_bin();
    let file_str = file.to_string_lossy().to_string();
    let mut args: Vec<&str> = vec![db_url];
    if stop_on_error {
        args.extend(["-v", "ON_ERROR_STOP=1"]);
    }
    args.extend(["-f", file_str.as_str()]);

    let output = command(&bin.to_string_lossy())
        .args(&args)
        .output()
        .map_err(|_| "sync_failed".to_string())?;

    if output.status.success() {
        return Ok(());
    }
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    Err(classify_cli_failure(&stderr, &stdout, "sync_failed"))
}

fn public_table_count(db_url: &str) -> usize {
    let bin = find_psql_bin();
    let Ok(out) = command(&bin.to_string_lossy())
        .args([
            db_url,
            "-tA",
            "-c",
            "SELECT count(*)::int FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';",
        ])
        .output()
    else {
        return 0;
    };
    if !out.status.success() {
        return 0;
    }
    String::from_utf8_lossy(&out.stdout)
        .trim()
        .parse()
        .unwrap_or(0)
}

fn read_synced_ref(cwd: &Path) -> Option<String> {
    let raw = fs::read_to_string(temp_dir(cwd).join(SYNCED_REF_FILE)).ok()?;
    let trimmed = raw.trim().to_string();
    if trimmed.is_empty() {
        None
    } else {
        Some(trimmed)
    }
}

fn write_synced_ref(cwd: &Path, project_ref: &str) -> Result<(), String> {
    let dir = temp_dir(cwd);
    fs::create_dir_all(&dir).map_err(|e| format!("sync_failed:{e}"))?;
    fs::write(dir.join(SYNCED_REF_FILE), project_ref).map_err(|e| format!("sync_failed:{e}"))
}

fn link_project(cwd: &Path, project_ref: &str, access_token: &str) -> Result<(), String> {
    let dir = temp_dir(cwd);
    fs::create_dir_all(&dir).map_err(|e| format!("link_failed:{e}"))?;
    fs::write(dir.join("project-ref"), project_ref).map_err(|e| format!("link_failed:{e}"))?;

    let bin = find_supabase_bin();
    let output = command(&bin.to_string_lossy())
        .args(["link", "--project-ref", project_ref, "--yes"])
        .current_dir(cwd)
        .env("SUPABASE_ACCESS_TOKEN", access_token)
        .output()
        .map_err(|_| "link_failed".to_string())?;

    if output.status.success() {
        return Ok(());
    }
    // project-ref déjà écrit — dump tenté même si link demande un mdp DB.
    Ok(())
}

fn classify_cli_failure(stderr: &str, stdout: &str, fallback: &str) -> String {
    let text = format!("{stderr}\n{stdout}").to_ascii_lowercase();
    if text.contains("password") || text.contains("authentication failed") {
        return "pull_failed".into();
    }
    if text.contains("docker")
        || text.contains("cannot connect")
        || text.contains("connection refused")
        || text.contains("is the docker daemon running")
    {
        return "docker_start_failed".into();
    }
    if text.contains("not running") || text.contains("supabase start") {
        return "not_running".into();
    }
    fallback.to_string()
}

fn run_supabase(
    cwd: &Path,
    args: &[&str],
    access_token: &str,
    fallback: &str,
) -> Result<(), String> {
    let bin = find_supabase_bin();
    let output = command(&bin.to_string_lossy())
        .args(args)
        .current_dir(cwd)
        .env("SUPABASE_ACCESS_TOKEN", access_token)
        .output()
        .map_err(|_| fallback.to_string())?;

    if output.status.success() {
        return Ok(());
    }
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    Err(classify_cli_failure(&stderr, &stdout, fallback))
}

fn sync_local_schema_from_cloud(
    cwd: &Path,
    project_ref: &str,
    access_token: &str,
) -> Result<bool, String> {
    if read_synced_ref(cwd).as_deref() == Some(project_ref) {
        return Ok(true);
    }

    link_project(cwd, project_ref, access_token)?;

    let schema_path = temp_dir(cwd).join(REMOTE_SCHEMA_FILE);
    let schema_str = schema_path.to_string_lossy().to_string();

    run_supabase(
        cwd,
        &[
            "db",
            "dump",
            "--linked",
            "--yes",
            "-s",
            "public",
            "-f",
            &schema_str,
        ],
        access_token,
        "pull_failed",
    )?;

    // Apply local — exige stack réellement ready (pas seulement le port).
    if !supabase_status_running(cwd) {
        return Err("not_running".into());
    }

    let wipe_path = temp_dir(cwd).join(WIPE_PUBLIC_FILE);
    fs::write(&wipe_path, WIPE_PUBLIC_SQL).map_err(|e| format!("sync_failed:{e}"))?;
    let db_url = resolve_local_db_url(cwd);
    psql_apply_file(&db_url, &wipe_path, true)?;
    if let Err(_strict) = psql_apply_file(&db_url, &schema_path, true) {
        // Indexes / EXCLUDE exotiques : best-effort si des tables existent.
        psql_apply_file(&db_url, &wipe_path, true)?;
        let _ = psql_apply_file(&db_url, &schema_path, false);
        if public_table_count(&db_url) == 0 {
            return Err("sync_failed".into());
        }
    }

    write_synced_ref(cwd, project_ref)?;
    Ok(false)
}

fn run_docker_ensure() -> Result<StudioDockerResult, String> {
    let already = docker_info_ok();
    let started = ensure_docker()?;
    if !docker_info_ok() {
        return Err("docker_start_failed".into());
    }
    Ok(StudioDockerResult {
        started_docker: started,
        already_running: already,
    })
}

fn run_stack_ensure(app: &AppHandle) -> Result<StudioStackResult, String> {
    if !docker_info_ok() {
        return Err("docker_start_failed".into());
    }
    let repo = elsa_paths::resolve_repo_root(app)?;
    let already = studio_port_open() && supabase_status_running(&repo);
    if !already {
        start_supabase(&repo)?;
    }
    wait_stack_ready(&repo)?;
    Ok(StudioStackResult {
        already_running: already,
        studio_url: studio_browser_url(None),
    })
}

fn run_schema_sync(
    app: &AppHandle,
    args: Option<StudioSyncArgs>,
) -> Result<StudioSyncResult, String> {
    let project_ref = args
        .as_ref()
        .and_then(|a| a.project_ref.as_deref())
        .map(str::trim)
        .filter(|r| !r.is_empty())
        .map(str::to_string);
    let access_token = args
        .as_ref()
        .and_then(|a| a.access_token.as_deref())
        .map(str::trim)
        .filter(|t| !t.is_empty())
        .map(str::to_string);

    let Some(ref_) = project_ref else {
        return Err("no_project".into());
    };
    let Some(token) = access_token else {
        return Err("no_project".into());
    };

    if !docker_info_ok() {
        return Err("docker_start_failed".into());
    }

    let repo = elsa_paths::resolve_repo_root(app)?;
    if !studio_port_open() || !supabase_status_running(&repo) {
        return Err("not_running".into());
    }

    let skipped = sync_local_schema_from_cloud(&repo, &ref_, &token)?;
    Ok(StudioSyncResult {
        skipped,
        studio_url: studio_browser_url(Some(&ref_)),
        project_ref: ref_,
    })
}

/// Étape 1 — Docker Desktop up (lance si besoin, attend le daemon).
#[tauri::command]
pub async fn studio_docker_ensure() -> Result<StudioDockerResult, String> {
    tauri::async_runtime::spawn_blocking(run_docker_ensure)
        .await
        .map_err(|e| format!("studio_join:{e}"))?
}

/// Étape 2 — `supabase start` + attente port Studio et status OK.
#[tauri::command]
pub async fn studio_stack_ensure(app: AppHandle) -> Result<StudioStackResult, String> {
    tauri::async_runtime::spawn_blocking(move || run_stack_ensure(&app))
        .await
        .map_err(|e| format!("studio_join:{e}"))?
}

/// Étape 3 — link + dump cloud + apply local (schéma public).
#[tauri::command]
pub async fn studio_schema_sync(
    app: AppHandle,
    args: Option<StudioSyncArgs>,
) -> Result<StudioSyncResult, String> {
    tauri::async_runtime::spawn_blocking(move || run_schema_sync(&app, args))
        .await
        .map_err(|e| format!("studio_join:{e}"))?
}
