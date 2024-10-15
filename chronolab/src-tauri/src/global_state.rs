use serde::Deserialize;
use tauri::{path::SafePathBuf, AppHandle, Emitter, State};
use serde_json::Value; 
use std::sync::Mutex;

#[derive(Default)]
pub struct AppState {
    pub csv_file_path: Option<SafePathBuf>,
    pub video_file_path: Option<SafePathBuf>,
    pub is_multiwindow: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AppStateField {
    CsvFilePath(Option<SafePathBuf>),
    VideoFilePath(Option<SafePathBuf>),
    IsMultiwindow(bool),
}

impl AppState {
    fn update_field(&mut self, field: AppStateField) {
        match field {
            AppStateField::CsvFilePath(value) => self.csv_file_path = value,
            AppStateField::VideoFilePath(value) => self.video_file_path = value,
            AppStateField::IsMultiwindow(value) => self.is_multiwindow = value,
        }
    }
}

/// This function sets the global app state when invoked from tauri
#[tauri::command]
pub async fn set_app_state<'a>(
    app: AppHandle,
    state: State<'a, Mutex<AppState>>,
    field: String, 
    field_value: Value,
) -> Result<(), String> {
    let mut app_state= state.lock().unwrap();
    let update_event_name: &str;

    match field.as_str() {
        "csvFilePath" => {
            let value: Option<SafePathBuf> = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Failed to deserialize csvFilePath: {}", err))?;
            app_state.update_field(AppStateField::CsvFilePath(value));
            update_event_name = "csv-file-path";
        }
        "videoFilePath" => {
            let value: Option<SafePathBuf> = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Failed to deserialize videoFilePath: {}", err))?;
            app_state.update_field(AppStateField::VideoFilePath(value));
            update_event_name = "video-file-path";
        }
        "isMultiwindow" => {
            let value: bool = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Failed to deserialize isMultiwindow: {}", err))?;
            app_state.update_field(AppStateField::IsMultiwindow(value));
            update_event_name = "is-multiwindow";
        }
        _ => return Err("Unknown field".to_string()),
    }

    app.emit(&format!("state-change--{}", update_event_name), field_value)
        .map_err(|err| format!("Failed to emit state update event for {}: {}", update_event_name, err))?;

    Ok(())
}