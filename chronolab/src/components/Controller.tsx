import { open } from '@tauri-apps/plugin-dialog';
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import useGlobalState from "../hooks/useGlobalState";

function Controller() {

    const {setCsvFilePath, setVideoFilePath, setIsMultiwindow} = useGlobalState();

    /**
     * Let the user decide if they want to open the plot in a separate window.
     */
    async function createNewWindow() {
        const webview = new WebviewWindow('plot-window', {
            url: '/app-windows/plot-window.html'
        });
        // since the webview window is created asynchronously,
        // Tauri emits the `tauri://created` and `tauri://error` to notify you of the creation response
        webview.once('tauri://created', function () {
            console.log("Window Created")
            setIsMultiwindow(true)
        })
        webview.once('tauri://error', function (e: any)  {
            (console.log(e))
        })

        // Detect when the window is closed
        webview.once('tauri://close-requested', () => {
            console.log("Window closed");
            setIsMultiwindow(false);
        });
    }

    /**
     * Loads a CSV file using Polars on the backend.
     */
    async function selectCSVFile() {
        const file = await open({
            multiple: false,
            directory: false,
        });
        if (file) {
            setCsvFilePath(file);
            console.log(file);
            invoke('scan_csv', { path: file }).then((summary) => console.log(summary));
        }
    }

    /**
     * Updates the backend state as to what the current video file path is.
     */
    async function selectVideoFile() {
        const file = await open({
          multiple: false,
          directory: false,
        });
        if (file) {
          setVideoFilePath(file)
        }
      }

    return (
        <div id="container">
            <button onClick={selectCSVFile}>Select CSV File</button>
            <button onClick={selectVideoFile}>Select Video File</button>
            <button onClick={createNewWindow}>Open Plot</button>
        </div>
    )
}

export default Controller;
