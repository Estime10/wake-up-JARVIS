use tauri::{AppHandle, LogicalPosition, LogicalSize, Manager, PhysicalSize, WebviewUrl};
use url::Url;

const STUDIO_LABEL: &str = "elsa-studio";
const STUDIO_DIRECT: &str = "http://127.0.0.1:54323/project/default";
const MAIN_LABEL: &str = "main";
/// Largeur « design » dashboard Supabase — zoom pour tenir dans le side panel.
const CLOUD_STUDIO_DESIGN_WIDTH: f64 = 1280.0;

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
    let trimmed = raw.trim();
    // Proxy embed local (:54332) → Studio CLI direct. Les URLs cloud
    // (`supabase.com/dashboard/project/{ref}`) passent telles quelles.
    let candidate = if trimmed.is_empty() || trimmed.contains("54332") {
        STUDIO_DIRECT
    } else {
        trimmed
    };
    let url = Url::parse(candidate).map_err(|e| e.to_string())?;
    let host = url.host_str().unwrap_or("");
    let path = url.path();
    let local_ok = host == "127.0.0.1" || host == "localhost";
    let cloud_ok =
        host == "supabase.com" && path.starts_with("/dashboard/project/");
    if !local_ok && !cloud_ok {
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

fn window_logical_size(app: &AppHandle) -> Option<(f64, f64)> {
    let win = app.get_webview_window(MAIN_LABEL)?;
    let scale = win.scale_factor().ok()?;
    let PhysicalSize { width, height } = win.inner_size().ok()?;
    Some((width as f64 / scale, height as f64 / scale))
}

fn clamp_pane_bounds(app: &AppHandle, bounds: &PaneBounds) -> PaneBounds {
    let inset_y = main_webview_top_inset(app);
    let x = bounds.x.max(0.0);
    let y = (bounds.y + inset_y).max(0.0);
    let (win_w, win_h) = window_logical_size(app).unwrap_or((f64::MAX, f64::MAX));
    let width = bounds.width.max(1.0).min((win_w - x).max(1.0));
    let height = bounds.height.max(1.0).min((win_h - y).max(1.0));
    PaneBounds {
        x,
        y,
        width,
        height,
    }
}

fn is_cloud_studio_url(url: &Url) -> bool {
    url.host_str() == Some("supabase.com")
        && url.path().starts_with("/dashboard/project/")
}

fn apply_cloud_fit_zoom(webview: &tauri::Webview, bounds: &PaneBounds, url: &Url) {
    if !is_cloud_studio_url(url) {
        let _ = webview.set_zoom(1.0);
        return;
    }
    // Dashboard desktop → zoom pour tenir dans la largeur du liquid-glass.
    let zoom = (bounds.width / CLOUD_STUDIO_DESIGN_WIDTH).clamp(0.35, 1.0);
    let _ = webview.set_zoom(zoom);
}

fn apply_bounds(
    app: &AppHandle,
    webview: &tauri::Webview,
    bounds: &PaneBounds,
    url: &Url,
) -> Result<(), String> {
    if bounds.width < 1.0 || bounds.height < 1.0 {
        let _ = webview.hide();
        return Ok(());
    }

    let clamped = clamp_pane_bounds(app, bounds);
    // Logical = CSS px du getBoundingClientRect (même espace que le WKWebView principal).
    webview
        .set_position(LogicalPosition::new(clamped.x, clamped.y))
        .map_err(|e| e.to_string())?;
    webview
        .set_size(LogicalSize::new(clamped.width, clamped.height))
        .map_err(|e| e.to_string())?;
    apply_cloud_fit_zoom(webview, &clamped, url);
    webview.show().map_err(|e| e.to_string())?;
    Ok(())
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
                wv.navigate(url.clone()).map_err(|e| e.to_string())?;
            }
        } else if current.as_ref() != Some(&url) {
            wv.navigate(url.clone()).map_err(|e| e.to_string())?;
        }
        return apply_bounds(app, &wv, bounds, &url);
    }

    let window = app
        .get_window(MAIN_LABEL)
        .ok_or_else(|| "main window missing".to_string())?;

    let clamped = clamp_pane_bounds(app, bounds);
    let builder = tauri::webview::WebviewBuilder::new(label, WebviewUrl::External(url.clone()));
    let wv = window
        .add_child(
            builder,
            LogicalPosition::new(clamped.x, clamped.y),
            LogicalSize::new(clamped.width, clamped.height),
        )
        .map_err(|e| e.to_string())?;
    apply_bounds(app, &wv, bounds, &url)
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
