//! Now Playing macOS — probe + transport locaux (shell packagé inclus).
//! Les commandes tournent en `spawn_blocking` avec timeout sous-processus.

use serde::Serialize;
use std::io::Read;
use std::process::{Command, Stdio};
use std::sync::mpsc;
use std::thread;
use std::time::Duration;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NowPlayingSnapshot {
    pub playing: bool,
    pub source: String,
    pub title: String,
    pub artist: String,
    pub app: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicTransportResult {
    pub accepted: bool,
    pub snapshot: NowPlayingSnapshot,
}

fn idle_snapshot() -> NowPlayingSnapshot {
    NowPlayingSnapshot {
        playing: false,
        source: "none".into(),
        title: String::new(),
        artist: String::new(),
        app: String::new(),
    }
}

/// Exécute une commande avec timeout (tue le process si dépassé).
fn run_cmd(program: &str, args: &[&str], timeout: Duration) -> Result<String, String> {
    let mut child = Command::new(program)
        .args(args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("spawn_failed:{program}:{e}"))?;

    let (tx_out, rx_out) = mpsc::channel();
    let (tx_err, rx_err) = mpsc::channel();
    let stdout = child.stdout.take();
    let stderr = child.stderr.take();
    thread::spawn(move || {
        let mut buf = String::new();
        if let Some(mut out) = stdout {
            let _ = out.read_to_string(&mut buf);
        }
        let _ = tx_out.send(buf);
    });
    thread::spawn(move || {
        let mut buf = String::new();
        if let Some(mut err) = stderr {
            let _ = err.read_to_string(&mut buf);
        }
        let _ = tx_err.send(buf);
    });

    let started = std::time::Instant::now();
    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                let stdout = rx_out
                    .recv_timeout(Duration::from_millis(200))
                    .unwrap_or_default();
                let stderr = rx_err
                    .recv_timeout(Duration::from_millis(200))
                    .unwrap_or_default();
                if !status.success() && stdout.trim().is_empty() {
                    let err = stderr.trim().replace('\n', " ");
                    if err.is_empty() {
                        return Err(format!("exit_{}", status.code().unwrap_or(-1)));
                    }
                    return Err(format!(
                        "exit_{}:{}",
                        status.code().unwrap_or(-1),
                        err
                    ));
                }
                return Ok(stdout);
            }
            Ok(None) => {
                if started.elapsed() >= timeout {
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err("timeout".into());
                }
                thread::sleep(Duration::from_millis(40));
            }
            Err(e) => return Err(format!("wait_failed:{e}")),
        }
    }
}

fn run_osascript(script: &str, timeout: Duration) -> Result<String, String> {
    match run_cmd("osascript", &["-e", script], timeout) {
        Ok(out) => Ok(out),
        Err(err) => {
            // -1743 = TCC Automation refusée (souvent silencieuse après rebuild ad-hoc).
            let _ = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open("/tmp/elsa-music.log")
                .and_then(|mut f| {
                    use std::io::Write;
                    writeln!(f, "osascript_failed:{err}")
                });
            Err(err)
        }
    }
}

