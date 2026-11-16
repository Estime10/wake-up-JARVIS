use url::Url;

/// Ouvre une URL allowlistée dans le navigateur système (macOS `open`).
#[tauri::command]
pub async fn open_external_url(url: String) -> Result<(), String> {
    let parsed = Url::parse(url.trim()).map_err(|e| e.to_string())?;
    let host = parsed.host_str().unwrap_or("");
    let path = parsed.path();

    let allowed = match host {
        "supabase.com" => path.starts_with("/dashboard/project/"),
        "127.0.0.1" | "localhost" => true,
        _ => false,
    };
    if !allowed {
        return Err("url not allowed".into());
    }
    if parsed.scheme() != "https" && parsed.scheme() != "http" {
        return Err("scheme not allowed".into());
    }

    std::process::Command::new("open")
        .arg(parsed.as_str())
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}
