import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';

/**
 * Opens a file selection dialog and updates the global state.
 * Used by the Menu and Plotter components. 
 */
export async function selectCsvFile(setCsvFilePath: ((path: string) => Promise<void>) | undefined) {

    const file = await open({
        multiple: false,
        directory: false,
        filters: [
            {
                name: "CSV File",
                extensions: ["csv"] 
            },
            {
                name: "Other",
                extensions: ["*"] 
            }
        ]
    });
    if (file && setCsvFilePath) {
        setCsvFilePath(file);
    }else {
        console.error(`Something went wrong with setting the csv file path. Perhaps a file wasn't selected. File: ${file}`)
    }
}

/**
 * Opens a file selection dialog and updates the global state.
 * Used by the Menu and VideoPlayer components. 
 */
export async function selectVideoFile(setVideoFilePath: ((path: string) => Promise<void>) | undefined) {

    const file = await open({
        multiple: false,
        directory: false,
        filters: [
            {
                name: "Video File",
                extensions: ["mp4", "mkv", "mov", "avi", "wmv", "flv", "f4v", "webm", "avchd", "ogv", "m4v"] 
            },
            {
                name: "Other",
                extensions: ["*"]
            }
        ]
        
    });
    if (file && setVideoFilePath) {
        setVideoFilePath(file)
    } else {
        console.error(`Something went wrong with setting the video file path. Perhaps a file wasn't selected. File: ${file}`)
    }
}

/**
 * Opens a file selection dialog and invokes the load_app_state_from_file backend method, which then emits events to update all frontend global state.
 * Used by the Menu component. 
 */
export async function selectLoadFile() {

    const file = await open({
        multiple: false,
        directory: false,
        filters: [
            {
                name: "Chronolab Save File",
                extensions: ["crm"] 
            },
            {
                name: "Other",
                extensions: ["*"]
            }
        ]
        
    });

    // Handle case where user cancels file selection
    if (!file) {
        console.log('File selection cancelled by user');
        return;
    }

    try {
        // Attempt to load the file
        await invoke("load_app_state_from_file", { file: file });
        console.log('File loaded successfully:', file);
    } catch (loadError) {
        // Handle specific errors from the backend
        console.error('Error loading app state from file:', loadError);
    }   
}

/**
 * Opens a file selection dialog and updates the global state.
 * Used by the Menu component. Does not actually invoke the save command on the backend. 
 */
export async function selectSaveFile(setSaveFilePath: ((path: string) => Promise<void>) | undefined) {

    const file = await save({
        filters: [
            {
                name: "Chronolab Save File",
                extensions: ["crm"] // My initials. Because I wrote it.
            },
            {
                name: "Other",
                extensions: ["*"]
            }
        ]
    });
    if (file && setSaveFilePath) {
        setSaveFilePath(file)
    } else {
        console.error(`Something went wrong with setting the save file path. Perhaps a file wasn't selected. File: ${file}`)
    }
}
