import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import useGlobalState from "../hooks/useGlobalState";
import { selectCsvFile, selectVideoFile } from '../utils/fileSelectors';
import { invoke } from '@tauri-apps/api/core';



/**
 * The dropdown settings menu for all windows. 
 */
function Menu() {

    const {setCsvFilePath, setVideoFilePath, setIsMultiwindow} = useGlobalState(
        {csvFile: true, videoFile: true, isMultiwindow: true, setOnly: true}
    );

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

    return (
        <div id="container">
            <button onClick={() => invoke( "get_csv_schema" ).then((schema) => console.log(schema))}>Get CSV Schema</button>
            <button onClick={() => selectCsvFile(setCsvFilePath)}>Navbar: Select CSV File</button>
            <button onClick={() => selectVideoFile(setVideoFilePath)}>Navbar: Select Video File</button>
            <button onClick={createNewWindow}>Navbar: Open Plot in New Window</button>
        </div>
    )
}

export default Menu;
