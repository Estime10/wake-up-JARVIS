use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, PhysicalSize, WebviewUrl};
use url::Url;

const STUDIO_LABEL: &str = "elsa-studio";
const STUDIO_DIRECT: &str = "http://127.0.0.1:54323/project/default";
const MAIN_LABEL: &str = "main";

#[derive(Debug, Clone, serde::Deserialize, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaneBounds {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaneDebugInfo {
    pub scale: f64,
    pub win_w: f64,
    pub win_h: f64,
    pub main_w: f64,
    pub main_h: f64,
    pub inset_y: f64,
    pub requested: PaneBounds,
    pub child_x: Option<f64>,
    pub child_y: Option<f64>,
    pub child_w: Option<f64>,
    pub child_h: Option<f64>,
}

fn resolve_studio_url(raw: &str) -> Result<Url, String> {
    let candidate = if raw.is_empty() || raw.contains("54332") {
        STUDIO_DIRECT
    } else {
        raw
    };
    let url = Url::parse(candidate).map_err(|e| e.to_string())?;
    let host = url.host_str().unwrap_or("");
    if host != "127.0.0.1" && host != "localhost" {
        return Err("studio host not allowed".into());
    }
    Ok(url)
}

/// DOM `getBoundingClientRect` = coords dans le WKWebView principal.
/// `add_child` = coords dans la zone cliente de la **fenêtre**.
///
/// Écart typique macOS : séparateur titlebar → webview principal plus court
/// que `inner_size`. Sans compensation, le child s’affiche trop haut.
fn main_webview_top_inset(app: &AppHandle) -> f64 {
    let Some(win) = app.get_webview_window(MAIN_LABEL) else {
        return 0.0;
    };
    let Ok(scale) = win.scale_factor() else {
        return 0.0;
    };
    let Ok(PhysicalSize {
        height: win_h_px, ..
    }) = win.inner_size()
    else {
        return 0.0;
    };
    let Some(main) = app.get_webview(MAIN_LABEL) else {
        return 0.0;
    };
    let Ok(PhysicalSize {
        height: main_h_px, ..
    }) = main.size()
    else {
        return 0.0;
    };

    let win_h = win_h_px as f64 / scale;
    let main_h = main_h_px as f64 / scale;
    (win_h - main_h).max(0.0)
}

fn apply_bounds(app: &AppHandle, webview: &tauri::Webview, bounds: &PaneBounds) -> Result<(), String> {
    if bounds.width < 1.0 || bounds.height < 1.0 {
        let _ = webview.hide();
        return Ok(());
    }

    let inset_y = main_webview_top_inset(app);
    let y = bounds.y + inset_y;
    // Bride la hauteur : un frame trop haut + inset titlebar déborde la fenêtre
    // et masque le header Studio (projets / back / https).
    let height = clamp_pane_height(app, y, bounds.height);
    // Logical = CSS px du getBoundingClientRect (même espace que le WKWebView principal).
    webview
        .set_position(LogicalPosition::new(bounds.x, y))
        .map_err(|e| e.to_string())?;
    webview
        .set_size(LogicalSize::new(bounds.width, height))
        .map_err(|e| e.to_string())?;
    webview.show().map_err(|e| e.to_string())?;
    Ok(())
}

fn clamp_pane_height(app: &AppHandle, y: f64, height: f64) -> f64 {
    let Some(win) = app.get_webview_window(MAIN_LABEL) else {
        return height.max(1.0);
    };
    let Ok(scale) = win.scale_factor() else {
        return height.max(1.0);
    };
    let Ok(PhysicalSize {
        height: win_h_px, ..
    }) = win.inner_size()
    else {
        return height.max(1.0);
    };
    let win_h = win_h_px as f64 / scale;
    let max_h = (win_h - y).max(1.0);
    height.max(1.0).min(max_h)
}

fn upsert_child(
    app: &AppHandle,
    label: &str,
    url: Url,
    bounds: &PaneBounds,
    force: bool,
) -> Result<(), String> {
    if let Some(wv) = app.get_webview(label) {
        let current = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| wv.url().ok()))
            .ok()
            .flatten();
        if force {
            if current.as_ref() == Some(&url) {
                wv.reload().map_err(|e| e.to_string())?;
            } else {
                wv.navigate(url).map_err(|e| e.to_string())?;
            }
        } else if current.as_ref() != Some(&url) {
            wv.navigate(url).map_err(|e| e.to_string())?;
        }
        return apply_bounds(app, &wv, bounds);
    }

    let window = app
        .get_window(MAIN_LABEL)
        .ok_or_else(|| "main window missing".to_string())?;

    let inset_y = main_webview_top_inset(app);
    let y = bounds.y + inset_y;
    let height = clamp_pane_height(app, y, bounds.height);
    let builder = tauri::webview::WebviewBuilder::new(label, WebviewUrl::External(url));
    let wv = window
        .add_child(
            builder,
            LogicalPosition::new(bounds.x, y),
            LogicalSize::new(bounds.width.max(1.0), height),
        )
        .map_err(|e| e.to_string())?;
    apply_bounds(app, &wv, bounds)
}

fn clear_child(app: &AppHandle, label: &str) -> Result<(), String> {
    if let Some(wv) = app.get_webview(label) {
        wv.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn webview_pane_set_studio(
    app: AppHandle,
    url: String,
    bounds: PaneBounds,
    force: Option<bool>,
) -> Result<(), String> {
    let parsed = resolve_studio_url(&url)?;
    upsert_child(&app, STUDIO_LABEL, parsed, &bounds, force.unwrap_or(false))
}

#[tauri::command]
pub async fn webview_pane_clear_studio(app: AppHandle) -> Result<(), String> {
    clear_child(&app, STUDIO_LABEL)
}

#[tauri::command]
pub async fn webview_pane_debug(
    app: AppHandle,
    bounds: PaneBounds,
    label: Option<String>,
) -> Result<PaneDebugInfo, String> {
    let inset_y = main_webview_top_inset(&app);
    let win = app
        .get_webview_window(MAIN_LABEL)
        .ok_or_else(|| "main window missing".to_string())?;
    let scale = win.scale_factor().map_err(|e| e.to_string())?;
    let win_size = win.inner_size().map_err(|e| e.to_string())?;
    let main = app
        .get_webview(MAIN_LABEL)
        .ok_or_else(|| "main webview missing".to_string())?;
    let main_size = main.size().map_err(|e| e.to_string())?;

    let child_label = label.unwrap_or_else(|| STUDIO_LABEL.to_string());
    let (child_x, child_y, child_w, child_h) = if let Some(child) = app.get_webview(&child_label)
    {
        let pos = child.position().ok();
        let size = child.size().ok();
        (
            pos.map(|p| p.x as f64 / scale),
            pos.map(|p| p.y as f64 / scale),
            size.map(|s| s.width as f64 / scale),
            size.map(|s| s.height as f64 / scale),
        )
    } else {
        (None, None, None, None)
    };

    Ok(PaneDebugInfo {
        scale,
        win_w: win_size.width as f64 / scale,
        win_h: win_size.height as f64 / scale,
        main_w: main_size.width as f64 / scale,
        main_h: main_size.height as f64 / scale,
        inset_y,
        requested: bounds,
        child_x,
        child_y,
        child_w,
        child_h,
    })
}
