import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import useGlobalState, { LoadCsvSettings } from "../hooks/useGlobalState";
import {z} from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { parseJSON, isAfter } from "date-fns";

// These two are used to create an object from the JSON DataFrame schema sent by the backend
interface DataFrameColumn {
    name: string;
    field_type: string;
}

interface DataFrameSchema {
    columns: DataFrameColumn[];
    onSubmit: (data: LoadCsvSettings) => void;
}

// This is used to validate the form inputs
const plotSettingsFormInputs = z.object({
    datetime_index_col: z.string(),
    datetime_parsing_format_string: z.string(),
    load_cols: z.array(z.string()).nonempty({message: "You must choose at least one column for the y-axis."}),
    // For start_time and end_time, convert empty strings to null since the html datetime input gives an empty string for no input
    start_time: z.preprocess(
        // Doing this bullshit with the length because the html datetime-local element truncates seconds if they're 0 and we need those to parse properly.
        (val) => val === "" ? null : (parseJSON((val as string).length === 16 ? (val as string) + ":00" : (val as string))),
        z.date().nullable()
    ),
    
    end_time: z.preprocess(
        // Doing this bullshit with the length because the html datetime-local element truncates seconds if they're 0 and we need those to parse properly.
        (val) => val === "" ? null : (parseJSON((val as string).length === 16 ? (val as string) + ":00" : (val as string))),
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

function PlotSettingsForm({ columns, onSubmit }: DataFrameSchema) {
    const { handleSubmit, register, formState: { errors } } = useForm<PlotSettingsFormInputs>({resolver: zodResolver(plotSettingsFormInputs)});

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
            <h3>Select Columns to Load</h3>

            {columns.map((column) => (
                <div key={`${column.name}-y-axis`}>
                    <input
                        type="checkbox"
                        id={column.name}
                        value={column.name}
                        {...register("load_cols")}              
                    />
                    <label htmlFor={column.name}>{`${column.name} (${column.field_type})`}</label>
                </div>
            ))}
            {errors.load_cols && <p>{errors.load_cols.message}</p>}


            {/* Datetime Index Column */}
            <div>
                <label htmlFor="datetime_index_col">Datetime Index Column (x-axis)</label>
                <select id="datetime_index_col" {...register("datetime_index_col", { required: "You must set an x-axis column."})}>
                    {columns.map((column) => (
                        <option key={`${column.name}-x-axis`} value={column.name}>{column.name}</option>
                    ))}
                </select>
                {errors.datetime_index_col && <p>{errors.datetime_index_col.message}</p>}
            </div>

            {/* Datetime Parsing Format */}
            <div>
                <label htmlFor="datetime_parsing_format_string">Datetime Parsing Format</label>
                <input
                    id="datetime_parsing_format_string"
                    defaultValue="%Y-%m-%d %H:%M:%S"
                    {...register("datetime_parsing_format_string", { required: "You must set a datetime parsing string." })}
                />
                {errors.datetime_parsing_format_string && <p>{errors.datetime_parsing_format_string.message}</p>}
            </div>

            {/* Start Time */}
            <div>
                <label htmlFor="start_time">Start Time (optional)</label>
                <input
                    id="start_time"
                    type="datetime-local"
                    step="1"
                    {...register("start_time")}
                />
            </div>

            {/* End Time */}
            <div>
                <label htmlFor="end_time">End Time (optional)</label>
                <input
                    id="end_time"
                    type="datetime-local"
                    step="1"
                    {...register("end_time")}
                />
                {errors.end_time && <p>{errors.end_time.message}</p>}
            </div>

            <button type="submit">Submit</button>
        </form>
    );
}

// ##############################################################################################################
// Parent Component
// ##############################################################################################################

function PlotSettings() {
    const { setLoadCsvSettings } = useGlobalState({ loadCsvSettings: true, setOnly: true })
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
        <div>
            {columns === undefined ? null : columns.length === 0 ? (
                <p>No columns available to select. Was this CSV file formatted correctly?</p>
            ) : (
                <PlotSettingsForm columns={columns} onSubmit={handleFormSubmit} />
            )}
            </div>
    );
}

export default PlotSettings;