mod dataframe_handlers;
mod global_state;
mod video_handlers;

use dataframe_handlers::{get_csv_data, get_csv_schema};
use global_state::{
    clear_app_state, get_app_state_field, load_app_state_from_file, save_app_state_to_file,
    set_app_state_field, AppState,
};
use std::sync::Mutex;
use tauri::Manager;
use video_handlers::emit_video_time_change;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            app.manage(Mutex::new(AppState::default()));
            Ok(())
        })
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_csv_schema,
            get_csv_data,
            emit_video_time_change,
            set_app_state_field,
            get_app_state_field,
            save_app_state_to_file,
            load_app_state_from_file,
            clear_app_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
