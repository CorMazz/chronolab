import { open } from '@tauri-apps/plugin-dialog';

/**
 * Opens a file selection dialog and updates the global state.
 * Used by the Menu and Plotter components. 
 */
async function selectCsvFile(setCsvFilePath: ((path: string) => Promise<void>) | undefined) {

    const file = await open({
        multiple: false,
        directory: false,
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
async function selectVideoFile(setVideoFilePath: ((path: string) => Promise<void>) | undefined) {

    const file = await open({
        multiple: false,
        directory: false,
    });
    if (file && setVideoFilePath) {
        setVideoFilePath(file)
    } else {
        console.error(`Something went wrong with setting the video file path. Perhaps a file wasn't selected. File: ${file}`)
    }
}

export { selectCsvFile, selectVideoFile }