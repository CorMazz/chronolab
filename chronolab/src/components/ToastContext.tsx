import React, { createContext, useState, useCallback } from 'react';
import { Alert, Slide } from '@mui/material';
import { TransitionGroup } from 'react-transition-group';
import { styled } from '@mui/material/styles';

type Severity = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: number;
    message: string;
    severity: Severity;
}

interface ToastContextType {
    showToast: (message: string, severity?: Severity) => void;
    clearToasts: () => void;
}

// Styled container for the toast stack
const ToastContainer = styled('div')({
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 2000,
    display: 'flex',
    flexDirection: 'column-reverse', // Stack from bottom up
    maxHeight: '80vh',
    overflow: 'hidden',
});

// Styled wrapper for individual toasts with guaranteed spacing
const ToastWrapper = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    minHeight: 48,
    maxWidth: 400,
    marginBottom: '5px', // Fixed spacing between toasts
    '&:last-child': {
        marginBottom: 0, // Remove margin from the last toast
    },
    // Add scale animation
    '& .MuiAlert-root': {
        width: '100%',
        boxShadow: theme.shadows[2],
        animation: 'toast-enter 0.15s ease-out',
        '& .MuiAlert-message': {
            padding: '8px 0',
        }
    },
    '@keyframes toast-enter': {
        '0%': {
            transform: 'scale(0.9)',
            opacity: 0,
        },
        '100%': {
            transform: 'scale(1)',
            opacity: 1,
        }
    }
}));

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const maxToasts = 5;

    const showToast = useCallback((message: string, severity: Severity = 'success') => {
        const newToast: ToastMessage = {
            id: Date.now(),
            message,
            severity,
        };

        setToasts(currentToasts => {
            const updatedToasts = [newToast, ...currentToasts].slice(0, maxToasts);
            return updatedToasts;
        });

        setTimeout(() => {
            setToasts(currentToasts => 
                currentToasts.filter(toast => toast.id !== newToast.id)
            );
        }, 5000);
    }, []);

    const clearToasts = useCallback(() => {
        setToasts([]);
    }, []);

    const handleClose = useCallback((toastId: number) => {
        setToasts(currentToasts => 
            currentToasts.filter(toast => toast.id !== toastId)
        );
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, clearToasts }}>
            {children}
            <ToastContainer>
                <TransitionGroup>
                    {toasts.map((toast) => (
                        <Slide 
                            key={toast.id}
                            direction="left"
                            mountOnEnter
                            unmountOnExit
                            timeout={200}
                        >
                            <ToastWrapper>
                                <Alert
                                    severity={toast.severity}
                                    variant="filled"
                                    onClose={() => handleClose(toast.id)}
                                >
                                    {toast.message}
                                </Alert>
                            </ToastWrapper>
                        </Slide>
                    ))}
                </TransitionGroup>
            </ToastContainer>
        </ToastContext.Provider>
    );
}

// Custom hook for easier usage
export function useToast() {
    const context = React.useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}