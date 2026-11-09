//! Runtime Piper autonome — Application Support, sans terminal ni repo obligatoire.
//! DX : si le repo + `.venv-piper` sont trouvés, on les réutilise.

use sha2::{Digest, Sha256};
use std::fs::{self, File};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub const EXPECTED_MODEL_SHA256: &str =
    "641d1ab097da2b81128c076810edb052b385decc8be3381814802a64a73baf99";

const MODEL_NAME: &str = "fr_FR-siwis-medium.onnx";
const SERVER_SCRIPT: &str = include_str!("../../scripts/piper_waitress_server.py");

/// Empêche deux bootstraps parallèles (warm-up + premier speak).
static BOOTSTRAP_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug, Clone)]
pub struct PiperPaths {
    pub root: PathBuf,
    pub python: PathBuf,
    pub script: PathBuf,
    pub model: PathBuf,
}

impl PiperPaths {
    pub fn is_ready(&self) -> bool {
        self.python.is_file() && self.script.is_file() && self.model.is_file()
    }
}

fn log_line(log_path: &Path, message: &str) {
    let Ok(mut file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(log_path)
    else {
        return;
    };
    let _ = writeln!(file, "{message}");
}

fn sha256_file(path: &Path) -> Result<String, String> {
    let mut file = File::open(path).map_err(|e| format!("piper_sha_open: {e}"))?;
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 1024 * 1024];
    loop {
        let n = file
            .read(&mut buf)
            .map_err(|e| format!("piper_sha_read: {e}"))?;
        if n == 0 {
            break;
        }
        hasher.update(&buf[..n]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn verify_model(path: &Path) -> Result<(), String> {
    let actual = sha256_file(path)?;
    if actual != EXPECTED_MODEL_SHA256 {
        return Err(format!(
            "piper_model_sha_mismatch expected={EXPECTED_MODEL_SHA256} got={actual}"
        ));
    }
    Ok(())
}

fn looks_like_repo(root: &Path) -> bool {
    root.join("scripts/piper_waitress_server.py").is_file()
        && root.join("models/piper").join(MODEL_NAME).is_file()
        && root.join(".venv-piper/bin/python").is_file()
}

fn repo_paths(root: PathBuf) -> PiperPaths {
    PiperPaths {
        python: root.join(".venv-piper/bin/python"),
        script: root.join("scripts/piper_waitress_server.py"),
        model: root.join("models/piper").join(MODEL_NAME),
        root,
    }
}

fn find_repo_root(app: &AppHandle) -> Option<PathBuf> {
    if let Ok(root) = std::env::var("ELSA_ROOT") {
        let path = PathBuf::from(root);
        if looks_like_repo(&path) {
            return Some(path);
        }
    }
    if let Ok(cwd) = std::env::current_dir() {
        if looks_like_repo(&cwd) {
            return Some(cwd);
        }
        let parent = cwd.join("..");
        if looks_like_repo(&parent) {
            return parent.canonicalize().ok();
        }
    }
    if let Ok(resource) = app.path().resource_dir() {
        if looks_like_repo(&resource) {
            return Some(resource);
        }
    }
    None
}

fn app_support_root(app: &AppHandle) -> Result<PathBuf, String> {
    let base = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("piper_app_data: {e}"))?;
    Ok(base.join("piper"))
}

fn support_paths(root: PathBuf) -> PiperPaths {
    PiperPaths {
        python: root.join("venv/bin/python"),
        script: root.join("piper_waitress_server.py"),
        model: root.join("models").join(MODEL_NAME),
        root,
    }
}

fn find_python3() -> Result<PathBuf, String> {
    for candidate in ["python3", "/opt/homebrew/bin/python3", "/usr/bin/python3"] {
        if let Ok(out) = Command::new(candidate).arg("--version").output() {
            if out.status.success() {
                return Ok(PathBuf::from(candidate));
            }
        }
    }
    Err("python3_missing".into())
}

fn run_checked(cmd: &mut Command, log_path: &Path, label: &str) -> Result<(), String> {
    log_line(log_path, &format!("▶ {label}"));
    let output = cmd
        .output()
        .map_err(|e| format!("piper_{label}_spawn: {e}"))?;
    if !output.stdout.is_empty() {
        log_line(
            log_path,
            String::from_utf8_lossy(&output.stdout).trim_end(),
        );
    }
    if !output.stderr.is_empty() {
        log_line(
            log_path,
            String::from_utf8_lossy(&output.stderr).trim_end(),
        );
    }
    if !output.status.success() {
        return Err(format!(
            "piper_{label}_failed code={}",
            output.status.code().unwrap_or(-1)
        ));
    }
    Ok(())
}

fn write_server_script(script: &Path, log_path: &Path) -> Result<(), String> {
    if script.is_file() {
        if let Ok(existing) = fs::read_to_string(script) {
            if existing == SERVER_SCRIPT {
                return Ok(());
            }
        }
    }
    fs::write(script, SERVER_SCRIPT).map_err(|e| format!("piper_script_write: {e}"))?;
    log_line(log_path, "server script written");
    Ok(())
}

fn ensure_venv(paths: &PiperPaths, log_path: &Path) -> Result<(), String> {
    if paths.python.is_file() {
        let imports_ok = Command::new(&paths.python)
            .args(["-c", "import waitress, piper, flask"])
            .status()
            .map(|s| s.success())
            .unwrap_or(false);
        if imports_ok {
            return Ok(());
        }
        run_checked(
            Command::new(&paths.python).args([
                "-m",
                "pip",
                "install",
                "-q",
                "waitress",
                "piper-tts[http]",
            ]),
            log_path,
            "pip_ensure",
        )?;
        return Ok(());
    }

    let py = find_python3()?;
    let venv_dir = paths.root.join("venv");
    fs::create_dir_all(&paths.root).map_err(|e| format!("piper_mkdir: {e}"))?;
    run_checked(
        Command::new(&py)
            .arg("-m")
            .arg("venv")
            .arg(&venv_dir),
        log_path,
        "venv_create",
    )?;
    let pip = paths.root.join("venv/bin/pip");
    run_checked(
        Command::new(&pip).args(["install", "-U", "pip"]),
        log_path,
        "pip_upgrade",
    )?;
    run_checked(
        Command::new(&pip).args(["install", "piper-tts[http]", "waitress"]),
        log_path,
        "pip_install_piper",
    )?;
    if !paths.python.is_file() {
        return Err("piper_venv_python_missing".into());
    }
    Ok(())
}

fn ensure_model(app: &AppHandle, paths: &PiperPaths, log_path: &Path) -> Result<(), String> {
    let model_dir = paths.root.join("models");
    fs::create_dir_all(&model_dir).map_err(|e| format!("piper_models_mkdir: {e}"))?;

    if paths.model.is_file() {
        verify_model(&paths.model)?;
        return Ok(());
    }

    // Copie depuis le repo de build si présent (évite un download).
    if let Some(repo) = find_repo_root(app) {
        let src = repo.join("models/piper").join(MODEL_NAME);
        if src.is_file() {
            log_line(log_path, &format!("copy model from {}", src.display()));
            fs::copy(&src, &paths.model).map_err(|e| format!("piper_model_copy: {e}"))?;
            let src_json = src.with_extension("onnx.json");
            if src_json.is_file() {
                let _ = fs::copy(&src_json, paths.model.with_extension("onnx.json"));
            }
            verify_model(&paths.model)?;
            return Ok(());
        }
    }

    if let Ok(src) = std::env::var("ELSA_MODEL_SRC") {
        let src = PathBuf::from(src);
        if src.is_file() {
            fs::copy(&src, &paths.model).map_err(|e| format!("piper_model_copy_env: {e}"))?;
            verify_model(&paths.model)?;
            return Ok(());
        }
    }

    log_line(log_path, "download fr_FR-siwis-medium via piper.download_voices");
    run_checked(
        Command::new(&paths.python).args([
            "-m",
            "piper.download_voices",
            "fr_FR-siwis-medium",
            "--download-dir",
            &model_dir.to_string_lossy(),
        ]),
        log_path,
        "model_download",
    )?;
    if !paths.model.is_file() {
        return Err("piper_model_download_missing".into());
    }
    verify_model(&paths.model)?;
    Ok(())
}

fn bootstrap_app_support(app: &AppHandle) -> Result<PiperPaths, String> {
    let root = app_support_root(app)?;
    let paths = support_paths(root.clone());
    let log_path = root.join("bootstrap.log");
    fs::create_dir_all(&root).map_err(|e| format!("piper_mkdir: {e}"))?;
    log_line(
        &log_path,
        &format!("=== bootstrap root={} ===", root.display()),
    );

    write_server_script(&paths.script, &log_path)?;
    ensure_venv(&paths, &log_path)?;
    ensure_model(app, &paths, &log_path)?;

    if !paths.is_ready() {
        return Err("piper_bootstrap_incomplete".into());
    }
    log_line(&log_path, "bootstrap ok");
    Ok(paths)
}

/// Résout un runtime prêt (repo DX ou Application Support, avec bootstrap si besoin).
pub fn resolve_ready(app: &AppHandle) -> Result<PiperPaths, String> {
    if let Some(repo) = find_repo_root(app) {
        let paths = repo_paths(repo);
        if paths.is_ready() {
            verify_model(&paths.model)?;
            return Ok(paths);
        }
    }

    let _guard = BOOTSTRAP_LOCK
        .lock()
        .map_err(|_| "piper_bootstrap_lock".to_string())?;

    let root = app_support_root(app)?;
    let paths = support_paths(root);
    if paths.is_ready() {
        verify_model(&paths.model)?;
        write_server_script(&paths.script, &paths.root.join("bootstrap.log"))?;
        return Ok(paths);
    }

    bootstrap_app_support(app)
}

/// Prépare Piper en arrière-plan au démarrage de l’app (double-clic).
pub fn warm(app: &AppHandle) {
    match resolve_ready(app) {
        Ok(paths) => {
            let log = paths.root.join("bootstrap.log");
            log_line(&log, &format!("warm ok python={}", paths.python.display()));
        }
        Err(err) => {
            if let Ok(root) = app_support_root(app) {
                let _ = fs::create_dir_all(&root);
                log_line(&root.join("bootstrap.log"), &format!("warm err: {err}"));
            }
        }
    }
}