/// NX_KEYTYPE: PLAY=16, NEXT=17, PREVIOUS=18
#[cfg(target_os = "macos")]
#[allow(deprecated)]
fn post_system_media_key(key: i64) -> Result<(), String> {
    use cocoa::appkit::{NSEvent, NSEventModifierFlags, NSEventSubtype, NSEventType};
    use cocoa::base::{id, nil};
    use cocoa::foundation::NSPoint;
    use objc::{msg_send, sel, sel_impl};
    use std::ffi::c_void;

    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        fn CGEventPost(tap: u32, event: *mut c_void);
    }
    const SESSION_EVENT_TAP: u32 = 1;
    // NX_SUBTYPE_AUX_CONTROL_BUTTONS = 8
    const AUX_CONTROL_SUBTYPE: NSEventSubtype = NSEventSubtype::NSScreenChangedEventType;

    unsafe {
        let post = |down: bool| -> Result<(), String> {
            let flags_bits: u64 = if down { 0x0A00 } else { 0x0B00 };
            let data1 = (key << 16) | (if down { 0x0A } else { 0x0B } << 8);
            let event: id = NSEvent::otherEventWithType_location_modifierFlags_timestamp_windowNumber_context_subtype_data1_data2_(
                nil,
                NSEventType::NSSystemDefined,
                NSPoint::new(0.0, 0.0),
                NSEventModifierFlags::from_bits_truncate(flags_bits),
                0.0,
                0,
                nil,
                AUX_CONTROL_SUBTYPE,
                data1,
                -1,
            );
            if event == nil {
                return Err("ns_event_create_failed".into());
            }
            let cg: *mut c_void = msg_send![event, CGEvent];
            if cg.is_null() {
                return Err("cg_event_nil".into());
            }
            CGEventPost(SESSION_EVENT_TAP, cg);
            Ok(())
        };

        post(true)?;
        thread::sleep(Duration::from_millis(80));
        post(false)?;
    }
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn post_system_media_key(_key: i64) -> Result<(), String> {
    Err("unsupported_platform".into())
}

fn media_key_for_action(action: &str) -> Result<i64, String> {
    match action {
        "toggle" => Ok(16),
        "next" => Ok(17),
        "previous" => Ok(18),
        _ => Err(format!("invalid_action:{action}")),
    }
}

#[cfg(target_os = "macos")]
fn deezer_menu(intent: &str) -> bool {
    let script = match intent {
        "pause" => DEEZER_PAUSE_SCRIPT,
        "play" => DEEZER_PLAY_SCRIPT,
        _ => return false,
    };
    matches!(run_osascript(script, Duration::from_secs(6)), Ok(out) if out.trim() == "ok")
}

#[cfg(not(target_os = "macos"))]
fn deezer_menu(_intent: &str) -> bool {
    false
}

#[cfg(target_os = "macos")]
fn deezer_playback_state() -> String {
    match run_osascript(DEEZER_STATE_SCRIPT, Duration::from_millis(2500)) {
        Ok(out) => match out.trim() {
            "playing" | "paused" | "absent" => out.trim().to_string(),
            _ => "unknown".into(),
        },
        Err(_) => "unknown".into(),
    }
}

#[cfg(not(target_os = "macos"))]
fn deezer_playback_state() -> String {
    "absent".into()
}

#[cfg(target_os = "macos")]
fn deezer_track() -> Option<(String, String)> {
    let out = run_osascript(DEEZER_TRACK_SCRIPT, Duration::from_millis(2500)).ok()?;
    let lines: Vec<&str> = out
        .lines()
        .map(str::trim)
        .filter(|l| !l.is_empty())
        .collect();
    let hit = lines.into_iter().find(|line| {
        line.to_ascii_lowercase().ends_with(" - deezer")
    })?;
    let lower = hit.to_ascii_lowercase();
    let body = lower
        .rfind(" - deezer")
        .map(|idx| hit[..idx].trim())
        .unwrap_or(hit.trim());
    if let Some(sep) = body.rfind(" - ") {
        Some((
            body[..sep].trim().to_string(),
            body[sep + 3..].trim().to_string(),
        ))
    } else {
        Some((body.to_string(), String::new()))
    }
}

#[cfg(not(target_os = "macos"))]
fn deezer_track() -> Option<(String, String)> {
    None
}

fn is_noise_app(app: &str) -> bool {
    let lower = app.trim().to_ascii_lowercase();
    matches!(
        lower.as_str(),
        "cursor"
            | "code"
            | "code helper"
            | "electron"
            | "zoom"
            | "zoom.us"
            | "slack"
            | "discord"
            | "figma"
            | "notion"
    ) || lower.ends_with(" helper")
}

