use chrono::NaiveDateTime;
use derive_more::derive::{From, Into};
use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;
use std::{
    fs::File,
    io::{BufReader, Write},
    path::Path,
    sync::{Mutex, MutexGuard},
};
use strum::{EnumIter, IntoEnumIterator};
use tauri::{path::SafePathBuf, AppHandle, Emitter, State};

// #############################################################################################################################################
// #############################################################################################################################################
// Newtypes
// #############################################################################################################################################
// #############################################################################################################################################

/// We are using the NewType pattern to make the compiler enforce that developers store the correct state value in AppState fields that share the same primitive type
#[derive(From, Into, Clone, Deserialize, Serialize)]
pub struct SaveFilePath(SafePathBuf);

#[derive(From, Into, Clone, Deserialize, Serialize)]
pub struct CsvFilePath(SafePathBuf);

#[derive(From, Into, Clone, Deserialize, Serialize)]
pub struct VideoFilePath(SafePathBuf);

#[derive(Default, From, Into, Clone, Deserialize, Serialize)]
pub struct IsMultiwindow(bool);

#[derive(Default, From, Into, Clone, Deserialize, Serialize)]
pub struct IsModifiedSinceLastSave(bool);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Newtype Implementations
// ---------------------------------------------------------------------------------------------------------------------------------------------

impl AsRef<Path> for SaveFilePath {
    fn as_ref(&self) -> &Path {
        self.0.as_ref()
    }
}

// #############################################################################################################################################
// #############################################################################################################################################
// Secondary Structs
// #############################################################################################################################################
// #############################################################################################################################################

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


// #############################################################################################################################################
// #############################################################################################################################################
// Appstate & Impls
// #############################################################################################################################################
// #############################################################################################################################################

// ---------------------------------------------------------------------------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// When adding fields to this struct, ensure you also add them to the AppStateField enum.
/// Anywhere that there are two attributes with the same type, create a new type to enforce code correctness at compile time. 
/// Add #[serde(default)] for traits that we do not care if they are missing when loading from a file.
#[derive(Default, Serialize, Deserialize)]
pub struct AppState {
    // Danger: Ensure these are all captured in the AppStateField enum
    pub save_file_path: Option<SaveFilePath>,
    pub csv_file_path: Option<CsvFilePath>,
    pub load_csv_settings: Option<LoadCsvSettings>,
    pub video_file_path: Option<VideoFilePath>,
    pub video_start_time: Option<NaiveDateTime>,
    #[serde(default)]
    pub is_multiwindow: IsMultiwindow,
    #[serde(default)]
    pub is_modified_since_last_save: IsModifiedSinceLastSave,
    // Danger: Ensure these are all captured in the AppStateField enum
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// AppStateField Enum
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Use an enum with named fields so that we can define the appropriate object in JS that can be directly deserialized into an AppStateField enum variant.
/// Then when we match on the AppStateField, the compiler enforces that we have all of our bases covered.
/// Basically, everytime you add a new field to the AppState, so long as you add it here the compiler will make sure you cover all the rest of the
/// spots in the Rust code that you need to deal with that piece of state.
#[derive(Deserialize, strum::Display, Clone, EnumIter)]
#[serde(rename_all = "camelCase")] // When deserializing with Serde, load them as camelCase (to match the JS frontend)
#[strum(serialize_all = "kebab-case")] // When just getting the name using strum's .to_string(), load them as kebab-case to match Tauri event naming convention
pub enum AppStateField {
    SaveFilePath {
        value: Option<SaveFilePath>,
    },
    CsvFilePath {
        value: Option<CsvFilePath>,
    },
    LoadCsvSettings {
        value: Option<LoadCsvSettings>,
    },
    VideoFilePath {
        value: Option<VideoFilePath>,
    },
    VideoStartTime {
        #[serde(deserialize_with = "nullable_naive_datetime")]
        value: Option<NaiveDateTime>,
    },
    IsMultiwindow {
        value: IsMultiwindow,
    },
    IsModifiedSinceLastSave {
        value: IsModifiedSinceLastSave,
    },
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// App State Implementations
// ---------------------------------------------------------------------------------------------------------------------------------------------

impl AppState {
    fn set_field(&mut self, field: AppStateField) {
        match field {
            AppStateField::SaveFilePath { value } => self.save_file_path = value,
            AppStateField::CsvFilePath { value } => self.csv_file_path = value,
            AppStateField::LoadCsvSettings { value } => self.load_csv_settings = value,
            AppStateField::VideoFilePath { value } => self.video_file_path = value,
            AppStateField::VideoStartTime { value } => self.video_start_time = value,
            AppStateField::IsMultiwindow { value } => self.is_multiwindow = value,
            AppStateField::IsModifiedSinceLastSave { value } => self.is_modified_since_last_save = value,
        }
    }

