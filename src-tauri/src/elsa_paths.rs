//! Racine monorepo E.L.S.A. sur la machine (DX + `.app` via ELSA_ROOT / cache).

use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

fn looks_like_repo(root: &Path) -> bool {
    root.join("supabase/config.toml").is_file()
}

fn cache_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("elsa_app_data: {e}"))?;
    Ok(dir.join("elsa-root.txt"))
}

/// Mémorise le repo (ex. après un `tauri:dev`) pour les lancements Finder.
pub fn remember_repo_root(app: &AppHandle, root: &Path) {
    let Ok(path) = cache_file(app) else {
        return;
    };
    let Some(parent) = path.parent() else {
        return;
    };
    let _ = fs::create_dir_all(parent);
    let _ = fs::write(&path, root.to_string_lossy().as_bytes());
}

fn load_cached_repo(app: &AppHandle) -> Option<PathBuf> {
    let path = cache_file(app).ok()?;
    let raw = fs::read_to_string(path).ok()?;
    let root = PathBuf::from(raw.trim());
    if looks_like_repo(&root) {
        Some(root)
    } else {
        None
    }
}

/// Priorité : `ELSA_ROOT` → cwd → cache Application Support.
pub fn resolve_repo_root(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(root) = std::env::var("ELSA_ROOT") {
        let path = PathBuf::from(root);
        if looks_like_repo(&path) {
            remember_repo_root(app, &path);
            return Ok(path);
        }
    }

    if let Ok(cwd) = std::env::current_dir() {
        if looks_like_repo(&cwd) {
            remember_repo_root(app, &cwd);
            return Ok(cwd);
        }
        let parent = cwd.join("..");
        if looks_like_repo(&parent) {
            if let Ok(canon) = parent.canonicalize() {
                remember_repo_root(app, &canon);
                return Ok(canon);
            }
        }
    }

    if let Some(cached) = load_cached_repo(app) {
        return Ok(cached);
    }

    Err("repo_missing".into())
}
