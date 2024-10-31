import { listen } from "@tauri-apps/api/event";
import { parseUtcString } from "../utils/datetimeHandlers";
import { useGlobalStateAttributeHookFactory } from "./useGlobalStateAttributeHookFactory";
import { LoadCsvSettings } from "../types/appState";


export function useSaveFilePath(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<string>({
        fieldName: 'saveFilePath',
        eventName: 'state-change--save-file-path',
        setOnly,
        defaultValue: undefined
    });
}

export function useCsvFilePath(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<string>({
        fieldName: 'csvFilePath',
        eventName: 'state-change--csv-file-path',
        setOnly,
        defaultValue: undefined
    });
}

export function useLoadCsvSettings(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<LoadCsvSettings>({
        fieldName: 'loadCsvSettings',
        eventName: 'state-change--load-csv-settings',
        // Add a custom parser to go correct handle ignoring datetimes within the timebounds. 
        parseValue: (settings) => {
            if (!settings) return settings;
            if (!settings.time_bounds) return settings;
            
            return {
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
        },
        setOnly,
        defaultValue: undefined
    });
}

export function useVideoFilePath(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<string>({
        fieldName: 'videoFilePath',
        eventName: 'state-change--video-file-path',
        setOnly,
        defaultValue: undefined
    });
}

export function useIsMultiwindow(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<boolean>({
        fieldName: 'isMultiwindow',
        eventName: 'state-change--is-multiwindow',
        setOnly,
        defaultValue: false
    });
}

export function useVideoStartTime(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<Date | null>({
        fieldName: 'videoStartTime',
        eventName: 'state-change--video-start-time',
        parseValue: (value) => value ? parseUtcString(value) : null,
        setOnly,
        defaultValue: null
    });
}

export function useIsModifiedSinceLastSave(setOnly: boolean = false) {
    return useGlobalStateAttributeHookFactory<boolean>({
        fieldName: 'isModifiedSinceLastSave',
        eventName: 'state-change--is-modified-since-last-save',
        setOnly,
        defaultValue: false
    });
}

// hooks/useGlobalState.ts
interface GlobalStateOptions {
    saveFile?: boolean;
    csvFile?: boolean;
    loadCsvSettings?: boolean;
    videoFile?: boolean;
    isMultiwindow?: boolean;
    videoStartTime?: boolean;
    isModified?: boolean;
    setOnly?: boolean;
}

const defaultOptions: GlobalStateOptions = {
    saveFile: false,
    csvFile: false,
    loadCsvSettings: false,
    videoFile: false,
    isMultiwindow: false,
    videoStartTime: false,
    isModified: false,
    setOnly: false,
};

export interface GlobalState {
    saveFilePath?: string;
    setSaveFilePath?: (path: string) => Promise<void>;
    isSaveFileLoading: boolean;
    
    csvFilePath?: string;
    setCsvFilePath?: (path: string) => Promise<void>;
    isCsvFileLoading: boolean;
    
    loadCsvSettings?: LoadCsvSettings;
    setLoadCsvSettings?: (settings: LoadCsvSettings) => Promise<void>;
    isLoadCsvSettingsLoading: boolean;
    
    videoFilePath?: string;
    setVideoFilePath?: (path: string) => Promise<void>;
    isVideoFileLoading: boolean;
    
    isMultiwindow?: boolean;
    setIsMultiwindow?: (isMultiwindow: boolean) => Promise<void>;
    isMultiwindowLoading: boolean;
    
    videoStartTime?: Date | null;
    setVideoStartTime?: (startTime: Date | null) => Promise<void>;
    isVideoStartTimeLoading: boolean;
    
    isModifiedSinceLastSave?: boolean;
    setIsModifiedSinceLastSave?: (isModified: boolean) => Promise<void>;
    isModifiedLoading: boolean;
}

function useGlobalState(options: GlobalStateOptions = defaultOptions): GlobalState {
    const { value: saveFilePath, setValue: setSaveFilePath, isLoading: isSaveFileLoading } = 
        options.saveFile ? useSaveFilePath(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    const { value: csvFilePath, setValue: setCsvFilePath, isLoading: isCsvFileLoading } = 
        options.csvFile ? useCsvFilePath(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    const { value: loadCsvSettings, setValue: setLoadCsvSettings, isLoading: isLoadCsvSettingsLoading } = 
        options.loadCsvSettings ? useLoadCsvSettings(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    const { value: videoFilePath, setValue: setVideoFilePath, isLoading: isVideoFileLoading } = 
        options.videoFile ? useVideoFilePath(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    const { value: isMultiwindow, setValue: setIsMultiwindow, isLoading: isMultiwindowLoading } = 
        options.isMultiwindow ? useIsMultiwindow(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    const { value: videoStartTime, setValue: setVideoStartTime, isLoading: isVideoStartTimeLoading } = 
        options.videoStartTime ? useVideoStartTime(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    const { value: isModifiedSinceLastSave, setValue: setIsModifiedSinceLastSave, isLoading: isModifiedLoading } = 
        options.isModified ? useIsModifiedSinceLastSave(options.setOnly) : { value: undefined, setValue: undefined, isLoading: false };

    return {
        saveFilePath,
        setSaveFilePath,
        isSaveFileLoading,
        
        csvFilePath,
        setCsvFilePath,
        isCsvFileLoading,
        
        loadCsvSettings,
        setLoadCsvSettings,
        isLoadCsvSettingsLoading,
        
        videoFilePath,
        setVideoFilePath,
        isVideoFileLoading,
        
        isMultiwindow,
        setIsMultiwindow,
        isMultiwindowLoading,
        
        videoStartTime,
        setVideoStartTime,
        isVideoStartTimeLoading,
        
        isModifiedSinceLastSave,
        setIsModifiedSinceLastSave,
        isModifiedLoading,
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
