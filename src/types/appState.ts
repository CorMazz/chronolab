
export type AppStateField = 
    | { saveFilePath: { value: string | null } }
    | { csvFilePath: { value: string | null } }
    | { loadCsvSettings: { value: LoadCsvSettings | null } }
    | { videoFilePath: { value: string | null } }
    | { isMultiwindow: { value: boolean } }
    | { videoStartTime: { value: Date | null } }
    | { isModifiedSinceLastSave: { value: boolean } };

export type LoadCsvSettings = {
    datetime_index_col: string;
    datetime_parsing_format_string: string;
    load_cols: string[];
    time_bounds?: TimeBounds | null;
}
  
export type TimeBounds = {
    start_time?: Date | null;
    end_time?: Date | null;
}