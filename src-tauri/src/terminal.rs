//! Vrai zsh via PTY (`portable-pty`) — saisie utilisateur dans le shell Tauri.
//! Pas d’agent LLM (ADR 0006). Surface sensible : UI distante peut invoke → session
//! unique, cwd = $HOME, binaire fixé `/bin/zsh`.

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::sync::Mutex;
use std::thread;
use tauri::{AppHandle, Emitter, Manager, State};

const ZSH: &str = "/bin/zsh";
const EVENT_DATA: &str = "terminal-pty-data";
const EVENT_EXIT: &str = "terminal-pty-exit";

struct PtySession {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    child: Box<dyn Child + Send + Sync>,
}

pub struct TerminalPtyState(Mutex<Option<PtySession>>);

impl TerminalPtyState {
    pub fn new() -> Self {
        Self(Mutex::new(None))
    }
}

fn home_dir() -> PathBuf {
    std::env::var_os("HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from("/"))
}

/// ZDOTDIR éphémère : relais vers les dotfiles user, puis `ls -1`
/// (une entrée par ligne — jamais en colonnes).
fn ensure_elsa_zdotdir() -> Result<PathBuf, String> {
    let dir = std::env::temp_dir().join("elsa-zsh");
    fs::create_dir_all(&dir).map_err(|e| format!("zsh_dotdir: {e}"))?;
    fs::write(
        dir.join(".zprofile"),
        concat!(
            "# E.L.S.A. terminal — généré, ne pas éditer\n",
            "[[ -r \"$HOME/.zprofile\" ]] && source \"$HOME/.zprofile\"\n",
        ),
    )
    .map_err(|e| format!("zsh_zprofile_write: {e}"))?;
    fs::write(
        dir.join(".zshrc"),
        concat!(
            "# E.L.S.A. terminal — généré, ne pas éditer\n",
            "[[ -r \"$HOME/.zshrc\" ]] && source \"$HOME/.zshrc\"\n",
            "alias ls='command ls -1'\n",
        ),
    )
    .map_err(|e| format!("zsh_zshrc_write: {e}"))?;
    Ok(dir)
}

fn spawn_reader(app: AppHandle, mut reader: Box<dyn Read + Send>) {
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            match reader.read(&mut buf) {
                Ok(0) => break,
                Ok(n) => {
                    let chunk = String::from_utf8_lossy(&buf[..n]).into_owned();
                    let _ = app.emit(EVENT_DATA, chunk);
                }
                Err(_) => break,
            }
        }
        let _ = app.emit(EVENT_EXIT, ());
    });
}

/// Démarre (ou remplace) une session `/bin/zsh -l` dans $HOME.
#[tauri::command]
pub async fn terminal_pty_start(
    app: AppHandle,
    state: State<'_, TerminalPtyState>,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    terminal_pty_stop_inner(&state);

    let pty_system = native_pty_system();
    let pair = pty_system
        .openpty(PtySize {
            rows: rows.max(2),
            cols: cols.max(20),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("pty_open: {e}"))?;

    let zdotdir = ensure_elsa_zdotdir()?;

    let mut cmd = CommandBuilder::new(ZSH);
    // Login + interactif ; ZDOTDIR = relais user + alias ls -1.
    cmd.arg("-il");
    cmd.cwd(home_dir());
    // PATH raisonnable pour un login shell Finder / .app
    cmd.env(
        "PATH",
        format!(
            "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:{}",
            std::env::var("PATH").unwrap_or_default()
        ),
    );
    cmd.env("TERM", "xterm-256color");
    cmd.env("ZDOTDIR", zdotdir);

    let child = pair
        .slave
        .spawn_command(cmd)
        .map_err(|e| format!("zsh_spawn: {e}"))?;

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|e| format!("pty_reader: {e}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|e| format!("pty_writer: {e}"))?;

    spawn_reader(app.clone(), reader);

    let mut guard = state.0.lock().map_err(|_| "pty_lock")?;
    *guard = Some(PtySession {
        master: pair.master,
        writer,
        child,
    });
    Ok(())
}

fn terminal_pty_stop_inner(state: &TerminalPtyState) {
    let Ok(mut guard) = state.0.lock() else {
        return;
    };
    if let Some(mut session) = guard.take() {
        let _ = session.child.kill();
        let _ = session.child.wait();
    }
}

#[tauri::command]
pub async fn terminal_pty_stop(state: State<'_, TerminalPtyState>) -> Result<(), String> {
    terminal_pty_stop_inner(&state);
    Ok(())
}

#[tauri::command]
pub async fn terminal_pty_write(
    state: State<'_, TerminalPtyState>,
    data: String,
) -> Result<(), String> {
    if data.is_empty() {
        return Ok(());
    }
    if data.len() > 16_384 {
        return Err("pty_write_too_large".into());
    }
    let mut guard = state.0.lock().map_err(|_| "pty_lock")?;
    let session = guard.as_mut().ok_or("pty_not_running")?;
    session
        .writer
        .write_all(data.as_bytes())
        .map_err(|e| format!("pty_write: {e}"))?;
    let _ = session.writer.flush();
    Ok(())
}

#[tauri::command]
pub async fn terminal_pty_resize(
    state: State<'_, TerminalPtyState>,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    let guard = state.0.lock().map_err(|_| "pty_lock")?;
    let session = guard.as_ref().ok_or("pty_not_running")?;
    session
        .master
        .resize(PtySize {
            rows: rows.max(2),
            cols: cols.max(20),
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| format!("pty_resize: {e}"))?;
    Ok(())
}

/// Kill PTY à la fermeture de l’app.
pub fn shutdown_pty(app: &AppHandle) {
    if let Some(state) = app.try_state::<TerminalPtyState>() {
        terminal_pty_stop_inner(&state);
    }
}
