mod elsa_paths;
mod piper_runtime;
mod studio_local;
mod terminal;
mod voice;
mod webview_pane;

use std::sync::Mutex;

use tauri::{
    menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder},
    Manager, RunEvent,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(voice::PiperProcess(Mutex::new(None)))
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

            // Mémorise le repo si trouvé (DX) — sert au `.app` Finder pour Studio/Piper.
            let handle = app.handle().clone();
            if let Ok(root) = elsa_paths::resolve_repo_root(&handle) {
                elsa_paths::remember_repo_root(&handle, &root);
            }

            // Piper : bootstrap Application Support en arrière-plan (zéro terminal).
            let piper_handle = app.handle().clone();
            std::thread::spawn(move || {
                voice::warm_piper(&piper_handle);
            });
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
            terminal::terminal_run,
            terminal::terminal_home,
            voice::voice_speak,
            voice::voice_stop,
            webview_pane::webview_pane_set_studio,
            webview_pane::webview_pane_set_browser,
            webview_pane::webview_pane_clear_studio,
            webview_pane::webview_pane_clear_browser,
            webview_pane::webview_pane_debug,
        ])
        .build(tauri::generate_context!())
        .expect("E.L.S.A. failed to start")
        .run(|app, event| {
            if matches!(event, RunEvent::Exit | RunEvent::ExitRequested { .. }) {
                voice::shutdown_piper(app);
            }
        });
}
