import { useEffect, useState } from "react";
import { useInvokeWithToast } from "./useInvokeWithToast";
import { listen } from "@tauri-apps/api/event";

interface UseGlobalStateAttributeHookFactoryOptions<T> {
    fieldName: string;
    eventName: string;
    parseValue?: (value: any) => T;
    setOnly?: boolean;
    defaultValue?: T;
}

// A function factory which gives hooks which grab global state from the backend
export function useGlobalStateAttributeHookFactory<T>({
    fieldName,
    eventName,
    parseValue = (v) => v,
    setOnly = false,
    defaultValue
}: UseGlobalStateAttributeHookFactoryOptions<T>) {
    const [value, setValue] = useState<T | undefined>(defaultValue);
    const { invokeWithToast } = useInvokeWithToast();
    const [isLoading, setIsLoading] = useState(true);

    // Fetch global state on mount
    useEffect(() => {
        const fetchGlobalState = async () => {
            setIsLoading(true);
            const appStateField = { [fieldName]: { value: defaultValue } };
            const result = await invokeWithToast<T>(
                'get_app_state_field',
                { appStateField },
                undefined,
                `Failed to fetch ${fieldName}`
            );
            if (result !== undefined) {
                setValue(parseValue(result));
            }
            setIsLoading(false);
        };

        fetchGlobalState();
    }, [fieldName]);

    // Update the global state
    const setGlobalValue = async (newValue: T) => {
        const appStateField = { [fieldName]: { value: newValue } };
        await invokeWithToast(
            'set_app_state_field',
            { appStateField },
            undefined,
            `Failed to update ${fieldName} in the global state. Something is terribly wrong...`
        );
    };

    // Listen for global state changes
    useEffect(() => {
        if (setOnly) return;

        const unlisten = listen<T>(eventName, (event) => {
            setValue(parseValue(event.payload));
        });

        return () => {
            unlisten.then(f => f());
        };
    }, [eventName, setOnly, parseValue]);

    return { value, setValue: setGlobalValue, isLoading };
}

