import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { parseJSON } from "date-fns";

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
                const current_global_state = await invoke<string>("get_app_state", { field: "csvFilePath" });
                setLocalCsvFilePath(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalCsvFilePath = async (path: string) => {
        await invoke("set_app_state", { field: "csvFilePath", fieldValue: path });
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
                const current_global_state = await invoke<LoadCsvSettings>("get_app_state", { field: "loadCsvSettings" });
                console.log("Current Global useLoadCsvSettings:", current_global_state);
                setLocalLoadCsvSettings(current_global_state);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalLoadCsvSettings = async (settings: LoadCsvSettings) => {
        await invoke("set_app_state", { field: "loadCsvSettings", fieldValue: settings });
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
                const current_global_state = await invoke<string>("get_app_state", { field: "videoFilePath" });
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
        await invoke("set_app_state", { field: "videoFilePath", fieldValue: path });
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
function useIsMultiWindow(setOnly: boolean = false): { 
    isMultiwindow: boolean | undefined; 
    setGlobalIsMultiwindow: (isMultiwindow: boolean) => Promise<void>; 
} {
    const [isMultiwindow, setLocalIsMultiwindow] = useState<boolean | undefined>(undefined); // Initialize as null
    // console.log("useIsMultiwindow called:", isMultiwindow);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            try {
                const current_global_state = await invoke<boolean>("get_app_state", { field: "isMultiwindow" });
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
        await invoke("set_app_state", { field: "isMultiwindow", fieldValue: isMultiwindow });
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
                const current_global_state = await invoke<string | null>("get_app_state", { field: "videoStartTime" });
                console.log("Received videoStartTime", current_global_state);
                setLocalVideoStartTime(current_global_state ? parseJSON(current_global_state) : null);
            } catch (e) {
                console.error("Failed to fetch global state:", e);
                setLocalVideoStartTime(null); // Default value on error
            }
        };

        fetchGlobalState();
    }, []);

    // Update the global state
    const setGlobalVideoStartTime = async (videoStartTime: Date | null) => {
        await invoke("set_app_state", { field: "videoStartTime", fieldValue: videoStartTime });
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<Date | null>("state-change--video-start-time", (event) => {
            setLocalVideoStartTime(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, [setOnly]);

    return { videoStartTime, setGlobalVideoStartTime };
}


// Define the type for the return value of useGlobalState
type GlobalState = {
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
};

/**
 * A utility wrapper to hold all of the possible global state getters/setters
 */
function useGlobalState(options: { 
    csvFile?: boolean; 
    loadCsvSettings?: boolean;
    videoFile?: boolean; 
    isMultiwindow?: boolean; 
    videoStartTime?: boolean; 
    setOnly?: boolean 
} = {
    csvFile: false,
    loadCsvSettings: false,
    videoFile: false,
    isMultiwindow: false,
    videoStartTime: false,
    setOnly: false,
}): GlobalState {
    const csvState = options.csvFile ? useCsvFilePath(options.setOnly) : null;
    const csvSettingsState = options.loadCsvSettings ? useLoadCsvSettings(options.setOnly) : null;
    const videoState = options.videoFile ? useVideoFilePath(options.setOnly) : null;
    const multiwindowState = options.isMultiwindow ? useIsMultiWindow(options.setOnly) : null;
    const videoStartTimeState = options.videoStartTime ? useVideoStartTime(options.setOnly) : null;

    return {
        csvFilePath: csvState?.csvFilePath,
        setCsvFilePath: csvState?.setGlobalCsvFilePath,
        loadCsvSettings: csvSettingsState?.loadCsvSettings,
        setLoadCsvSettings: csvSettingsState?.setGlobalLoadCsvSettings,
        videoFilePath: videoState?.videoFilePath,
        setVideoFilePath: videoState?.setGlobalVideoFilePath,
        isMultiwindow: multiwindowState?.isMultiwindow,
        setIsMultiwindow: multiwindowState?.setGlobalIsMultiwindow,
        videoStartTime: videoStartTimeState?.videoStartTime,
        setVideoStartTime: videoStartTimeState?.setGlobalVideoStartTime,
    };
}

export default useGlobalState;
