mod dataframe_handlers;
mod video_handlers;

use std::sync::Mutex;
use tauri::Manager;
use video_handlers::emit_video_time_change;
use dataframe_handlers::{scan_csv, get_csv_data};


#[derive(Default)]
pub struct AppState {
    lazyframe: Option<polars::prelude::LazyFrame>
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
    .setup(|app| {
        app.manage(Mutex::new(AppState::default()));
        Ok(())
    })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![scan_csv, get_csv_data, emit_video_time_change])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
