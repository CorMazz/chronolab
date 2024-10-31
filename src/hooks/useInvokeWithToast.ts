import { invoke } from '@tauri-apps/api/core';
import { useToast } from './useToast';

export function useInvokeWithToast() {
    const { showToast } = useToast();

    const invokeWithToast = async <T>(
        command: string,
        args?: Record<string, unknown>,
        successMessage?: string,
        errorPrefix: string = 'Operation failed'
    ): Promise<T | undefined> => {
        try {
            const result = await invoke<T>(command, args);
            if (successMessage) {
                showToast(successMessage, 'success');
            }
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            showToast(`${errorPrefix}: ${errorMessage}`, 'error');
            console.error(`${errorPrefix}:`, error);
            return undefined;
        }
    };

    return { invokeWithToast };
}