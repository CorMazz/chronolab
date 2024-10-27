import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import useGlobalState from "../hooks/useGlobalState";
import { LoadCsvSettings } from "../types/appState";
import {z} from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { Box, Button, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, MenuItem, TextField, Typography } from "@mui/material";
import { parseUtcString, dateToUtcString } from "../utils/datetimeHandlers";
import { useFileOperations } from "../hooks/useFileOperations";


interface DataFrameColumn {
    name: string;
    field_type: string;
}

interface PlotSettingsFormSchema {
    columns: DataFrameColumn[];
    onSubmit: (data: LoadCsvSettings) => void;
    currentSettings: LoadCsvSettings | null;
}

// Form input types that match the native input types
type PlotSettingsFormInputs = {
    datetime_index_col: string;
    datetime_parsing_format_string: string;
    load_cols: string[];
    start_time: string | null;
    end_time: string | null;
};

// Validation schema that works with the native types
const plotSettingsFormInputs = z.object({
    datetime_index_col: z.string().min(1, "You must set an x-axis column."),
    datetime_parsing_format_string: z.string(),
    load_cols: z.array(z.string()).nonempty({ message: "You must choose at least one column for the y-axis." }),
    start_time: z.string().nullable(),
    end_time: z.string().nullable()
}).refine((data) => {
    if (data.start_time && data.end_time) {
        return parseUtcString(data.end_time)! > parseUtcString(data.start_time)!;
    }
    return true;
}, {
    message: "End time must be after start time",
    path: ['end_time'],
}).refine((data) => {
    return !data.load_cols.includes(data.datetime_index_col);
}, {
    message: "Datetime index column cannot be included in the load columns",
    path: ['load_cols'],
});

function PlotSettingsForm({ columns, onSubmit, currentSettings }: PlotSettingsFormSchema) {    
    const { control, handleSubmit, register, formState: { errors } } = useForm<PlotSettingsFormInputs>({
        resolver: zodResolver(plotSettingsFormInputs),
        defaultValues: {
            load_cols: currentSettings?.load_cols ?? [],
            datetime_index_col: currentSettings?.datetime_index_col ?? "",
            datetime_parsing_format_string: currentSettings?.datetime_parsing_format_string ?? "%Y-%m-%d %H:%M:%S",
            start_time: dateToUtcString(currentSettings?.time_bounds?.start_time ?? null),
            end_time: dateToUtcString(currentSettings?.time_bounds?.end_time ?? null),
        }
    });

    const onFormSubmit = (data: PlotSettingsFormInputs) => {
        const loadCsvSettings: LoadCsvSettings = {
            datetime_index_col: data.datetime_index_col,
            datetime_parsing_format_string: data.datetime_parsing_format_string,
            load_cols: data.load_cols,
            time_bounds: {
                start_time: parseUtcString(data.start_time),
                end_time: parseUtcString(data.end_time),
            }
        };
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
                                    value={column.name}
                                    defaultChecked={currentSettings?.load_cols.includes(column.name)}
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

            <Controller
                name="datetime_index_col"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        select
                        fullWidth
                        label="Datetime Index Column (x-axis)"
                        margin="normal"
                        error={!!errors.datetime_index_col}
                        helperText={errors.datetime_index_col?.message}
                    >
                        {columns.map((column) => (
                            <MenuItem key={`${column.name}-x-axis`} value={column.name}>
                                {column.name}
                            </MenuItem>
                        ))}
                    </TextField>
                )}
            />

            <Controller
                name="datetime_parsing_format_string"
                control={control}
                render={({ field }) => (
                    <TextField
                        {...field}
                        fullWidth
                        label="Datetime Parsing Format"
                        margin="normal"
                        error={!!errors.datetime_parsing_format_string}
                        helperText={errors.datetime_parsing_format_string?.message}
                    />
                )}
            />

            <Controller
                name="start_time"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                    <TextField
                        {...field}
                        fullWidth
                        label="Start Time (optional)"
                        type="datetime-local"
                        margin="normal"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        slotProps={{
                            htmlInput: { step: "1" },
                            inputLabel: { shrink: true },
                        }}
                    />
                )}
            />

            <Controller
                name="end_time"
                control={control}
                render={({ field: { value, onChange, ...field } }) => (
                    <TextField
                        {...field}
                        fullWidth
                        label="End Time (optional)"
                        type="datetime-local"
                        margin="normal"
                        value={value ?? ""}
                        onChange={(e) => onChange(e.target.value)}
                        slotProps={{
                            htmlInput: { step: "1" },
                            inputLabel: { shrink: true },
                        }}
                        error={!!errors.end_time}
                        helperText={errors.end_time?.message}
                    />
                )}
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
    const { selectCsvFile } = useFileOperations();
    const { loadCsvSettings, setLoadCsvSettings, csvFilePath, setCsvFilePath } = useGlobalState({ csvFile: true, loadCsvSettings: true, setOnly: false })
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
            <Box 
                sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mt: 4, 
                p: 2, 
            }}>
                {/* Conditional rendering based on column availability */}
                {!csvFilePath ? (                        
                        <Button 
                            variant="contained" 
                            color="primary" 
                            onClick={() => selectCsvFile(setCsvFilePath)}
                        >
                            Select CSV File
                        </Button>
                    ) : (
                            (columns === undefined || columns.length === 0) ? (
                                <Typography variant="body1" color="textSecondary" align="center">
                                    No columns available to select. Was this CSV file formatted correctly?
                                </Typography>
                        ) : (
                            <PlotSettingsForm 
                                columns={columns} 
                                onSubmit={handleFormSubmit} 
                                currentSettings={loadCsvSettings ?? null} 
                            />
                        )
                    )
                }
            </Box>
    );
}

export default PlotSettings;