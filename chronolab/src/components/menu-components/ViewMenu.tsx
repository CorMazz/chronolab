import { useState } from 'react';
import {
    Button,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import {
    ViewColumn as SideBySideIcon,
    ViewStream as StackedIcon,
    SyncAlt as LeftRightIcon,
    UnfoldMore as UpDownIcon,
    Brightness7 as Brightness7Icon,
    Brightness4 as Brightness4Icon,
} from '@mui/icons-material';
import { useTheme } from '../../themes/ThemeContext';

type LayoutType = 'side-by-side-plot-left' | 'side-by-side-video-left' | 'stacked-video-top' | 'stacked-plot-top';

interface ViewMenuProps {
    currentLayout: LayoutType;
    onLayoutChange: (layout: LayoutType) => void;
}

function ViewMenu({ currentLayout, onLayoutChange }: ViewMenuProps) {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const { mode, toggleTheme } = useTheme();
    const menuOpen = Boolean(anchorEl);
    

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLayoutSelect = (layout: LayoutType) => {
        onLayoutChange(layout);
        handleMenuClose();
    };

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
                View
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
                <MenuItem 
                    onClick={() => handleLayoutSelect('side-by-side-plot-left')}
                    selected={currentLayout === 'side-by-side-plot-left'}
                >
                    <ListItemIcon><SideBySideIcon fontSize="small" /><LeftRightIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Plot Left</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={() => handleLayoutSelect('side-by-side-video-left')}
                    selected={currentLayout === 'side-by-side-video-left'}
                >
                    <ListItemIcon><SideBySideIcon fontSize="small" /><LeftRightIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Video Left</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={() => handleLayoutSelect('stacked-video-top')}
                    selected={currentLayout === 'stacked-video-top'}
                >
                    <ListItemIcon><StackedIcon fontSize="small" /><UpDownIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Video Top</ListItemText>
                </MenuItem>
                <MenuItem 
                    onClick={() => handleLayoutSelect('stacked-plot-top')}
                    selected={currentLayout === 'stacked-plot-top'}
                >
                    <ListItemIcon><StackedIcon fontSize="small" /><UpDownIcon fontSize="small" /></ListItemIcon>
                    <ListItemText>Plot Top</ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={() => {toggleTheme(); handleMenuClose();}} color="inherit"
                >
                    <ListItemIcon>{mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}</ListItemIcon>
                    <ListItemText>Toggle {mode === 'dark' ? 'Light' : 'Dark'} Mode</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}

export default ViewMenu;