    /// Given an AppStateField variant, returns the same AppStateField variant with the value taken from the current AppState.
    fn get_field(&self, field: AppStateField) -> AppStateField {
        match field {
            AppStateField::SaveFilePath { .. } => AppStateField::SaveFilePath {
                value: self.save_file_path.clone(),
            },
            AppStateField::CsvFilePath { .. } => AppStateField::CsvFilePath {
                value: self.csv_file_path.clone(),
            },
            AppStateField::LoadCsvSettings { .. } => AppStateField::LoadCsvSettings {
                value: self.load_csv_settings.clone(),
            },
            AppStateField::VideoFilePath { .. } => AppStateField::VideoFilePath {
                value: self.video_file_path.clone(),
            },
            AppStateField::VideoStartTime { .. } => AppStateField::VideoStartTime {
                value: self.video_start_time.clone(),
            },
            AppStateField::IsMultiwindow { .. } => AppStateField::IsMultiwindow {
                value: self.is_multiwindow.clone(),
            },
            AppStateField::IsModifiedSinceLastSave{ .. } => AppStateField::IsModifiedSinceLastSave {
                value: self.is_modified_since_last_save.clone(),
            },
        }
    }

    pub fn save_to_file(&self) -> Result<(), String> {
        if let Some(ref path) = self.save_file_path {
            let mut file =
                File::create(path).map_err(|e| format!("Failed to create file: {}", e))?;
            let json = serde_json::to_string_pretty(self)
                .map_err(|e| format!("Serialization error: {}", e))?;
            file.write_all(json.as_bytes())
                .map_err(|e| format!("Failed to write to file: {}", e))?;
            Ok(())
        } else {
            Err("Save file path is not specified.".to_string())
        }
    }

