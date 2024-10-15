import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

// Enable global state for the path of the CSV file
function useCsvFilePath(): { csvFilePath: string; setGlobalCsvFilePath: (path: string) => Promise<void>; } {
    const [csvFilePath, setLocalCsvFilePath] = useState("");

    // Update the global state
    const setGlobalCsvFilePath = async (path: string) => {
        await invoke("set_app_state", { field: "csvFilePath", fieldValue: path });
    };

    // Listen for global state changes
    useEffect(() => {
        const unlisten = listen<string>("state-change--csv-file-path", (event) => {
            setLocalCsvFilePath(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    return { csvFilePath, setGlobalCsvFilePath };
}

// Enable global state for the path of the video file
function useVideoFilePath(): { videoFilePath: string; setGlobalVideoFilePath: (path: string) => Promise<void>; } {
    const [videoFilePath, setLocalVideoFilePath] = useState("");

    // Update the global state
    const setGlobalVideoFilePath = async (path: string) => {
        console.log("Original Video File Path Saved to State:", path);
        await invoke("set_app_state", { field: "videoFilePath", fieldValue: path });
    };

    // Listen for global state changes
    useEffect(() => {
        const unlisten = listen<string>("state-change--video-file-path", (event) => {
            console.log("Video File Path Contained with State Change Event:", event.payload);
            setLocalVideoFilePath(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    return { videoFilePath, setGlobalVideoFilePath };
}

// Enable global state for if the application is multiwindow
function useIsMultiWindow(): { isMultiwindow: boolean; setGlobalIsMultiwindow: (isMultiwindow: boolean) => Promise<void>; } {
    const [isMultiwindow, setLocalIsMultiwindow] = useState(false);

    // Update the global state
    const setGlobalIsMultiwindow = async (isMultiwindow: boolean) => {
        await invoke("set_app_state", { field: "isMultiwindow", fieldValue: isMultiwindow });
    };

    // Listen for global state changes
    useEffect(() => {
        const unlisten = listen<boolean>("state-change--is-multiwindow", (event) => {
            setLocalIsMultiwindow(event.payload); 
        });

        // Cleanup the listener when the component unmounts
        return () => {
            unlisten.then((f) => f());
        };
    }, []);

    return { isMultiwindow, setGlobalIsMultiwindow };
}

// Define the type for the return value of useGlobalState
type GlobalState = {
    csvFilePath: string;
    setCsvFilePath: (path: string) => Promise<void>;
    videoFilePath: string;
    setVideoFilePath: (path: string) => Promise<void>;
    isMultiwindow: boolean;
    setIsMultiwindow: (isMultiwindow: boolean) => Promise<void>;
};

function useGlobalState(): GlobalState {
    const { csvFilePath, setGlobalCsvFilePath } = useCsvFilePath();
    const { videoFilePath, setGlobalVideoFilePath } = useVideoFilePath();
    const { isMultiwindow, setGlobalIsMultiwindow } = useIsMultiWindow();

    return {
        csvFilePath,
        setCsvFilePath: setGlobalCsvFilePath,
        videoFilePath,
        setVideoFilePath: setGlobalVideoFilePath,
        isMultiwindow,
        setIsMultiwindow: setGlobalIsMultiwindow,
    };
};

export default useGlobalState;
