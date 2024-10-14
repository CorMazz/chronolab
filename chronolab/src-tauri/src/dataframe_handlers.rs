use std::sync::Mutex;
use polars::prelude::*;
use polars::io::ipc::IpcWriter;
use tauri::{ipc::Response, State};

use crate::AppState;

#[tauri::command]
pub async fn scan_csv(path: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {

    let datetime_formatter = StrptimeOptions {
        format: Some("%Y-%m-%d %H:%M:%S%z".into()),
        ..Default::default()
    };

    let lf = LazyCsvReader::new(path)
        .finish()
        .map_err(|e| format!("Error opening file: {}", e.to_string()))?
        .with_columns([col("timestamp")
            .str()
            .to_datetime(
                Some(TimeUnit::Milliseconds),
                None,
                datetime_formatter,
                lit("raise")
            )
            .alias("timestamp")]); 

    let mut state =state
        .lock()
        .map_err(|e| format!("Error modifying app state when loading data: {}", e.to_string()))?;
    state.lazyframe = Some(lf.clone());

    let df = lf
        .fetch(5)
        .map_err(|e| format!("Error collecting CSV data: {}", e.to_string()))?;

    // let df = CsvReadOptions::default()
    //     .map_parse_options(|parse_options| parse_options.with_try_parse_dates(true))
    //     .try_into_reader_with_file_path(Some(path.into()))
    //     .map_err(|e| format!("Error opening file: {}", e.to_string()))?
    //     .finish()
    //     .map_err(|e| format!("Error reading CSV data: {}", e.to_string()))?;

    Ok(format!(
        "DataFrame Summary:\nColumns: {:?}\nData Types: {:?}\nHead:\n{}",
        df.get_column_names(),
        df.dtypes(),
        df.head(Some(5)) // First 5 rows
    ))
    
}


/// Serializes the Polars DataFrame to Apache Arrow format and then sends that binary response in a Tauri array buffer via IPC
/// In theory that is faster than using JSON.
#[tauri::command]
pub async fn get_csv_data(state: State<'_, Mutex<AppState>>) -> Result<Response, String> {
    let state =state
        .lock()
        .map_err(|e| format!("Error getting app state when requesting data: {}", e.to_string()))?;

    let mut df = match state.lazyframe.clone() {
        Some(lf) => lf.fetch(1000),
        None => return Err("No CSV file has been loaded yet.".into()),
    }.map_err(|e| format!("Error collecting CSV data: {}", e.to_string()))?;

    // Create a cursor to store the serialized data
    let mut buffer = Vec::new();

    // https://docs.rs/polars/latest/polars/prelude/struct.IpcWriter.html  
    // TODO: Check if this should be an IPC stream writer instead
    IpcWriter::new(&mut buffer)
        .finish(&mut df)
        .map_err(|e| format!("Error serializing DataFrame: {}", e.to_string()))?;

    Ok(Response::new(buffer))
}