    pub fn load_from_file(path: &Path) -> Result<Self, String> {
        let file = File::open(path).map_err(|err| format!("Failed to open file: {}", err))?;
        let reader = BufReader::new(file);

        let app_state = serde_json::from_reader(reader)
            .map_err(|err| format!("Failed to deserialize JSON: {}", err))?;

        Ok(app_state)
    }
}

// #############################################################################################################################################
// #############################################################################################################################################
// Tauri Commands
// #############################################################################################################################################
// #############################################################################################################################################

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Set App State Field
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// This function sets the global app state when invoked from tauri
/// app_state_field is a serialized variant of the AppStateField enum.
#[tauri::command]
pub async fn set_app_state_field<'a>(
    app: AppHandle,
    state: State<'a, Mutex<AppState>>,
    app_state_field: Value,
) -> Result<(), String> {
    let mut app_state = state.lock().map_err(|e| {
        format!(
            "Error locking app state in set_app_state: {}",
            e.to_string()
        )
    })?;

    let app_state_field: AppStateField =
        serde_json::from_value(app_state_field.clone()).map_err(|err| {
            format!(
                "Failed to deserialize field_value: {}\n\n Err: {}",
                app_state_field, err
            )
        })?;

    let field_name = app_state_field.to_string();
    app_state.set_field(app_state_field.clone());

    // Note that the state is now modified
    set_is_modified_since_last_save(&app, app_state, true)?;

    // We have no choice but to match on all variants to extract the value. Such is Rust...
    match app_state_field {
        AppStateField::SaveFilePath { value } => emit_app_state_update(&app, field_name, value)?,
        AppStateField::CsvFilePath { value } => emit_app_state_update(&app, field_name, value)?,
        AppStateField::LoadCsvSettings { value } => emit_app_state_update(&app, field_name, value)?,
        AppStateField::VideoFilePath { value } => emit_app_state_update(&app, field_name, value)?,
        AppStateField::VideoStartTime { value } => emit_app_state_update(&app, field_name, value)?,
        AppStateField::IsMultiwindow { value } => emit_app_state_update(&app, field_name, value)?,
        AppStateField::IsModifiedSinceLastSave { value } => emit_app_state_update(&app, field_name, value)?,
    };

    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Get App State Field
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// This function retrieves a specific global app state field when invoked from Tauri
#[tauri::command]
pub async fn get_app_state_field<'a>(
    state: State<'a, Mutex<AppState>>,
    app_state_field: Value,
) -> Result<Value, String> {
    let app_state = state.lock().map_err(|e| {
        format!(
            "Error locking app state in get_app_state: {}",
            e.to_string()
        )
    })?;

    let app_state_field: AppStateField =
        serde_json::from_value(app_state_field.clone()).map_err(|err| {
            format!(
                "Failed to deserialize field_value: {}\n\n Err: {}",
                app_state_field, err
            )
        })?;

    // Remember to actually update the app_state_field with the correct value from the AppState
    let app_state_field = app_state.get_field(app_state_field);

    let field_name = app_state_field.to_string();

    match app_state_field {
        AppStateField::SaveFilePath { value } => Ok(to_json(value, field_name)?),
        AppStateField::CsvFilePath { value } => Ok(to_json(value, field_name)?),
        AppStateField::LoadCsvSettings { value } => Ok(to_json(value, field_name)?),
        AppStateField::VideoFilePath { value } => Ok(to_json(value, field_name)?),
        AppStateField::VideoStartTime { value } => Ok(to_json(value, field_name)?),
        AppStateField::IsMultiwindow { value } => Ok(to_json(value, field_name)?),
        AppStateField::IsModifiedSinceLastSave { value } => Ok(to_json(value, field_name)?),
    }
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Clear App State
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Clear the current settings and create a new one.
#[tauri::command]
pub async fn clear_app_state<'a>(app: AppHandle, state: State<'a, Mutex<AppState>>) -> Result<(), String> {
    let mut app_state = state.lock().map_err(|e| {
        format!(
            "Error locking app state in clear_app_state: {}",
            e.to_string()
        )
    })?;

    // This automatically notes that the state is not modified
    *app_state = AppState::default();

    broadcast_complete_global_state_change(&app, app_state)?;

    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Save App State To File
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// If you want to save to a different file, update the file name in the global state first from a frontend set_app_state invocation.
#[tauri::command]
pub async fn save_app_state_to_file<'a>(app: AppHandle, state: State<'a, Mutex<AppState>>) -> Result<(), String> {
    let app_state = state.lock().map_err(|e| {
        format!(
            "Error locking app state in save_app_state_to_file: {}",
            e.to_string()
        )
    })?;

    app_state.save_to_file()?;

    // Note that the state has not been modified
    set_is_modified_since_last_save(&app, app_state, false)?;

    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Load App State From File
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Loads the app state and then emits to the front-end all the different events that happen.
#[tauri::command]
pub async fn load_app_state_from_file<'a>(
    app: AppHandle,
    state: State<'a, Mutex<AppState>>,
    file: SafePathBuf,
) -> Result<(), String> {
    let mut app_state: std::sync::MutexGuard<'_, AppState> = state.lock().map_err(|e| {
        format!(
            "Error locking app state in load_app_state_from_file: {}",
            e.to_string()
        )
    })?;

    *app_state = AppState::load_from_file(file.as_ref())?;

    // Overwrite the file path just in case the user loaded a .crm file that had an out-of-date save file path on it.
    app_state.save_file_path = Some(file.into());

    // Note that the state has not been modified
    app_state.set_field(AppStateField::IsModifiedSinceLastSave { value: IsModifiedSinceLastSave::from(false) });

    broadcast_complete_global_state_change(&app, app_state)?;

    Ok(())
}