fn is_browser_app(app: &str) -> Option<&'static str> {
    let lower = app.trim().to_ascii_lowercase();
    if lower == "google chrome" || lower.starts_with("google chrome") {
        return Some("chrome");
    }
    if lower == "brave browser" || lower.starts_with("brave browser") {
        return Some("brave");
    }
    if lower == "safari" {
        return Some("safari");
    }
    if lower == "arc" {
        return Some("arc");
    }
    if lower == "firefox" || lower.starts_with("firefox") {
        return Some("firefox");
    }
    if lower == "microsoft edge" || lower.starts_with("microsoft edge") {
        return Some("edge");
    }
    if lower == "dia" {
        return Some("dia");
    }
    if lower == "orion" {
        return Some("orion");
    }
    None
}

#[cfg(target_os = "macos")]
fn fetch_window_titles(app: &str) -> String {
    let proc = match app.trim().to_ascii_lowercase().as_str() {
        "brave browser" => "Brave Browser",
        "google chrome" => "Google Chrome",
        other => {
            // Capitalize first letter fallback — System Events often matches pmset name.
            if app.is_empty() {
                return String::new();
            }
            // Prefer original app token from pmset
            let _ = other;
            app
        }
    };
    let script = format!(
        r#"
tell application "System Events"
  if not (exists process "{proc}") then return ""
  tell process "{proc}"
    try
      set titles to name of every window
      set AppleScript's text item delimiters to " || "
      set joined to titles as text
      set AppleScript's text item delimiters to ""
      return joined
    on error
      return ""
    end try
  end tell
end tell
"#
    );
    run_osascript(&script, Duration::from_millis(2000))
        .unwrap_or_default()
        .trim()
        .to_string()
}

#[cfg(not(target_os = "macos"))]
fn fetch_window_titles(_app: &str) -> String {
    String::new()
}

fn parse_playing_apps(raw: &str) -> Vec<String> {
    let mut apps = Vec::new();
    for line in raw.lines() {
        if !line.contains("Playing audio") {
            continue;
        }
        // pid 123(AppName):
        if let Some(start) = line.find("pid ") {
            let rest = &line[start + 4..];
            if let Some(open) = rest.find('(') {
                if let Some(close) = rest[open + 1..].find(')') {
                    let app = rest[open + 1..open + 1 + close].trim();
                    if !app.is_empty() && !is_noise_app(app) {
                        apps.push(app.to_string());
                    }
                }
            }
        }
    }
    apps
}

fn youtube_from_title(detail: &str) -> (String, String) {
    // "chrome: Song - Artist - YouTube"
    let cleaned = detail
        .split_once(':')
        .map(|(_, r)| r.trim())
        .unwrap_or(detail)
        .trim();
    let without_yt = cleaned
        .trim_end_matches(" - YouTube")
        .trim_end_matches(" - youtube")
        .trim();
    if let Some(sep) = without_yt.rfind(" - ") {
        (
            without_yt[..sep].trim().to_string(),
            without_yt[sep + 3..].trim().to_string(),
        )
    } else {
        (without_yt.to_string(), String::new())
    }
}

