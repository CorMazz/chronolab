import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { Warning as WarningIcon } from '@mui/icons-material';

interface NewFileDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export function NewFileDialog({ open, onClose, onConfirm }: NewFileDialogProps) {
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
                    You have unsaved changes. Creating a new file will discard these changes. 
                    Do you want to proceed?
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={onConfirm} variant="contained" color="primary" autoFocus>
                    Create New File
                </Button>
            </DialogActions>
        </Dialog>
    );
}