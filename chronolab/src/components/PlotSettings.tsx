import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useGlobalState, { LoadCsvSettings } from "../hooks/useGlobalState";
import {z} from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { parseJSON, isAfter } from "date-fns";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, MenuItem, TextField, Typography } from "@mui/material";

// These two are used to create an object from the JSON DataFrame schema sent by the backend
interface DataFrameColumn {
    name: string;
    field_type: string;
}

interface PlotSettingsFormSchema {
    columns: DataFrameColumn[];
    onSubmit: (data: LoadCsvSettings) => void;
    currentSettings: LoadCsvSettings | null;
}

// This is used to validate the form inputs
const plotSettingsFormInputs = z.object({
    datetime_index_col: z.string(),
    datetime_parsing_format_string: z.string(),
    load_cols: z.array(z.string()).nonempty({message: "You must choose at least one column for the y-axis."}),
    // For start_time and end_time, convert empty strings to null since the html datetime input gives an empty string for no input
    start_time: z.preprocess(
        // Doing this bullshit with the length because the html datetime-local element truncates seconds if they're 0 and we need those to parse properly.
        (val) => (val == null || val === "" ) ? null : (parseJSON((val as string).length === 16 ? (val as string) + ":00" : (val as string))),
        z.date().nullable()
    ),
    
    end_time: z.preprocess(
        // Doing this bullshit with the length because the html datetime-local element truncates seconds if they're 0 and we need those to parse properly.
        (val) => (val == null || val === "" )  ? null : (parseJSON((val as string).length === 16 ? (val as string) + ":00" : (val as string))),
        z.date().nullable()
    ),
}).refine((data) => {
    // Ensure that end_time is after start_time, if both are provided
    if (data.start_time && data.end_time) {
      return isAfter(data.end_time, data.start_time)
    }
    return true;  // Validation passes if either start_time or end_time is missing
  }, {
    message: "End time must be after start time",        
    path: ['end_time'],              
  }).refine((data) => {
    // Ensure datetime_index_col is not included in load_cols
    return !data.load_cols.includes(data.datetime_index_col);
  }, {
    message: "Datetime index column cannot be included in the load columns",
    path: ['load_cols'],
  });

type PlotSettingsFormInputs = z.infer<typeof plotSettingsFormInputs>;

// ##############################################################################################################
// Child Component
// ##############################################################################################################

