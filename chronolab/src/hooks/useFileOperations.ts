// hooks/useFileOperations.ts
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open, save } from '@tauri-apps/plugin-dialog';
import { useToast } from './useToast';

interface FileFilters {
    [key: string]: {
        name: string;
        extensions: string[];
    }[];
}

export function useFileOperations() {
    const { showToast } = useToast();

    const filters: FileFilters = {
        csv: [
            { name: "CSV File", extensions: ["csv"] },
            { name: "Other", extensions: ["*"] }
        ],
        video: [
            { 
                name: "Video File", 
                extensions: ["mp4", "mkv", "mov", "avi", "wmv", "flv", "f4v", "webm", "avchd", "ogv", "m4v"]
            },
            { name: "Other", extensions: ["*"] }
        ],
        chronolab: [
            { name: "Chronolab Save File", extensions: ["crm"] },
            { name: "Other", extensions: ["*"] }
        ]
    };

    const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) return error.message;
        if (typeof error === 'string') return error;
        return 'An unknown error occurred';
    };

    const selectCsvFile = useCallback(async (setCsvFilePath: ((path: string) => Promise<void>) | undefined) => {
        try {
            const file = await open({
                multiple: false,
                directory: false,
                filters: filters.csv
            });

            if (file && setCsvFilePath) {
                await setCsvFilePath(file);
                showToast('CSV file selected successfully', 'success');
            } else if (!file) {
                showToast('File selection cancelled', 'info');
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            showToast(`Error selecting CSV file: ${errorMessage}`, 'error');
            console.error('Error selecting CSV file:', error);
        }
    }, [showToast]);

    const selectVideoFile = useCallback(async (setVideoFilePath: ((path: string) => Promise<void>) | undefined) => {
        try {
            const file = await open({
                multiple: false,
                directory: false,
                filters: filters.video
            });

            if (file && setVideoFilePath) {
                await setVideoFilePath(file);
                showToast('Video file selected successfully', 'success');
            } else if (!file) {
                showToast('File selection cancelled', 'info');
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            showToast(`Error selecting video file: ${errorMessage}`, 'error');
            console.error('Error selecting video file:', error);
        }
    }, [showToast]);

    const selectLoadFile = useCallback(async () => {
        try {
            const file = await open({
                multiple: false,
                directory: false,
                filters: filters.chronolab
            });

            if (!file) {
                showToast('File selection cancelled', 'info');
                return;
            }

            await invoke("load_app_state_from_file", { file });
            showToast('File loaded successfully', 'success');
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            showToast(`Error loading file: ${errorMessage}`, 'error');
            console.error('Error loading app state from file:', error);
        }
    }, [showToast]);

    const selectSaveFile = useCallback(async (setSaveFilePath: ((path: string) => Promise<void>) | undefined) => {
        try {
            const file = await save({
                filters: filters.chronolab
            });

            if (file && setSaveFilePath) {
                await setSaveFilePath(file);
                showToast('Save location selected', 'success');
            } else if (!file) {
                showToast('File selection cancelled', 'info');
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            showToast(`Error selecting save location: ${errorMessage}`, 'error');
            console.error('Error selecting save location:', error);
        }
    }, [showToast]);

    return {
        selectCsvFile,
        selectVideoFile,
        selectLoadFile,
        selectSaveFile
    };
}