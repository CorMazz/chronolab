import { Button, Tooltip, Drawer, Container } from '@mui/material';
import {
    InsertChart as ChartIcon,
    Settings as SettingsIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import PlotSettings from '../PlotSettings';
import { VideoStartTimeForm } from '../VideoPlayer';

export function SettingsButtons() {
    const [showPlotSettings, setShowPlotSettings] = useState(false);
    const [showVideoSettings, setShowVideoSettings] = useState(false);

    return (
        <>
            <Tooltip title="Plot Settings">
                <Button
                    color="inherit"
                    onClick={() => setShowPlotSettings(true)}
                    startIcon={<ChartIcon />}
                    sx={{ borderRadius: 1 }}
                >
                    Plot Settings
                </Button>
            </Tooltip>

            <Tooltip title="Video Settings">
                <Button
                    color="inherit"
                    onClick={() => setShowVideoSettings(true)}
                    startIcon={<SettingsIcon />}
                    sx={{ borderRadius: 1 }}
                >
                    Video Settings
                </Button>
            </Tooltip>

            <Drawer 
                anchor="right" 
                open={showPlotSettings} 
                onClose={() => setShowPlotSettings(false)}
                PaperProps={{ sx: { width: 300 } }}
            >
                <Container sx={{ padding: 2 }}>
                    <PlotSettings />
                </Container>
            </Drawer>

            <Drawer 
                anchor="right" 
                open={showVideoSettings} 
                onClose={() => setShowVideoSettings(false)}
                PaperProps={{ sx: { width: 300 } }}
            >
                <Container sx={{ padding: 2 }}>
                    <VideoStartTimeForm />
                </Container>
            </Drawer>
        </>
    );
}