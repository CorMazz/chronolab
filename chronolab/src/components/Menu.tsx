import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import useGlobalState from "../hooks/useGlobalState";
import { selectCsvFile, selectVideoFile } from '../utils/fileSelectors';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import PlotSettings from './PlotSettings';
import { VideoStartTimeForm } from './VideoPlayer';
import { Button, Menu as FluentMenu, MenuTrigger, MenuPopover, MenuList, MenuItem, Drawer, DrawerHeader, DrawerBody, DrawerFooter } from '@fluentui/react-components';




/**
 * The dropdown settings menu for all windows. 
 */
function Menu() {

    const {setCsvFilePath, setVideoFilePath, setIsMultiwindow} = useGlobalState(
        {csvFile: true, videoFile: true, isMultiwindow: true, setOnly: true}
    );
    const [isPlotSettingsOpen, setIsPlotSettingsOpen] = useState(false);
    const [isVideoSettingsOpen, setIsVideoSettingsOpen] = useState(false);


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

    const openPlotSettings = () => setIsPlotSettingsOpen(true);
    const closePlotSettings = () => setIsPlotSettingsOpen(false);
  
    const openVideoSettings = () => setIsVideoSettingsOpen(true);
    const closeVideoSettings = () => setIsVideoSettingsOpen(false);

    return (
        <div id="container">
          {/* Menu Component for top navigation */}
          <FluentMenu>
            <MenuTrigger>
              <Button>Menu</Button>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => invoke('get_csv_schema').then((schema) => console.log(schema))}>
                  Get CSV Schema
                </MenuItem>
                <MenuItem onClick={() => selectCsvFile(setCsvFilePath)}>
                  Select CSV File
                </MenuItem>
                <MenuItem onClick={() => selectVideoFile(setVideoFilePath)}>
                  Select Video File
                </MenuItem>
                <MenuItem onClick={openPlotSettings}>
                  Show Plot Settings
                </MenuItem>
                <MenuItem onClick={openVideoSettings}>
                  Show Video Settings
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </FluentMenu>
    
          {/* Drawer for Plot Settings */}
          <Drawer
            open={isPlotSettingsOpen}
            onOpenChange={(event, openState) => setIsPlotSettingsOpen(openState.open)}
          >
            <DrawerHeader>
              <h2>Plot Settings</h2>
            </DrawerHeader>
            <DrawerBody>
              {/* Render your PlotSettings component here */}
              <PlotSettings />
            </DrawerBody>
            <DrawerFooter>
              <Button appearance="secondary" onClick={closePlotSettings}>
                Close
              </Button>
            </DrawerFooter>
          </Drawer>
    
          {/* Drawer for Video Start Time Settings */}
          <Drawer
            open={isVideoSettingsOpen}
            onOpenChange={(event, openState) => setIsVideoSettingsOpen(openState.open)}
          >
            <DrawerHeader>
              <h2>Video Settings</h2>
            </DrawerHeader>
            <DrawerBody>
              {/* Render your VideoStartTimeForm component here */}
              <VideoStartTimeForm />
            </DrawerBody>
            <DrawerFooter>
              <Button appearance="secondary" onClick={closeVideoSettings}>
                Close
              </Button>
            </DrawerFooter>
          </Drawer>
        </div>
      );
};
export default Menu;
