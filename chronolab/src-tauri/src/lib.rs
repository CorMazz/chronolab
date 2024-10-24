mod dataframe_handlers;
mod video_handlers;
mod global_state;

use std::sync::Mutex;
use tauri::Manager;
use video_handlers::emit_video_time_change;
use dataframe_handlers::{get_csv_schema, get_csv_data};
use global_state::{get_app_state, load_app_state_from_file, save_app_state_to_file, set_app_state, AppState};


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            set_app_state, 
            get_app_state,
            save_app_state_to_file,
            load_app_state_from_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
