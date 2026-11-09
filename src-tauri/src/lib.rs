mod studio_local;
mod webview_pane;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Manager,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let reload = MenuItemBuilder::with_id("reload", "Recharger")
                .accelerator("CmdOrCtrl+R")
                .build(app)?;
            let app_menu = SubmenuBuilder::new(app, "E.L.S.A.")
                .item(&reload)
                .separator()
                .quit()
                .build()?;
            let menu = MenuBuilder::new(app).item(&app_menu).build()?;
            app.set_menu(menu)?;
            Ok(())
        })
        .on_menu_event(|app, event| {
            if event.id() == "reload" {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.reload();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            studio_local::studio_ensure,
            webview_pane::webview_pane_set_studio,
            webview_pane::webview_pane_set_browser,
            webview_pane::webview_pane_clear_studio,
            webview_pane::webview_pane_clear_browser,
            webview_pane::webview_pane_debug,
        ])
        .run(tauri::generate_context!())
        .expect("E.L.S.A. failed to start");
}
