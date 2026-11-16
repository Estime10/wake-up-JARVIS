//! Contrôle média macOS — touches système (comme le clavier), sans focus d'app.

use serde::Serialize;
use std::process::Command;
use std::thread;
use std::time::Duration;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MusicTransportOk {
    pub accepted: bool,
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
    /// kCGSessionEventTap — un seul tap (HID+session = double-toggle).
    const SESSION_EVENT_TAP: u32 = 1;
    // NX_SUBTYPE_AUX_CONTROL_BUTTONS = 8 (même discriminant que NSScreenChangedEventType dans cocoa).
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
    let output = Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output();
    match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout).trim() == "ok",
        Err(_) => false,
    }
}

#[cfg(not(target_os = "macos"))]
fn deezer_menu(_intent: &str) -> bool {
    false
}

/// Menu Lecture Deezer : "playing" | "paused" | autre.
#[cfg(target_os = "macos")]
fn deezer_playback_state() -> &'static str {
    let script = r#"
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
    let output = Command::new("osascript").arg("-e").arg(script).output();
    match output {
        Ok(out) => match String::from_utf8_lossy(&out.stdout).trim() {
            "playing" => "playing",
            "paused" => "paused",
            "absent" => "absent",
            _ => "unknown",
        },
        Err(_) => "unknown",
    }
}

#[cfg(not(target_os = "macos"))]
fn deezer_playback_state() -> &'static str {
    "absent"
}

#[cfg(target_os = "macos")]
fn is_audio_playing() -> bool {
    match deezer_playback_state() {
        "playing" => return true,
        "paused" => return false,
        _ => {}
    }
    let output = Command::new("pmset")
        .args(["-g", "assertions"])
        .output();
    match output {
        Ok(out) => String::from_utf8_lossy(&out.stdout).contains("Playing audio"),
        Err(_) => false,
    }
}

#[cfg(not(target_os = "macos"))]
fn is_audio_playing() -> bool {
    false
}

/// Transport shell : next/prev = touche média ; toggle Deezer = menu + média.
#[tauri::command]
pub async fn music_transport(action: String) -> Result<MusicTransportOk, String> {
    let action = action.trim();
    match action {
        "next" | "previous" => {
            let key = media_key_for_action(action)?;
            post_system_media_key(key)?;
            thread::sleep(Duration::from_millis(400));
            Ok(MusicTransportOk { accepted: true })
        }
        "toggle" => {
            let was_playing = is_audio_playing();
            if was_playing {
                // Pause Deezer : menu d'abord (PLAY média souvent no-op).
                let mut ok = false;
                for _ in 0..4 {
                    ok = deezer_menu("pause") || post_system_media_key(16).is_ok();
                    thread::sleep(Duration::from_millis(450));
                    if !is_audio_playing() {
                        return Ok(MusicTransportOk { accepted: true });
                    }
                }
                Ok(MusicTransportOk { accepted: ok })
            } else {
                let ok = post_system_media_key(16).is_ok() || deezer_menu("play");
                thread::sleep(Duration::from_millis(500));
                Ok(MusicTransportOk { accepted: ok })
            }
        }
        _ => Err(format!("invalid_action:{action}")),
    }
}

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
