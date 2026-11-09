use std::net::TcpStream;
use std::time::Duration;

const STUDIO_HOST: &str = "127.0.0.1";
const STUDIO_PORT: u16 = 54323;
const STUDIO_URL: &str = "http://127.0.0.1:54323/project/default";

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudioEnsureResult {
    pub studio_url: String,
    pub already_running: bool,
}

fn studio_port_open() -> bool {
    let addr = format!("{STUDIO_HOST}:{STUDIO_PORT}");
    TcpStream::connect_timeout(
        &addr.parse().expect("studio addr"),
        Duration::from_millis(700),
    )
    .is_ok()
}

/// Probe loopback Studio — pas d’API Next (Vercel refuse le lancement local).
#[tauri::command]
pub async fn studio_ensure() -> Result<StudioEnsureResult, String> {
    if studio_port_open() {
        return Ok(StudioEnsureResult {
            studio_url: STUDIO_URL.to_string(),
            already_running: true,
        });
    }
    Err("not_running".into())
}
