use std::sync::Mutex;
use polars::prelude::*;
use polars::io::ipc::IpcWriter;
use tauri::{ipc::Response, State};
use crate::global_state::AppState;


#[tauri::command]
pub async fn scan_csv(state: State<'_, Mutex<AppState>>) -> Result<String, String> {

    let state = state
        .lock()
        .map_err(|e| format!("Error locking app state when loading data: {}", e.to_string()))?;

    let file_path= state.csv_file_path.clone().ok_or("CSV file path has not been set yet")?;

    let datetime_formatter = StrptimeOptions {
        format: Some("%Y-%m-%d %H:%M:%S%z".into()),
        ..Default::default()
    };

    let lf = LazyCsvReader::new(file_path)
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

    let file_path= state.csv_file_path.clone().ok_or("CSV file path has not been set yet")?;

    let datetime_formatter = StrptimeOptions {
        format: Some("%Y-%m-%d %H:%M:%S%z".into()),
        ..Default::default()
    };

    let lf = LazyCsvReader::new(file_path)
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

    let mut df = lf.fetch(1000)
        .map_err(|e| format!("Error collecting CSV data: {}", e.to_string()))?;

    // Create a cursor to store the serialized data
    let mut buffer = Vec::new();

    // https://docs.rs/polars/latest/polars/prelude/struct.IpcWriter.html  
    // TODO: Check if this should be an IPC stream writer instead
    IpcWriter::new(&mut buffer)
        .finish(&mut df)
        .map_err(|e| format!("Error serializing DataFrame: {}", e.to_string()))?;

    Ok(Response::new(buffer))
}
