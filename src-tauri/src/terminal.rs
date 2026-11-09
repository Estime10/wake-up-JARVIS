//! Terminal interactif utilisateur — builtins allowlistés sur le vrai FS Mac.
//! Pas d’agent LLM / pas de `sh -c` libre (ADR 0006 = étape séparée, gate HACKER).

use std::env;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::Command;

const MAX_LINE_CHARS: usize = 4096;
const MAX_CAT_BYTES: u64 = 256 * 1024;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TerminalRunResult {
    pub cwd: String,
    pub lines: Vec<String>,
    pub clear: bool,
}

fn home_dir() -> PathBuf {
    env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("/"))
}

fn tokenize(input: &str) -> Vec<&str> {
    input.split_whitespace().collect()
}

fn expand_user(path: &str) -> PathBuf {
    if path == "~" {
        return home_dir();
    }
    if let Some(rest) = path.strip_prefix("~/") {
        return home_dir().join(rest);
    }
    PathBuf::from(path)
}

fn resolve_path(cwd: &Path, target: &str) -> PathBuf {
    let raw = expand_user(target);
    let joined = if raw.is_absolute() {
        raw
    } else {
        cwd.join(raw)
    };
    normalize(&joined)
}

fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in path.components() {
        match comp {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    if out.as_os_str().is_empty() {
        PathBuf::from("/")
    } else {
        out
    }
}

fn under_home_or_tmp(path: &Path) -> bool {
    let home = home_dir();
    path.starts_with(&home) || path.starts_with("/tmp") || path.starts_with("/private/tmp")
}

fn reject_path(path: &Path) -> Option<String> {
    if under_home_or_tmp(path) {
        None
    } else {
        Some(format!(
            "elsa: path hors $HOME|/tmp refusé — {}",
            path.display()
        ))
    }
}

fn list_dir(path: &Path) -> Result<Vec<String>, String> {
    let mut names = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| format!("ls: {}: {e}", path.display()))?;
    for entry in entries.flatten() {
        let name = entry.file_name().to_string_lossy().into_owned();
        let suffix = if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
            "/"
        } else {
            ""
        };
        names.push(format!("{name}{suffix}"));
    }
    names.sort();
    Ok(names)
}

fn read_file_capped(path: &Path) -> Result<Vec<String>, String> {
    let meta = fs::metadata(path).map_err(|e| format!("cat: {}: {e}", path.display()))?;
    if meta.len() > MAX_CAT_BYTES {
        return Err(format!(
            "cat: fichier trop grand (>{} Ko)",
            MAX_CAT_BYTES / 1024
        ));
    }
    let text = fs::read_to_string(path).map_err(|e| format!("cat: {}: {e}", path.display()))?;
    Ok(text.lines().map(str::to_owned).collect())
}

fn whoami() -> String {
    Command::new("id")
        .arg("-un")
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                Some(String::from_utf8_lossy(&o.stdout).trim().to_owned())
            } else {
                None
            }
        })
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "unknown".into())
}

fn hostname() -> String {
    Command::new("hostname")
        .arg("-s")
        .output()
        .ok()
        .and_then(|o| {
            if o.status.success() {
                Some(String::from_utf8_lossy(&o.stdout).trim().to_owned())
            } else {
                None
            }
        })
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "mac".into())
}

fn run_line(cwd: &Path, line: &str) -> Result<TerminalRunResult, String> {
    let trimmed = line.trim();
    if trimmed.is_empty() {
        return Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![],
            clear: false,
        });
    }
    if trimmed.chars().count() > MAX_LINE_CHARS {
        return Err("terminal_line_too_long".into());
    }

    let tokens = tokenize(trimmed);
    let cmd = tokens.first().copied().unwrap_or("");
    let args = &tokens[1..];

    match cmd {
        "clear" => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![],
            clear: true,
        }),
        "pwd" => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![cwd.display().to_string()],
            clear: false,
        }),
        "whoami" => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![whoami()],
            clear: false,
        }),
        "hostname" => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![hostname()],
            clear: false,
        }),
        "date" => {
            let out = Command::new("date")
                .output()
                .map_err(|e| format!("date: {e}"))?;
            let text = String::from_utf8_lossy(&out.stdout).trim().to_owned();
            Ok(TerminalRunResult {
                cwd: cwd.display().to_string(),
                lines: vec![text],
                clear: false,
            })
        }
        "help" => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![
                "builtins: cd ls pwd clear echo cat whoami hostname date help".into(),
                "périmètre: $HOME et /tmp uniquement · pas de shell libre (ADR 0006)".into(),
            ],
            clear: false,
        }),
        "echo" => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![args.join(" ")],
            clear: false,
        }),
        "cd" => {
            let target = args.first().copied().unwrap_or("~");
            let next = resolve_path(cwd, target);
            if let Some(err) = reject_path(&next) {
                return Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![err],
                    clear: false,
                });
            }
            let meta = fs::metadata(&next);
            match meta {
                Ok(m) if m.is_dir() => Ok(TerminalRunResult {
                    cwd: next.display().to_string(),
                    lines: vec![],
                    clear: false,
                }),
                Ok(_) => Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![format!("cd: not a directory: {target}")],
                    clear: false,
                }),
                Err(_) => Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![format!("cd: {target}: No such file or directory")],
                    clear: false,
                }),
            }
        }
        "ls" => {
            let target = args.first().copied().unwrap_or(".");
            let path = resolve_path(cwd, target);
            if let Some(err) = reject_path(&path) {
                return Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![err],
                    clear: false,
                });
            }
            match list_dir(&path) {
                Ok(names) => Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: if names.is_empty() {
                        vec![]
                    } else {
                        vec![names.join("  ")]
                    },
                    clear: false,
                }),
                Err(e) => Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![e],
                    clear: false,
                }),
            }
        }
        "cat" => {
            let Some(target) = args.first().copied() else {
                return Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec!["cat: missing file".into()],
                    clear: false,
                });
            };
            let path = resolve_path(cwd, target);
            if let Some(err) = reject_path(&path) {
                return Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![err],
                    clear: false,
                });
            }
            match read_file_capped(&path) {
                Ok(lines) => Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines,
                    clear: false,
                }),
                Err(e) => Ok(TerminalRunResult {
                    cwd: cwd.display().to_string(),
                    lines: vec![e],
                    clear: false,
                }),
            }
        }
        _ => Ok(TerminalRunResult {
            cwd: cwd.display().to_string(),
            lines: vec![format!(
                "elsa: commande non allowlistée `{cmd}` — tape `help` (pas de shell libre)"
            )],
            clear: false,
        }),
    }
}

#[tauri::command]
pub async fn terminal_run(cwd: String, line: String) -> Result<TerminalRunResult, String> {
    let cwd_raw = cwd.trim();
    let cwd_path = if cwd_raw.is_empty() {
        home_dir()
    } else {
        normalize(Path::new(cwd_raw))
    };
    if let Some(err) = reject_path(&cwd_path) {
        return Err(err);
    }
    run_line(&cwd_path, &line)
}

#[tauri::command]
pub async fn terminal_home() -> Result<String, String> {
    Ok(home_dir().display().to_string())
}
