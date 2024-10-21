import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import useGlobalState from "../hooks/useGlobalState";
import { selectCsvFile, selectVideoFile } from '../utils/fileSelectors';
import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import PlotSettings from './PlotSettings';
import { VideoStartTimeForm } from './VideoPlayer';



/**
 * The dropdown settings menu for all windows. 
 */
function Menu() {

    const {setCsvFilePath, setVideoFilePath, setIsMultiwindow} = useGlobalState(
        {csvFile: true, videoFile: true, isMultiwindow: true, setOnly: true}
    );
    const [showPlotSettings, setShowPlotSettings] = useState(false);
    const [showVideoSettings, setShowVideoSettings] = useState(false);


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
        <div id="container" className="p-4 bg-gray-100 rounded-lg shadow-lg max-w-2xl mx-auto space-y-4">
            <div className="space-y-4">
                {/* Button: Get CSV Schema */}
                <button 
                onClick={() => invoke("get_csv_schema").then((schema) => console.log(schema))} 
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
                >
                Get CSV Schema
                </button>

                {/* Button: Select CSV File */}
                <button 
                onClick={() => selectCsvFile(setCsvFilePath)} 
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
                >
                Navbar: Select CSV File
                </button>

                {/* Button: Select Video File */}
                <button 
                onClick={() => selectVideoFile(setVideoFilePath)} 
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
                >
                Navbar: Select Video File
                </button>

                {/* Toggle Button for Plot Settings */}
                <button 
                onClick={togglePlotSettings} 
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
                >
                {showPlotSettings ? "Hide Plot Settings" : "Show Plot Settings"}
                </button>
                {showPlotSettings && <PlotSettings />}

                {/* Toggle Button for Video Settings */}
                <button 
                onClick={toggleVideoSettings} 
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:ring focus:ring-blue-200 transition"
                >
                {showVideoSettings ? "Hide Video Settings" : "Show Video Settings"}
                </button>
                {showVideoSettings && <VideoStartTimeForm />}
            </div>
        </div>

    )
}

export default Menu;
