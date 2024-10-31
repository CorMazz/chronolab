import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { Warning as WarningIcon } from '@mui/icons-material';

interface DiscardFileDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

// Warn the user if they're going to overwrite unsaved changes. 
export function DiscardFileDialog({ open, onClose, onConfirm }: DiscardFileDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="warning" />
                Unsaved Changes
            </DialogTitle>
            <DialogContent>
                <DialogContentText>
                    You have unsaved changes. This action will discard these changes. 
                    Do you want to proceed?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="primary" autoFocus>
                    Continue
                </Button>
            </DialogActions>
        </Dialog>
    );
}