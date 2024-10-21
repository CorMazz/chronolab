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
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 p-4 bg-white shadow-lg rounded-lg max-w-lg mx-auto">
            <h3 className="text-2xl font-semibold text-gray-800">Select Columns to Load</h3>

            {/* Y-Axis Columns (load_cols) */}
            <div className="space-y-2">
                {columns.map((column) => (
                    <div key={`${column.name}-y-axis`} className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id={column.name}
                            value={column.name}
                            defaultChecked={currentSettings ? (column.name in currentSettings.load_cols) : false}
                            {...register("load_cols")}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor={column.name} className="text-gray-700">{`${column.name} (${column.field_type})`}</label>
                    </div>
                ))}
                {errors.load_cols && <p className="text-red-600">{errors.load_cols.message}</p>}
            </div>

            {/* Datetime Index Column */}
            <div className="space-y-1">
                <label htmlFor="datetime_index_col" className="block text-gray-700 font-medium">Datetime Index Column (x-axis)</label>
                <select 
                    id="datetime_index_col" 
                    {...register("datetime_index_col", { required: "You must set an x-axis column."})}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                    {columns.map((column) => (
                        <option key={`${column.name}-x-axis`} value={column.name}>{column.name}</option>
                    ))}
                </select>
                {errors.datetime_index_col && <p className="text-red-600">{errors.datetime_index_col.message}</p>}
            </div>

            {/* Datetime Parsing Format */}
            <div className="space-y-1">
                <label htmlFor="datetime_parsing_format_string" className="block text-gray-700 font-medium">Datetime Parsing Format</label>
                <input
                    id="datetime_parsing_format_string"
                    {...register("datetime_parsing_format_string", { required: "You must set a datetime parsing string." })}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.datetime_parsing_format_string && <p className="text-red-600">{errors.datetime_parsing_format_string.message}</p>}
            </div>

            {/* Start Time */}
            <div className="space-y-1">
                <label htmlFor="start_time" className="block text-gray-700 font-medium">Start Time (optional)</label>
                <input
                    id="start_time"
                    type="datetime-local"
                    step="1"
                    {...register("start_time")}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            {/* End Time */}
            <div className="space-y-1">
                <label htmlFor="end_time" className="block text-gray-700 font-medium">End Time (optional)</label>
                <input
                    id="end_time"
                    type="datetime-local"
                    step="1"
                    {...register("end_time")}
                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
                {errors.end_time && <p className="text-red-600">{errors.end_time.message}</p>}
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-blue-700 focus:ring focus:ring-blue-200">
                Submit
            </button>
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
        <div className="p-4">
            {columns === undefined ? null : columns.length === 0 ? (
                <p className="text-red-600">No columns available to select. Was this CSV file formatted correctly?</p>
            ) : (
                <PlotSettingsForm columns={columns} onSubmit={handleFormSubmit} currentSettings={loadCsvSettings ?? null} />
            )}
        </div>
    );
}

export default PlotSettings;