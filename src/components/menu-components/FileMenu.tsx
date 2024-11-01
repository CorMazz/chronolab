// FileMenu.tsx
import { useState } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Divider,
} from '@mui/material';
import {
    CreateNewFolder as NewIcon,
    Save as SaveIcon,
    SaveAs as SaveAsIcon,
    FolderOpen as OpenIcon,
} from '@mui/icons-material';
import { invoke } from '@tauri-apps/api/core';
import useGlobalState, { waitForGlobalStateUpdate } from "../../hooks/useGlobalState";
import { DiscardFileDialog } from './DiscardFileDialog';
import { useToast } from '../../hooks/useToast';
import { useFileOperations } from '../../hooks/useFileOperations';

export function FileMenu() {
    const { showToast } = useToast();
    const { selectLoadFile, selectSaveFile } = useFileOperations();

    const { isModifiedSinceLastSave, saveFilePath, setSaveFilePath } = useGlobalState({
        isModified: true,
        saveFile: true,
        setOnly: false
    });

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [confirmNewFileDiscardDialogOpen, setConfirmNewFileDiscardDialogOpen] = useState(false);
    const [confirmLoadFileDiscardDialogOpen, setConfirmLoadFileDiscardDialogOpen] = useState(false);

    
    // ---------------------------------------------------------------------------------------------------------------------------------------------
    // File Menu Display Handlers
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    const menuOpen = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------------
    // NewFile Handlers
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    const handleNewRequest = async () => {
        handleMenuClose();
        if (isModifiedSinceLastSave) {
            setConfirmNewFileDiscardDialogOpen(true);
        } else {
            await createNewFile();
        }
    };

    const createNewFile = async () => {
        try {
            invoke("clear_app_state");
            showToast("App cleared", "success");
        } catch (error) {
            console.error('Error creating new file:', error);
            showToast(`Error: ${error}`, "error");
        }
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------------
    // Load File Handlers
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    const handleLoadRequest = async () => {
        handleMenuClose();
        if (isModifiedSinceLastSave) {
            setConfirmLoadFileDiscardDialogOpen(true);
        } else {
            selectLoadFile();
        }
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------------
    // Save and SaveAs Handlers
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    const handleSave = async () => {
        if (!saveFilePath) {
            handleSaveAs()
        } else {
            try {
                handleMenuClose();
                await invoke("save_app_state_to_file");
                showToast("Saved", "success");
            } catch (error) {
                console.error('Error during save:', error);
                showToast(`Error: ${error}`, "error");
            }
        }
    };

    const handleSaveAs = async () => {
        try {
            handleMenuClose();
            selectSaveFile(setSaveFilePath);
            await waitForGlobalStateUpdate("state-change--save-file-path");
            await invoke("save_app_state_to_file");
            showToast("Saved", "success");
        } catch (error) {
            console.error('Error during save process:', error);
            showToast(`Error: ${error}`, "error");
        }
    };

    // ---------------------------------------------------------------------------------------------------------------------------------------------
    // Rendering
    // ---------------------------------------------------------------------------------------------------------------------------------------------

    return (
        <>
            <Button
                color="inherit"
                onClick={handleMenuClick}
                sx={{ 
                    borderRadius: 1,
                    '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                }}
            >
                File
            </Button>

            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        minWidth: 200
                    }
                }}
            >
                <MenuItem onClick={handleNewRequest}>
                    <ListItemIcon><NewIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>New</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleSave}>
                    <ListItemIcon><SaveIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Save</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSaveAs}>
                    <ListItemIcon><SaveAsIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Save As...</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleLoadRequest}>
                    <ListItemIcon><OpenIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Open...</ListItemText>
                </MenuItem>
            </Menu>

            <DiscardFileDialog
                open={confirmNewFileDiscardDialogOpen}
                onClose={() => setConfirmNewFileDiscardDialogOpen(false)}
                onConfirm={async () => {
                    setConfirmNewFileDiscardDialogOpen(false);
                    await createNewFile();
                }}
            />
            <DiscardFileDialog
                open={confirmLoadFileDiscardDialogOpen}
                onClose={() => setConfirmLoadFileDiscardDialogOpen(false)}
                onConfirm={async () => {
                    setConfirmLoadFileDiscardDialogOpen(false);
                    selectLoadFile();
                }}
            />
        </>
    );
}