fn probe_now_playing() -> NowPlayingSnapshot {
    #[cfg(not(target_os = "macos"))]
    {
        return idle_snapshot();
    }

    #[cfg(target_os = "macos")]
    {
        let deezer_state = deezer_playback_state();
        let track = deezer_track();

        let assertions = run_cmd(
            "pmset",
            &["-g", "assertions"],
            Duration::from_secs(3),
        )
        .unwrap_or_default();
        let playing_apps = parse_playing_apps(&assertions);
        let deezer_in_pmset = playing_apps
            .iter()
            .any(|a| a.eq_ignore_ascii_case("deezer"));
        let others: Vec<String> = playing_apps
            .into_iter()
            .filter(|a| !a.eq_ignore_ascii_case("deezer"))
            .collect();

        if deezer_state == "playing"
            || (deezer_in_pmset && deezer_state != "paused")
        {
            let (mut title, artist) =
                track.clone().unwrap_or_else(|| (String::new(), String::new()));
            // Sans Automatisation, les menus Deezer sont vides — afficher au moins la source.
            if title.is_empty() {
                title = "Lecture Deezer".into();
            }
            return NowPlayingSnapshot {
                playing: true,
                source: "deezer".into(),
                title,
                artist,
                app: "Deezer".into(),
            };
        }

        if deezer_state == "paused" && deezer_in_pmset && others.is_empty() {
            let (title, artist) = track.clone().unwrap_or_else(|| (String::new(), String::new()));
            return NowPlayingSnapshot {
                playing: false,
                source: "deezer".into(),
                title,
                artist,
                app: "Deezer".into(),
            };
        }

        for app in &others {
            let lower = app.to_ascii_lowercase();
            if lower == "spotify" {
                return NowPlayingSnapshot {
                    playing: true,
                    source: "spotify".into(),
                    title: String::new(),
                    artist: String::new(),
                    app: app.clone(),
                };
            }
            if lower == "music" || lower == "apple music" {
                return NowPlayingSnapshot {
                    playing: true,
                    source: "apple_music".into(),
                    title: String::new(),
                    artist: String::new(),
                    app: app.clone(),
                };
            }
            if let Some(browser) = is_browser_app(app) {
                let titles = fetch_window_titles(app);
                let yt = regex_is_youtube(&titles);
                if yt {
                    let (title, artist) = youtube_from_title(&format!("{browser}: {titles}"));
                    return NowPlayingSnapshot {
                        playing: true,
                        source: "youtube".into(),
                        title,
                        artist,
                        app: app.clone(),
                    };
                }
                let title = titles
                    .split(" || ")
                    .next()
                    .unwrap_or("")
                    .trim()
                    .to_string();
                return NowPlayingSnapshot {
                    playing: true,
                    source: "browser".into(),
                    title,
                    artist: String::new(),
                    app: app.clone(),
                };
            }
        }

        if !others.is_empty() {
            return NowPlayingSnapshot {
                playing: true,
                source: "other".into(),
                title: String::new(),
                artist: String::new(),
                app: others[0].clone(),
            };
        }

        // Titre prioritaire : même si l’état menu est unknown, afficher la piste Deezer.
        if let Some((title, artist)) = track {
            if !title.is_empty() {
                let playing = deezer_state == "playing"
                    || (deezer_in_pmset && deezer_state != "paused");
                return NowPlayingSnapshot {
                    playing,
                    source: "deezer".into(),
                    title,
                    artist,
                    app: "Deezer".into(),
                };
            }
        }

        idle_snapshot()
    }
}

fn regex_is_youtube(hint: &str) -> bool {
    let lower = hint.to_ascii_lowercase();
    lower.contains("youtube") || lower.contains("youtu.be") || lower.contains("music.youtube")
}

