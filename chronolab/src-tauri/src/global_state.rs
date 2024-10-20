use serde::{Deserialize, Deserializer, Serialize};
use tauri::{path::SafePathBuf, AppHandle, Emitter, State};
use serde_json::Value; 
use std::sync::Mutex;
use chrono::NaiveDateTime;

#[derive(Deserialize, Serialize, Clone, Debug)]
#[allow(dead_code)]
pub struct LoadCsvSettings {
    pub datetime_index_col: String,
    pub datetime_parsing_format_string: String,
    pub load_cols: Vec<String>,
    pub time_bounds: Option<TimeBounds>,
}

#[derive(Deserialize, Serialize, Clone, Debug)]
#[allow(dead_code)]
pub struct TimeBounds {
    #[serde(deserialize_with = "nullable_naive_datetime")]
    pub start_time: Option<NaiveDateTime>,
    
    #[serde(deserialize_with = "nullable_naive_datetime")]
    pub end_time: Option<NaiveDateTime>,
}

fn nullable_naive_datetime<'de, D>(deserializer: D) -> Result<Option<NaiveDateTime>, D::Error>
where
    D: Deserializer<'de>,
{
    let s: Option<String> = Option::deserialize(deserializer)?;
    if let Some(ref s) = s {
        if s.is_empty() {
            return Ok(None); // Treat empty string as None
        }
        NaiveDateTime::parse_from_str(s.trim_end_matches("Z"), "%Y-%m-%dT%H:%M:%S%.3f")
            .map(Some)
            .map_err(serde::de::Error::custom)
    } else {
        Ok(None) // Treat missing value as None
    }
}

#[derive(Default, Serialize)]
pub struct AppState {
    pub csv_file_path: Option<SafePathBuf>,
    pub load_csv_settings: Option<LoadCsvSettings>,
    pub video_file_path: Option<SafePathBuf>,
    pub video_start_time: Option<NaiveDateTime>,
    pub is_multiwindow: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum AppStateField {
    CsvFilePath(Option<SafePathBuf>),
    LoadCsvSettings(Option<LoadCsvSettings>),
    VideoFilePath(Option<SafePathBuf>),
    VideoStartTime(Option<NaiveDateTime>),
    IsMultiwindow(bool),
}

impl AppState {
    fn update_field(&mut self, field: AppStateField) {
        match field {
            AppStateField::CsvFilePath(value) => self.csv_file_path = value,
            AppStateField::LoadCsvSettings(value) => self.load_csv_settings = value,
            AppStateField::VideoFilePath(value) => self.video_file_path = value,
            AppStateField::VideoStartTime(value) => self.video_start_time = value,
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

    println!("{:#?}", field.clone());
    println!("{:#?}", field_value.clone());

    match field.as_str() {
        "csvFilePath" => {
            let value: Option<SafePathBuf> = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to deserialize csvFilePath: {}", err))?;
            app_state.update_field(AppStateField::CsvFilePath(value));
            update_event_name = "csv-file-path";
        }
        "loadCsvSettings" => {
            let value: Option<LoadCsvSettings> = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to deserialize loadCsvSettings: {}", err))?;
            app_state.update_field(AppStateField::LoadCsvSettings(value));
            update_event_name = "load-csv-settings";
        }
        "videoFilePath" => {
            let value: Option<SafePathBuf> = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to deserialize videoFilePath: {}", err))?;
            app_state.update_field(AppStateField::VideoFilePath(value));
            update_event_name = "video-file-path";
        }
        "videoStartTime" => {
            let value: Option<String> = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to deserialize videoStartTime: {}", err))?;
            if let Some(value_string) = value { 
                let dt = NaiveDateTime::parse_from_str(value_string.trim_end_matches("Z"), "%Y-%m-%dT%H:%M:%S%.3f")
                    .map(Some)
                    .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to parse videoStartTime: {}", err))?;
                app_state.update_field(AppStateField::VideoStartTime(dt));
            } else {
                app_state.update_field(AppStateField::VideoStartTime(None));
            }
            update_event_name = "video-start-time";
        }
        "isMultiwindow" => {
            let value: bool = serde_json::from_value(field_value.clone())
                .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to deserialize isMultiwindow: {}", err))?;
            app_state.update_field(AppStateField::IsMultiwindow(value));
            update_event_name = "is-multiwindow";
        }
        _ => return Err("Unknown field".to_string()),
    }

    app.emit(&format!("state-change--{}", update_event_name), field_value)
        .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to emit state update event for {}: {}", update_event_name, err))?;

    println!("\n\nLoad CSV Settings");
    println!("{:?}", app_state.load_csv_settings);

    Ok(())
}

/// This function retrieves the global app state when invoked from Tauri
#[tauri::command]
pub async fn get_app_state<'a>(
    state: State<'a, Mutex<AppState>>,
    field: String,
) -> Result<Value, String> {
    let app_state = state.lock().unwrap();

    match field.as_str() {
        "csvFilePath" => {
            let value = app_state.csv_file_path.clone(); // Assuming this returns Option<SafePathBuf>
            let value_json = serde_json::to_value(value)
                .map_err(|err| format!("Function get_app_state in global_state.rs -- failed to serialize csvFilePath: {}", err))?;
            Ok(value_json)
        }
        "loadCsvSettings" => {
            let value = app_state.load_csv_settings.clone(); // Assuming this returns Option<LoadCsvSettings>
            let value_json = serde_json::to_value(value)
                .map_err(|err| format!("Function get_app_state in global_state.rs -- failed to serialize loadCsvSettings: {}", err))?;
            Ok(value_json)
        }
        "videoFilePath" => {
            let value = app_state.video_file_path.clone(); // Assuming this returns Option<SafePathBuf>
            let value_json = serde_json::to_value(value)
                .map_err(|err| format!("Function get_app_state in global_state.rs -- failed to serialize videoFilePath: {}", err))?;
            Ok(value_json)
        }
        "videoStartTime" => {
            let value = app_state.video_start_time.clone(); // Assuming this returns Option<SafePathBuf>
            let value_json = serde_json::to_value(value)
                .map_err(|err| format!("Function get_app_state in global_state.rs -- failed to serialize videoStartTime: {}", err))?;
            Ok(value_json)
        }
        "isMultiwindow" => {
            let value = app_state.is_multiwindow; // Assuming this returns bool
            let value_json = serde_json::to_value(value)
                .map_err(|err| format!("Function get_app_state in global_state.rs -- failed to serialize isMultiwindow: {}", err))?;
            Ok(value_json)
        }
        _ => Err("Unknown field".to_string()),
    }
}