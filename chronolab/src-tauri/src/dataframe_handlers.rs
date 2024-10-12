use polars::prelude::*;

#[tauri::command]
pub async fn scan_csv(path: String) -> Result<String, String> {

    let datetime_formatter = StrptimeOptions {
        format: Some("%Y-%m-%d %H:%M:%S%z".into()),
        strict: false,
        exact: true,
        cache: true,
    };

    let lf = LazyCsvReader::new(path)
        .finish()
        .map_err(|e| format!("Error opening file: {}", e.to_string()))?
        .with_columns([col("timestamp")
            .str()
            .to_date(datetime_formatter)
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