// #############################################################################################################################################
// #############################################################################################################################################
// Utility Functions
// #############################################################################################################################################
// #############################################################################################################################################

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Emit App State Update
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Utility function for the set_app_state and load_app_state_from_file commands
fn emit_app_state_update<T: Serialize + Clone>(
    app: &AppHandle,
    field_name: String,
    event_payload: T,
) -> Result<(), String> {
    app.emit(&format!("state-change--{}", field_name), event_payload)
        .map_err(|err| format!("Function set_app_state in global_state.rs -- failed to emit state update event for {}: {}", field_name, err))?;
    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Nullable Naive Datetime Parser
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Use this for deserializing all datetimes. It handles empty strings, and it automatically truncates the Z at the end of the string that the JSON frontend sends.
/// We're not dealing with datetimes, so just get rid of the Z (which indicates UTC time).
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

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Broadcast Complete Global State Change
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Utility function to broadcast that the whole global state changed and the frontend needs to be refreshed. 
fn broadcast_complete_global_state_change(app: &AppHandle, app_state: MutexGuard<'_, AppState>) -> Result<(), String> {

    for default_app_state_field in AppStateField::iter() {
        // That iterator gives a default implementation of that enum, so grab the real value from state

        let true_app_state_field = app_state.get_field(default_app_state_field);
        let field_name = true_app_state_field.to_string();

        match true_app_state_field {
            AppStateField::SaveFilePath { value } => {
                emit_app_state_update(app, field_name, value)?
            }
            AppStateField::CsvFilePath { value } => {
                emit_app_state_update(app, field_name, value)?
            }
            AppStateField::LoadCsvSettings { value } => {
                emit_app_state_update(app, field_name, value)?
            }
            AppStateField::VideoFilePath { value } => {
                emit_app_state_update(app, field_name, value)?
            }
            AppStateField::VideoStartTime { value } => {
                emit_app_state_update(app, field_name, value)?
            }
            AppStateField::IsMultiwindow { value } => {
                emit_app_state_update(app, field_name, value)?
            }
            AppStateField::IsModifiedSinceLastSave { value } => {
                emit_app_state_update(app, field_name, value)?
            }
        };
    }

    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// To JSON
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Utility function for get_app_state
fn to_json<T: Serialize>(payload: T, field_name: String) -> Result<Value, String> {
    let value_json = serde_json::to_value(payload).map_err(|err| {
        format!(
            "Function get_app_state in global_state.rs -- failed to serialize {}: {}",
            field_name, err
        )
    })?;
    Ok(value_json)
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Set Is Modified Since Last Save
// ---------------------------------------------------------------------------------------------------------------------------------------------

/// Used to set and emit if the app state has been modified since the last save
fn set_is_modified_since_last_save(app: &AppHandle, mut app_state: MutexGuard<'_, AppState>, value: bool) -> Result<(), String> {
    app_state.set_field(AppStateField::IsModifiedSinceLastSave { value: IsModifiedSinceLastSave::from(true) });
    emit_app_state_update(&app, AppStateField::IsModifiedSinceLastSave{ value: IsModifiedSinceLastSave::from(value) }.to_string() , value)?; // The value within the AppStateField doesn't matter
    Ok(())
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Broadcast Complete Global State Change
// ---------------------------------------------------------------------------------------------------------------------------------------------