fn transport_sync(action: &str) -> Result<MusicTransportResult, String> {
    let before = probe_now_playing();
    match action {
        "next" | "previous" => {
            let key = media_key_for_action(action)?;
            post_system_media_key(key)?;
            thread::sleep(Duration::from_millis(400));
            let snapshot = probe_now_playing();
            Ok(MusicTransportResult {
                accepted: true,
                snapshot,
            })
        }
        "toggle" => {
            let want_playing = !before.playing;
            let is_deezer = before.source == "deezer"
                || before.app.to_ascii_lowercase().contains("deezer")
                || deezer_playback_state() != "absent";

            if before.playing {
                // Pause : menu Deezer d'abord (média PLAY souvent no-op sur Deezer).
                let mut accepted = false;
                for _ in 0..4 {
                    let menu_ok = if is_deezer {
                        deezer_menu("pause")
                    } else {
                        false
                    };
                    if !menu_ok {
                        let _ = post_system_media_key(16);
                    }
                    thread::sleep(Duration::from_millis(450));
                    let now = probe_now_playing();
                    if !now.playing {
                        accepted = true;
                        break;
                    }
                    accepted = menu_ok;
                }
                let mut snapshot = probe_now_playing();
                if accepted {
                    snapshot.playing = false;
                    if snapshot.title.is_empty() {
                        snapshot.title = before.title.clone();
                        snapshot.artist = before.artist.clone();
                        snapshot.source = if before.source != "none" {
                            before.source.clone()
                        } else {
                            snapshot.source
                        };
                        snapshot.app = if snapshot.app.is_empty() {
                            before.app.clone()
                        } else {
                            snapshot.app
                        };
                    }
                }
                Ok(MusicTransportResult { accepted, snapshot })
            } else {
                // Play : touche média d'abord (reprise Deezer fiable).
                // Le menu « Lecture » peut renvoyer ok sans démarrer → ne pas
                // court-circuiter la touche média.
                let mut accepted = false;
                let _ = post_system_media_key(16);
                thread::sleep(Duration::from_millis(900));
                if probe_now_playing().playing == want_playing {
                    accepted = true;
                } else {
                    for _ in 0..3 {
                        if is_deezer {
                            let _ = deezer_menu("play");
                            thread::sleep(Duration::from_millis(500));
                            if probe_now_playing().playing == want_playing {
                                accepted = true;
                                break;
                            }
                        }
                        let _ = post_system_media_key(16);
                        thread::sleep(Duration::from_millis(800));
                        if probe_now_playing().playing == want_playing {
                            accepted = true;
                            break;
                        }
                    }
                }
                let mut snapshot = probe_now_playing();
                if accepted {
                    snapshot.playing = true;
                    if snapshot.title.is_empty() {
                        snapshot.title = before.title.clone();
                        snapshot.artist = before.artist.clone();
                    }
                    if snapshot.source == "none" && before.source != "none" {
                        snapshot.source = before.source.clone();
                        snapshot.app = before.app.clone();
                    }
                }
                Ok(MusicTransportResult { accepted, snapshot })
            }
        }
        _ => Err(format!("invalid_action:{action}")),
    }
}

fn music_diag(line: &str) {
    let _ = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("/tmp/elsa-music.log")
        .and_then(|mut f| {
            use std::io::Write;
            writeln!(f, "{line}")
        });
}

/// Push périodique vers le WebView via `eval` (CustomEvent) — contourne IPC/CSP.
pub fn start_now_playing_push(app: tauri::AppHandle) {
    use tauri::Manager;
    // Préflight Automatisation (déclenche la popup macOS si besoin).
    let _ = run_osascript(
        r#"tell application "System Events" to get name of first process"#,
        Duration::from_secs(3),
    );
    loop {
        let snap = probe_now_playing();
        music_diag(&format!(
            "push:source={} playing={} title={}",
            snap.source, snap.playing, snap.title
        ));
        if let Some(win) = app.get_webview_window("main") {
            if let Ok(json) = serde_json::to_string(&snap) {
                // Hook + patch DOM : survit même si invoke/CSP cassés et sans
                // redeploy Vercel (React remonte « Silence » → MutationObserver).
                let script = format!(
                    r#"(function(){{
  var d={json};
  if(!window.__ELSA_NP_HOOK__){{
    window.__ELSA_NP_HOOK__=true;
    window.__ELSA_NP__=null;
                window.__ELSA_NP_APPLY__=function(x){{
      if(!x||x.source==='none')return;
      if(!x.title)x.title='Lecture en cours';
      window.__ELSA_NP__=x;
      try{{window.dispatchEvent(new CustomEvent('elsa-now-playing',{{detail:x}}));}}catch(_e){{}}
      var root=document.querySelector('[data-home="now-playing"]');
      if(!root)return;
      var ps=root.querySelectorAll('p.t-content');
      if(ps[0])ps[0].textContent=x.title;
      if(ps[1])ps[1].textContent=x.artist||'';
      var src=root.querySelector('p.t-mono');
      if(src){{
        var labels={{deezer:'Deezer',youtube:'YouTube',spotify:'Spotify',apple_music:'Apple Music',browser:'Navigateur',other:'Autre',none:''}};
        src.textContent=labels[x.source]||x.source||'';
      }}
    }};
    new MutationObserver(function(){{
      if(window.__ELSA_NP__)window.__ELSA_NP_APPLY__(window.__ELSA_NP__);
    }}).observe(document.documentElement,{{childList:true,subtree:true}});
  }}
  window.__ELSA_NP_APPLY__(d);
}})();"#
                );
                let _ = win.eval(&script);
            }
        }
        thread::sleep(Duration::from_millis(2000));
    }
}

