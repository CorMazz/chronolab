mod dataframe_handlers;
use crate::dataframe_handlers::scan_csv;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![scan_csv])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