function PlotSettingsForm({ columns, onSubmit, currentSettings }: PlotSettingsFormSchema) {
    const { handleSubmit, register, formState: { errors } } = useForm<PlotSettingsFormInputs>({
        resolver: zodResolver(plotSettingsFormInputs),
        defaultValues: {
            load_cols: currentSettings?.load_cols,
            datetime_index_col: currentSettings?.datetime_index_col,
            datetime_parsing_format_string: (currentSettings?.datetime_parsing_format_string) ?? "%Y-%m-%d %H:%M:%S",
            start_time: currentSettings?.time_bounds?.start_time ?? null,
            end_time: currentSettings?.time_bounds?.end_time ?? null,
        }
    });

    const onFormSubmit = (data: PlotSettingsFormInputs) => {

        // Create the LoadCsvSettings object
        const loadCsvSettings: LoadCsvSettings = {
            datetime_index_col: data.datetime_index_col,
            datetime_parsing_format_string: data.datetime_parsing_format_string,
            load_cols: data.load_cols,
            time_bounds: {
                start_time: data.start_time,
                end_time: data.end_time,
            }
        };

        // Call the provided onSubmit function with the settings object
        onSubmit(loadCsvSettings);
    };

    return (
        <form onSubmit={handleSubmit(onFormSubmit)}>
            <Typography variant="h6" gutterBottom>
                Select Columns to Load
            </Typography>

            <FormControl component="fieldset" error={!!errors.load_cols} sx={{ mb: 2 }}>
                <FormGroup>
                    {columns.map((column) => (
                        <FormControlLabel
                            key={`${column.name}-y-axis`}
                            control={
                                <Checkbox
                                    id={column.name}
                                    value={column.name}
                                    defaultChecked={currentSettings ? (column.name in currentSettings.load_cols) : false}
                                    {...register("load_cols")}
                                />
                            }
                            label={`${column.name} (${column.field_type})`}
                        />
                    ))}
                </FormGroup>
                {errors.load_cols && (
                    <FormHelperText>{errors.load_cols.message}</FormHelperText>
                )}
            </FormControl>

            {/* Datetime Index Column */}
            <TextField
                select
                fullWidth
                label="Datetime Index Column (x-axis)"
                id="datetime_index_col"
                margin="normal"
                error={!!errors.datetime_index_col}
                helperText={errors.datetime_index_col ? errors.datetime_index_col.message : ""}
                {...register("datetime_index_col", { required: "You must set an x-axis column." })}
                >
                {columns.map((column) => (
                    <MenuItem key={`${column.name}-x-axis`} value={column.name}>
                        {column.name}
                    </MenuItem>
                ))}
            </TextField>

            {/* Datetime Parsing Format */}
            <TextField
                fullWidth
                label="Datetime Parsing Format"
                id="datetime_parsing_format_string"
                margin="normal"
                error={!!errors.datetime_parsing_format_string}
                helperText={errors.datetime_parsing_format_string ? errors.datetime_parsing_format_string.message : ""}
                {...register("datetime_parsing_format_string", { required: "You must set a datetime parsing string." })}
            />

            {/* Start Time */}
            <TextField
                fullWidth
                label="Start Time (optional)"
                id="start_time"
                type="datetime-local"
                margin="normal"
                // https://mui.com/material-ui/migration/migrating-from-deprecated-apis/#props-props
                slotProps={{
                    htmlInput: {step: "1"},
                    inputLabel: {shrink: true},
                }}
                {...register("start_time")}
            />

            {/* End Time */}
            <TextField
                fullWidth
                label="End Time (optional)"
                id="end_time"
                type="datetime-local"
                margin="normal"

                slotProps={{
                    htmlInput: {step: "1"},
                    inputLabel: {shrink: true},
                }}
                error={!!errors.end_time}
                helperText={errors.end_time ? errors.end_time.message : ""}
                {...register("end_time")}
            />

            <Box textAlign="center" mt={3}>
                <Button variant="contained" color="primary" type="submit">
                    Submit
                </Button>
            </Box>
        </form>
    );
}

// ##############################################################################################################
// Parent Component
// ##############################################################################################################

function PlotSettings() {
    const { loadCsvSettings, setLoadCsvSettings } = useGlobalState({ loadCsvSettings: true, setOnly: false })
    const { csvFilePath } = useGlobalState({ csvFile: true })
    const [columns, setColumns] = useState<DataFrameColumn[] | undefined>(undefined);

    const handleFormSubmit = (settings: LoadCsvSettings) => {
        if (setLoadCsvSettings) {
            setLoadCsvSettings(settings).catch((e) => console.error("Unable to update loadCSVSettings in the global state:", e));
        } else {
            console.error("Unable to update loadCSVSettings in the global state due to an error in the useGlobalState hook.")
        }
    };

    // Load the columns into local state to render the form
    useEffect(() => {
        // Fetch the schema when the component mounts
        const fetchSchema = async () => {
            try {
                const csvSchema: DataFrameColumn[] = await invoke('get_csv_schema');
                if (csvSchema.length > 0) {
                    setColumns(csvSchema); // Set columns in state
                }
            } catch (error) {
                console.error("Error fetching CSV schema:", error);
            }
        };

        if (csvFilePath) {
            fetchSchema();
        } 
    }, [csvFilePath]);

    return (
        <Box sx={{ p: 3 }}>
            {/* Conditional rendering based on column availability */}
            {columns === undefined ? null : columns.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center">
                    No columns available to select. Was this CSV file formatted correctly?
                </Typography>
            ) : (
                <PlotSettingsForm 
                    columns={columns} 
                    onSubmit={handleFormSubmit} 
                    currentSettings={loadCsvSettings ?? null} 
                />
            )}
        </Box>
    );
}

export default PlotSettings;