/// Snapshot Now Playing hôte (local Mac) — pour shell packagé hors Next darwin.
#[tauri::command]
pub async fn music_now_playing() -> Result<NowPlayingSnapshot, String> {
    music_diag("invoke:music_now_playing");
    let snap = tauri::async_runtime::spawn_blocking(probe_now_playing)
        .await
        .map_err(|e| format!("join_failed:{e}"))?;
    music_diag(&format!(
        "probe:source={} playing={} title={}",
        snap.source, snap.playing, snap.title
    ));
    Ok(snap)
}

/// Transport shell : next/prev = média ; toggle = menu Deezer + média vérifié.
#[tauri::command]
pub async fn music_transport(action: String) -> Result<MusicTransportResult, String> {
    let action = action.trim().to_string();
    tauri::async_runtime::spawn_blocking(move || transport_sync(&action))
        .await
        .map_err(|e| format!("join_failed:{e}"))?
}

#[cfg(target_os = "macos")]
const DEEZER_STATE_SCRIPT: &str = r#"
tell application "System Events"
  if not (exists process "Deezer") then return "absent"
  tell process "Deezer"
    try
      if exists menu item "Pause" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        return "playing"
      end if
    end try
    try
      if exists menu item "Lecture" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        return "paused"
      end if
    end try
    try
      if exists menu item "Play" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        return "paused"
      end if
    end try
    return "unknown"
  end tell
end tell
"#;

#[cfg(target_os = "macos")]
const DEEZER_TRACK_SCRIPT: &str = r#"
tell application "System Events"
  if not (exists process "Deezer") then return ""
  tell process "Deezer"
    try
      set names to name of every menu item of menu "Fenêtre" of menu bar 1
      set AppleScript's text item delimiters to linefeed
      set joined to names as text
      set AppleScript's text item delimiters to ""
      return joined
    on error
      return ""
    end try
  end tell
end tell
"#;

#[cfg(target_os = "macos")]
const DEEZER_PAUSE_SCRIPT: &str = r#"
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    repeat 8 times
      try
        if exists menu item "Pause" of menu 1 of menu bar item "Lecture" of menu bar 1 then
          click menu item "Pause" of menu 1 of menu bar item "Lecture" of menu bar 1
          return "ok"
        end if
      end try
      delay 0.3
    end repeat
    return "fail"
  end tell
end tell
"#;

#[cfg(target_os = "macos")]
const DEEZER_PLAY_SCRIPT: &str = r#"
tell application "System Events"
  if not (exists process "Deezer") then return "missing"
  tell process "Deezer"
    try
      if exists menu item "Lecture" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Lecture" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    try
      if exists menu item "Play" of menu 1 of menu bar item "Lecture" of menu bar 1 then
        click menu item "Play" of menu 1 of menu bar item "Lecture" of menu bar 1
        return "ok"
      end if
    end try
    return "fail"
  end tell
end tell
"#;
