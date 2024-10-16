import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

// Enable global state for the path of the CSV file
function useCsvFilePath(setOnly: boolean = false): { csvFilePath: string | undefined; setGlobalCsvFilePath: (path: string) => Promise<void>; } {
    const [csvFilePath, setLocalCsvFilePath] = useState<string | undefined>(undefined);

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

// Enable global state for the path of the video file
function useVideoFilePath(setOnly: boolean = false): { videoFilePath: string | undefined; setGlobalVideoFilePath: (path: string) => Promise<void>; } {
    const [videoFilePath, setLocalVideoFilePath] = useState<string | undefined>(undefined);

    // Update the global state
    const setGlobalVideoFilePath = async (path: string) => {
        console.log("Original Video File Path Saved to State:", path);
        await invoke("set_app_state", { field: "videoFilePath", fieldValue: path });
    };

    // Listen for global state changes if not in setOnly mode
    useEffect(() => {
        if (setOnly) return; // Skip listener setup if only setting state

        const unlisten = listen<string>("state-change--video-file-path", (event) => {
            console.log("Video File Path Contained with State Change Event:", event.payload);
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
function useIsMultiWindow(setOnly: boolean = false): { isMultiwindow: boolean; setGlobalIsMultiwindow: (isMultiwindow: boolean) => Promise<void>; } {
    const [isMultiwindow, setLocalIsMultiwindow] = useState<boolean>(false);

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

// Define the type for the return value of useGlobalState
type GlobalState = {
    csvFilePath: string | undefined;
    setCsvFilePath: ((path: string) => Promise<void>) | undefined;
    videoFilePath: string | undefined;
    setVideoFilePath: ((path: string) => Promise<void>) | undefined;
    isMultiwindow: boolean | undefined;
    setIsMultiwindow: ((isMultiwindow: boolean) => Promise<void>) | undefined;
};

/**
 * A utility wrapper to hold all of the possible global state getters/setters
 * 
 */
function useGlobalState(options: { csvFile?: boolean; videoFile?: boolean; isMultiwindow?: boolean; setOnly?: boolean } = {
    csvFile: false,
    videoFile: false,
    isMultiwindow: false,
    setOnly: false,
}): GlobalState {
    const csvState = options.csvFile ? useCsvFilePath(options.setOnly) : null;
    const videoState = options.videoFile ? useVideoFilePath(options.setOnly) : null;
    const multiwindowState = options.isMultiwindow ? useIsMultiWindow(options.setOnly) : null;
  
    return {
        csvFilePath: csvState?.csvFilePath,
        setCsvFilePath: csvState?.setGlobalCsvFilePath,
        videoFilePath: videoState?.videoFilePath,
        setVideoFilePath: videoState?.setGlobalVideoFilePath,
        isMultiwindow: multiwindowState?.isMultiwindow,
        setIsMultiwindow: multiwindowState?.setGlobalIsMultiwindow,
    };
}

export default useGlobalState;
