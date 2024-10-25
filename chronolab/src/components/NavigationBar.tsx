import { AppBar, Toolbar, Box, Divider } from '@mui/material';
import { FileMenu } from './menu-components/FileMenu';
import { FileSelectionButtons } from './menu-components/FileSelectionButtons';
import { SettingsButtons } from './menu-components/SettingsButtons';


export default function NavigationBar() {
    return (
        <AppBar position="static" sx={{ width: "100%" }}>
            <Toolbar variant="dense">
                <Box sx={{ 
                    flexGrow: 1, 
                    display: 'flex', 
                    width: '100%',
                    alignItems: 'center',
                    gap: 1
                }}>
                    <FileMenu />
                    
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)' }} />
                    
                    <FileSelectionButtons />
                    
                    <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255, 255, 255, 0.25)' }} />
                    
                    <SettingsButtons />
                </Box>
            </Toolbar>
        </AppBar>
    );
}