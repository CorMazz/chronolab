import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import useGlobalState from "../hooks/useGlobalState";
import { selectVideoFile } from "../utils/fileSelectors";
import {z} from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { parseJSON } from "date-fns";
import { Button, Input, Label } from "@fluentui/react-components";

// This is used to validate the form inputs
const videoStartTimeFormInputs = z.object({
    video_start_time: z.preprocess(
      // Doing this bullshit with the length because the html datetime-local element truncates seconds if they're 0 and we need those to parse properly.
      (val) => (val == null || val === "" )  ? null : (parseJSON((val as string).length === 16 ? (val as string) + ":00" : (val as string))),
      z.date().nullable()
  ),
})

type VideoStartTimeFormInputs = z.infer<typeof videoStartTimeFormInputs>;

// ##############################################################################################################
// Child Component
// ##############################################################################################################

export function VideoStartTimeForm() {
    const { videoStartTime, setVideoStartTime } = useGlobalState({videoStartTime: true, setOnly: false});

    const { handleSubmit, register, formState: { errors } } = useForm<VideoStartTimeFormInputs>(
      {
        resolver: zodResolver(videoStartTimeFormInputs),
        defaultValues: { video_start_time: videoStartTime }
      }
    );

    const onFormSubmit = (data: VideoStartTimeFormInputs) => {
      console.log("Video Start Time Form Submission Data:")
      console.log("   Video Start Time:", data.video_start_time);
      console.log("   Video Start Time Type:", typeof(data.video_start_time));
      if (setVideoStartTime) {
        setVideoStartTime(data.video_start_time)
      } else {
        console.error("Unable to set the video start time due to an undefined global state setter.")
      }
      };


      return (
        <form onSubmit={handleSubmit(onFormSubmit)}>
          {/* Video Start Time Input */}
          <div>
            <Label htmlFor="video_start_time" required>
              Input the Video Start Time
            </Label>
            <Input
              id="video_start_time"
              type="datetime-local"
              step="1"
              {...register("video_start_time")}
              appearance={errors.video_start_time ? "filled-darker" : "outline"}
            />
            {errors.video_start_time && (
              <p style={{ color: 'red' }}>{errors.video_start_time.message}</p>
            )}
          </div>
    
          {/* Submit Button */}
          <Button appearance="primary" type="submit">
            Submit
          </Button>
        </form>
      );
    }




function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [lastTime, setLastTime] = useState<number | null>(null);
  const {videoFilePath, setVideoFilePath, videoStartTime} = useGlobalState({videoFile: true, videoStartTime: true});


  /**
   * Setup a polling function to continuously broadcast the video time to the whole application.
   * Invokes a backend Rust function which uses a global emitter whose payload is the current video time,
   * in seconds from the start of the video (0 sec is the start). This is not kept track of as part of global 
   * state.
   */
  useEffect(() => {
    const interval = setInterval(() => {
      if (videoRef.current) {
        const currentTime = videoRef.current.currentTime; // Get the current time

        // Check if current time has changed
        if (lastTime !== currentTime) {
          setLastTime(currentTime); // Update last time
          console.log(`Current Time: ${currentTime}`); // Log for debugging

          // Send current time to backend
          invoke('emit_video_time_change', { videoTime: currentTime });
        }
      }
    }, 500); // Poll every 500 milliseconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [lastTime]);
  


  return (
    <div className="container">

      {videoFilePath ? (
        <MediaController>
          <video
            ref={videoRef}
            slot="media"
            src={convertFileSrc(videoFilePath)}
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
        ) : (
          <Button onClick={() => selectVideoFile(setVideoFilePath)}>Select Video File (Video Player Button)</Button>
        )
      }
      {!videoStartTime && <VideoStartTimeForm/>}

    </div>
  );
}

export default VideoPlayer;
