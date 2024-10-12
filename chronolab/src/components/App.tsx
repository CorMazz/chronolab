import { useState } from "react";
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  MediaController,
  MediaControlBar,
  MediaTimeRange,
  MediaTimeDisplay,
  MediaVolumeRange,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaMuteButton,
} from 'media-chrome/react';

import { WebviewWindow } from '@tauri-apps/api/webviewWindow'


function App() {
  const [videoSrc, setVideoSrc] = useState("");
  const [csvPath, setCSVPath] = useState("");
  
  async function selectVideoFile() {
    const file = await open({
      multiple: false,
      directory: false,
    });
    if (file) {
      setVideoSrc(convertFileSrc(file))
    }
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
      setCSVPath(file);
      console.log(csvPath);
      invoke('scan_csv', { path: file }).then((summary) => console.log(summary));
    }
  }


  async function createNewWindow() {
    const webview = new WebviewWindow('my-label', {
      url: '/app-windows/plot-window.html'
    });
    // since the webview window is created asynchronously,
    // Tauri emits the `tauri://created` and `tauri://error` to notify you of the creation response
    webview.once('tauri://created', function () {
      console.log("Window Created")
    })
    webview.once('tauri://error', function (e: any)  {
      (console.log(e))
    })
  }
  


  return (
    <div className="container">

      <MediaController>
        <video
          slot="media"
          src={videoSrc}
          preload="auto"
          muted
          crossOrigin=""
        />
        <MediaControlBar>
          <MediaPlayButton></MediaPlayButton>
          <MediaSeekBackwardButton></MediaSeekBackwardButton>
          <MediaSeekForwardButton></MediaSeekForwardButton>
          <MediaTimeRange></MediaTimeRange>
          <MediaTimeDisplay showDuration></MediaTimeDisplay>
          <MediaMuteButton></MediaMuteButton>
          <MediaVolumeRange></MediaVolumeRange>
        </MediaControlBar>
      </MediaController>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          selectVideoFile();
        }}
      >
        <button type="submit">Open Video</button>
      </form>

      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          selectCSVFile();
        }}
      >
        <button type="submit">Select CSV File</button>
      </form>

      <button onClick={createNewWindow}>Open Plot</button>

    </div>
  );
}

export default App;