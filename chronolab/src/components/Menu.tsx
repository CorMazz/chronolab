import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import useGlobalState, { waitForGlobalStateUpdate } from "../hooks/useGlobalState";
import { selectCsvFile, selectLoadFile, selectSaveFile, selectVideoFile } from '../utils/fileSelectors';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import PlotSettings from './PlotSettings';
import { VideoStartTimeForm } from './VideoPlayer';
import { AppBar, Toolbar, Button, Box, Drawer, Container } from '@mui/material';



/**
 * The dropdown settings menu for all windows. 
 */
function Menu() {

    const {setCsvFilePath, setVideoFilePath, setIsMultiwindow, setSaveFilePath} = useGlobalState(
        {saveFile: true, csvFile: true, videoFile: true, isMultiwindow: true, setOnly: true}
    );
    const [showPlotSettings, setShowPlotSettings] = useState(false);
    const [showVideoSettings, setShowVideoSettings] = useState(false);

    async function saveAs() {
        try {
            // Start the file selection process
            selectSaveFile(setSaveFilePath);
    
            // Wait for the state update event
            const updatedState = await waitForGlobalStateUpdate("state-change--save-file-path");
            console.log('Save file path updated:', updatedState);
    
            // Now that we have the updated state, proceed with saving
            await invoke("save_app_state_to_file");
        } catch (error) {
            console.error('Error during save process:', error);
            // Handle error appropriately
        }
    }

    /**
     * Let the user decide if they want to open the plot in a separate window.
     */
    async function createNewWindow() {
        const webview = new WebviewWindow('plot-window', {
            url: '/app-windows/plot-window.html'
        });
    
        // Since the webview window is created asynchronously,
        // Tauri emits the `tauri://created` and `tauri://error` to notify you of the creation response
        webview.once('tauri://created', function () {
            console.log("Window Created");
            if (setIsMultiwindow) {  // Check if setIsMultiwindow is defined
                setIsMultiwindow(true);
            } else {
                console.error("setIsMultiwindow is undefined. Something is wrong with your global state.");
            }
        });
    
        webview.once('tauri://error', function (e: any)  {
            console.log(e);
        });
    
        // TODO: This seems bugged. It prevents the second window from closing when this code is active. 
        // // Detect when the window is closed
        // webview.once('tauri://close-requested', () => {
        //     console.log("Window closed");
        //     if (setIsMultiwindow) {  // Check if setIsMultiwindow is defined
        //         setIsMultiwindow(false);
        //     } else {
        //         console.error("setIsMultiwindow is undefined. Something is wrong with your global state.");
        //     }
        // });
    }

    /**
     * Toggle the visibility of the PlotSettings component.
     */
    const togglePlotSettings = () => {
        setShowPlotSettings(prevState => !prevState);
    }

    /**
     * Toggle the visibility of the PlotSettings component.
     */
    const toggleVideoSettings = () => {
        setShowVideoSettings(prevState => !prevState);
    }

    return (
        <div>
            <AppBar position="static" sx={{ width: "100%" }}>
                <Toolbar>
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        {/* Wrap the buttons in another Box with full width and distribute space */}
                        <Box sx={{ display: 'flex', width: '100%' }}>
                            <Button
                                color="inherit"
                                // onClick={() => invoke}
                                sx={{ flex: 1 }}  // Make the button take up equal space
                            >
                                New
                            </Button>
                            <Button
                                color="inherit"
                                onClick={saveAs}
                                sx={{ flex: 1 }}  // Make the button take up equal space
                            >
                                Save As
                            </Button>
                            <Button
                                color="inherit"
                                onClick={selectLoadFile}
                                sx={{ flex: 1 }}  // Make the button take up equal space
                            >
                                Load
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => selectCsvFile(setCsvFilePath)}
                                sx={{ flex: 1 }}
                            >
                                Select CSV File
                            </Button>
                            <Button
                                color="inherit"
                                onClick={() => selectVideoFile(setVideoFilePath)}
                                sx={{ flex: 1 }}
                            >
                                Select Video File
                            </Button>
                            <Button
                                color="inherit"
                                onClick={togglePlotSettings}
                                sx={{ flex: 1 }}
                            >
                                {showPlotSettings ? "Hide Plot Settings" : "Show Plot Settings"}
                            </Button>
                            <Button
                                color="inherit"
                                onClick={toggleVideoSettings}
                                sx={{ flex: 1 }}
                            >
                                {showVideoSettings ? "Hide Video Settings" : "Show Video Settings"}
                            </Button>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Drawer for Plot Settings */}
            <Drawer anchor="right" open={showPlotSettings} onClose={togglePlotSettings}>
                <Container sx={{ width: 300, padding: 2 }}>
                    <PlotSettings />
                </Container>
            </Drawer>

            {/* Drawer for Video Settings */}
            <Drawer anchor="right" open={showVideoSettings} onClose={toggleVideoSettings}>
                <Container sx={{ width: 300, padding: 2 }}>
                    <VideoStartTimeForm />
                </Container>
            </Drawer>
        </div>
    )
}

export default Menu;
