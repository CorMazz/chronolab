import { useState } from "react";
import reactLogo from "./assets/react.svg";
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

function App() {
  const [videoSrc, setVideoSrc] = useState("");
  
  async function openFile() {
    const file = await open({
      multiple: false,
      directory: false,
    });
    if (file) {
      setVideoSrc(convertFileSrc(file))
    }
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
          openFile();
        }}
      >
        <button type="submit">Open Video</button>
      </form>
    </div>
  );
}

export default App;