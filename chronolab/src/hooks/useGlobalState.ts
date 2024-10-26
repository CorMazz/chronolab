import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { parseUtcString } from "../utils/datetimeHandlers";

// Enable global state for the path of the CSV file
function useSaveFilePath(setOnly: boolean = false): { 
    saveFilePath: string | undefined; 
    setGlobalSaveFilePath: (path: string) => Promise<void>; 
} {
    const [saveFilePath, setLocalSaveFilePath] = useState<string | undefined>(undefined);
    // console.log("useSaveFilePath called:", saveFilePath);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                // Invoke with a null value (if the backend accepts option for that state value) just so that the deserialization works
                const current_global_state = await invoke<string>("get_app_state_field", { appStateField: {  saveFilePath: {value: null } }});
                setLocalSaveFilePath(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalSaveFilePath = async (path: string) => {
        await invoke("set_app_state_field", { appStateField: {  saveFilePath: {value: path } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<string>("state-change--save-file-path", (event) => {
            setLocalSaveFilePath(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { saveFilePath, setGlobalSaveFilePath };
}

// Enable global state for the path of the CSV file
function useCsvFilePath(setOnly: boolean = false): { 
    csvFilePath: string | undefined; 
    setGlobalCsvFilePath: (path: string) => Promise<void>; 
} {
    const [csvFilePath, setLocalCsvFilePath] = useState<string | undefined>(undefined);
    // console.log("useCsvFilePath called:", csvFilePath);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                const current_global_state = await invoke<string>("get_app_state_field", { appStateField: {  csvFilePath: {value: null } }});
                setLocalCsvFilePath(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalCsvFilePath = async (path: string) => {
        await invoke("set_app_state_field", { appStateField: {  csvFilePath: {value: path } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<string>("state-change--csv-file-path", (event) => {
            setLocalCsvFilePath(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { csvFilePath, setGlobalCsvFilePath };
}

// Representing the LoadCsvSettings struct as a TypeScript type
export interface LoadCsvSettings {
    datetime_index_col: string;
    datetime_parsing_format_string: string;
    load_cols: string[];
    time_bounds?: TimeBounds | null;
}
  
// Representing the TimeBounds struct as a TypeScript type
export interface TimeBounds {
    start_time?: Date | null;
    end_time?: Date | null;
}

// Helper function to convert time bounds with string dates to Date objects
// Otherwise the datetimes don't get parsed when listening for the LoadCsvSettinsg object
function parseTimeBounds(settings: LoadCsvSettings | undefined): LoadCsvSettings | undefined {
    
    if (!settings) return undefined;
    if (!settings.time_bounds) return settings;
    const parsed_settings = {
        ...settings,
        time_bounds: {
            start_time: settings.time_bounds.start_time 
                ? (typeof settings.time_bounds.start_time === 'string'
                    ? parseUtcString(settings.time_bounds.start_time + "Z")
                    : settings.time_bounds.start_time)
                : null,
            end_time: settings.time_bounds.end_time 
                ? (typeof settings.time_bounds.end_time === 'string'
                    ? parseUtcString(settings.time_bounds.end_time + "Z")
                    : settings.time_bounds.end_time)
                : null
        }
    };
    return parsed_settings
}

// Enable global state for LoadCsvSettings
function useLoadCsvSettings(setOnly: boolean = false): { 
    loadCsvSettings: LoadCsvSettings | undefined; 
    setGlobalLoadCsvSettings: (settings: LoadCsvSettings) => Promise<void>; 
} {
    const [loadCsvSettings, setLocalLoadCsvSettings] = useState<LoadCsvSettings | undefined>(undefined);
    // console.log("useLoadCsvSettings called:", loadCsvSettings);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                const current_global_state = await invoke<LoadCsvSettings>("get_app_state_field", { appStateField: {  loadCsvSettings: {value: null } }});
                setLocalLoadCsvSettings(parseTimeBounds(current_global_state));
            } catch (e) {
                console.error("Failed to fetch global state:", e);
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalLoadCsvSettings = async (settings: LoadCsvSettings) => {
        await invoke("set_app_state_field", { appStateField: {  loadCsvSettings: {value: settings } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<LoadCsvSettings>("state-change--load-csv-settings", (event) => {
            // console.log("Load csv settings received", event.payload);
            setLocalLoadCsvSettings(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { loadCsvSettings, setGlobalLoadCsvSettings };
}

// Enable global state for the path of the video file
function useVideoFilePath(setOnly: boolean = false): { 
    videoFilePath: string | undefined; 
    setGlobalVideoFilePath: (path: string) => Promise<void>; 
} {
    const [videoFilePath, setLocalVideoFilePath] = useState<string | undefined>(undefined);
    // console.log("useVideoFilePath called:", videoFilePath);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                const current_global_state = await invoke<string>("get_app_state_field", { appStateField: { videoFilePath: {value: null } }});
                setLocalVideoFilePath(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalVideoFilePath = async (path: string) => {
        // console.log("Original Video File Path Saved to State:", path);
        await invoke("set_app_state_field", { appStateField: {  videoFilePath: {value: path } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<string>("state-change--video-file-path", (event) => {
            // console.log("Video File Path Contained with State Change Event:", event.payload);
            setLocalVideoFilePath(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { videoFilePath, setGlobalVideoFilePath };
}

// Enable global state for if the application is multiwindow
function useIsMultiwindow(setOnly: boolean = false): { 
    isMultiwindow: boolean | undefined; 
    setGlobalIsMultiwindow: (isMultiwindow: boolean) => Promise<void>; 
} {
    const [isMultiwindow, setLocalIsMultiwindow] = useState<boolean | undefined>(undefined); // Initialize as null
    // console.log("useIsMultiwindow called:", isMultiwindow);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                // Here the AppState object in the backend does not accept an option type. Set the placeholder value to false.
                const current_global_state = await invoke<boolean>("get_app_state_field", { appStateField: {  isMultiwindow: {value: false } }});
                setLocalIsMultiwindow(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
                setLocalIsMultiwindow(false); // Default value on error
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalIsMultiwindow = async (isMultiwindow: boolean) => {
        await invoke("set_app_state_field",  { appStateField: {  isMultiwindow: {value: isMultiwindow } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<boolean>("state-change--is-multiwindow", (event) => {
            setLocalIsMultiwindow(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { isMultiwindow, setGlobalIsMultiwindow };
}

// Enable global state for videoStartTime
function useVideoStartTime(setOnly: boolean = false): { 
    videoStartTime: Date | null; 
    setGlobalVideoStartTime: (videoStartTime: Date | null) => Promise<void>; 
} {
    const [videoStartTime, setLocalVideoStartTime] = useState<Date | null>(null); 
    // console.log("useVideoStartTime called:", videoStartTime);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                const current_global_state = await invoke<string | null>("get_app_state_field",  { appStateField: {  videoStartTime: {value: null } }});
                setLocalVideoStartTime(current_global_state ? parseUtcString(current_global_state) : null);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
                setLocalVideoStartTime(null); // Default value on error
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalVideoStartTime = async (videoStartTime: Date | null) => {
        await invoke("set_app_state_field", { appStateField: {  videoStartTime: { value: videoStartTime } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<string | null>("state-change--video-start-time", (event) => {
            setLocalVideoStartTime(event.payload ? parseUtcString(event.payload) : null); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { videoStartTime, setGlobalVideoStartTime };
}

// Enable global state for if the application is multiwindow
function useIsModifiedSinceLastSave(setOnly: boolean = false): { 
    isModifiedSinceLastSave: boolean | undefined; 
    setGlobalIsModifiedSinceLastSave: (isModifiedSinceLastSave: boolean) => Promise<void>; 
} {
    const [isModifiedSinceLastSave, setLocalIsModifiedSinceLastSave] = useState<boolean | undefined>(undefined); // Initialize as null

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                // Here the AppState object in the backend does not accept an option type. Set the placeholder value to false.
                const current_global_state = await invoke<boolean>("get_app_state_field", { appStateField: {  isModifiedSinceLastSave: {value: false } }});
                setLocalIsModifiedSinceLastSave(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
                setLocalIsModifiedSinceLastSave(false); // Default value on error
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalIsModifiedSinceLastSave = async (isModifiedSinceLastSave: boolean) => {
        await invoke("set_app_state_field",  { appStateField: {  isModifiedSinceLastSave: {value: isModifiedSinceLastSave } }});
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<boolean>("state-change--is-modified-since-last-save", (event) => {
            setLocalIsModifiedSinceLastSave(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { isModifiedSinceLastSave, setGlobalIsModifiedSinceLastSave };
}



// Define the type for the return value of useGlobalState
type GlobalState = {
    saveFilePath: string | undefined;
    setSaveFilePath: ((path: string) => Promise<void>) | undefined;
    csvFilePath: string | undefined;
    setCsvFilePath: ((path: string) => Promise<void>) | undefined;
    loadCsvSettings: LoadCsvSettings | undefined;
    setLoadCsvSettings: ((settings: LoadCsvSettings) => Promise<void>) | undefined; 
    videoFilePath: string | undefined;
    setVideoFilePath: ((path: string) => Promise<void>) | undefined;
    isMultiwindow: (boolean | null) | undefined;
    setIsMultiwindow: ((isMultiwindow: boolean) => Promise<void>) | undefined;
    videoStartTime: (Date | null) | undefined;
    setVideoStartTime: ((startTime: Date | null) => Promise<void>) | undefined;
    isModifiedSinceLastSave: (boolean | null) | undefined;
    setIsModifiedSinceLastSave: ((isModifiedSinceLastSave: boolean) => Promise<void>) | undefined;
};

/**
 * A utility wrapper to hold all of the possible global state getters/setters
 */
function useGlobalState(options: { 
    saveFile?: boolean;
    csvFile?: boolean; 
    loadCsvSettings?: boolean;
    videoFile?: boolean; 
    isMultiwindow?: boolean; 
    videoStartTime?: boolean; 
    isModified?: boolean;
    setOnly?: boolean 
} = {
    saveFile: false,
    csvFile: false,
    loadCsvSettings: false,
    videoFile: false,
    isMultiwindow: false,
    videoStartTime: false,
    isModified: false,
    setOnly: false,
}): GlobalState {
    const saveFileState = options.saveFile ? useSaveFilePath(options.setOnly) : null;
    const csvState = options.csvFile ? useCsvFilePath(options.setOnly) : null;
    const csvSettingsState = options.loadCsvSettings ? useLoadCsvSettings(options.setOnly) : null;
    const videoState = options.videoFile ? useVideoFilePath(options.setOnly) : null;
    const multiwindowState = options.isMultiwindow ? useIsMultiwindow(options.setOnly) : null;
    const isModifiedState = options.isModified ? useIsModifiedSinceLastSave(options.setOnly) : null;
    const videoStartTimeState = options.videoStartTime ? useVideoStartTime(options.setOnly) : null;

    return {
        saveFilePath: saveFileState?.saveFilePath,
        setSaveFilePath: saveFileState?.setGlobalSaveFilePath,
        csvFilePath: csvState?.csvFilePath,
        setCsvFilePath: csvState?.setGlobalCsvFilePath,
        loadCsvSettings: csvSettingsState?.loadCsvSettings,
        setLoadCsvSettings: csvSettingsState?.setGlobalLoadCsvSettings,
        videoFilePath: videoState?.videoFilePath,
        setVideoFilePath: videoState?.setGlobalVideoFilePath,
        isMultiwindow: multiwindowState?.isMultiwindow,
        setIsMultiwindow: multiwindowState?.setGlobalIsMultiwindow,
        isModifiedSinceLastSave: isModifiedState?.isModifiedSinceLastSave,
        setIsModifiedSinceLastSave: isModifiedState?.setGlobalIsModifiedSinceLastSave,
        videoStartTime: videoStartTimeState?.videoStartTime,
        setVideoStartTime: videoStartTimeState?.setGlobalVideoStartTime,
    };
}

export default useGlobalState;

// Helper function to wait for a global state update
export function waitForGlobalStateUpdate(eventName: string): Promise<any> {
    return new Promise((resolve) => {
        const unlistenPromise = listen(eventName, (event) => {
            resolve(event.payload);
            // Unlisten after the event is received
            unlistenPromise.then(unlisten => unlisten());
        });
    });
}