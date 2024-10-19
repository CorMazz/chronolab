use std::sync::Mutex;
use polars::prelude::*;
use polars::io::ipc::IpcWriter;
use serde::Serialize;
use tauri::{ipc::Response, State};
use crate::global_state::{AppState, LoadCsvSettings};


/// A custom struct to put a schema into, because we need it to be serializeable to send it to our JS frontend. 
#[derive(Serialize)]
pub struct SchemaField {
    name: String,
    field_type: String,
}

#[tauri::command]
/// Scan the CSV to get some information about it
pub async fn get_csv_schema(state: State<'_, Mutex<AppState>>) -> Result<Vec<SchemaField>, String> {

    let state = state
        .lock()
        .map_err(|e| format!("Error locking app state when loading data: {}", e.to_string()))?;

    let file_path= state.csv_file_path.clone().ok_or("CSV file path has not been set yet.")?;

    let mut lf = LazyCsvReader::new(file_path)
        .with_infer_schema_length(Some(10000))
        .finish()
        .map_err(|e| format!("Error opening file: {}", e.to_string()))?;

    let schema = lf
        .collect_schema()
        .map_err(|e| format!("Error getting CSV schema: {}", e.to_string()))?;

        let schema_vec: Vec<SchemaField> = schema.iter_fields().map(|field| {
            SchemaField {
                name: field.name().to_string(),
                field_type: field.dtype().to_string(),
            }
        }).collect();
    
    Ok(schema_vec)
}

/// Loads the DataFrame per the load_csv_settings in the AppStateSerializes the Polars DataFrame to Apache Arrow format and then sends that binary response in a Tauri array buffer via IPC
/// In theory that is faster than using JSON.
#[tauri::command]
pub async fn get_csv_data(state: State<'_, Mutex<AppState>>) -> Result<Response, String> {
    let state =state
        .lock()
        .map_err(|e| format!("Error getting app state when requesting data: {}", e.to_string()))?;

    let file_path= state.csv_file_path.clone().ok_or("CSV file path has not been set yet")?;
    let load_csv_settings: LoadCsvSettings = state.load_csv_settings.clone().ok_or("CSV loading settings have not been set yet.")?;

    let datetime_formatter = StrptimeOptions {
        format: Some(load_csv_settings.datetime_parsing_format_string.into()),
        ..Default::default()
    };

    let mut lf = LazyCsvReader::new(file_path)
        .with_infer_schema_length(Some(10000))
        .finish()
        .map_err(|e| format!("Error opening file: {}", e.to_string()))?

        // Parse the datetime_index_col into a datetime. 
        .with_columns([col(&load_csv_settings.datetime_index_col)
            .str()
            .to_datetime(
                Some(TimeUnit::Milliseconds),
                None,
                datetime_formatter,
                lit("raise")
            )
            .alias(&load_csv_settings.datetime_index_col)]

        // Select the datetime index col (first) and then the rest of the desired columns
        ).select([&[load_csv_settings.datetime_index_col.clone()], &load_csv_settings.load_cols[..]]
            .concat()
            .into_iter()
            .map(|val| col(val))
            .collect::<Vec<_>>());

    // Cast all columns (except the datetime index col) to Float64
    lf = lf.with_columns(
        load_csv_settings.load_cols
            .iter()
            .map(|col_name| col(col_name).cast(DataType::Float64)) // Cast each column to Float64
            .collect::<Vec<_>>(),
    );

    // Filter the time to fit within the bounds, if supplied
    if let Some(time_bounds) = load_csv_settings.time_bounds {
        if let Some(start_time) = time_bounds.start_time {
            lf = lf.filter(
                col(&load_csv_settings.datetime_index_col)
                    .gt_eq(lit(start_time))
            );
        }
    
        if let Some(end_time) = time_bounds.end_time {
            lf = lf.filter(
                col(&load_csv_settings.datetime_index_col)
                    .lt_eq(lit(end_time))
            );
        }
    }

    let mut df = lf.collect()
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

