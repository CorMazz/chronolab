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
import { Container, Button, Box, Typography, TextField } from '@mui/material';
import useGlobalState from "../hooks/useGlobalState";
import { selectVideoFile } from "../utils/fileSelectors";
import {z} from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { parseJSON } from "date-fns";

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
            {/* Video Start Time */}
            <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                    Input the Video Start Time
                </Typography>
                <TextField
                    fullWidth
                    id="video_start_time"
                    label="Video Start Time"
                    type="datetime-local"
                    slotProps={{
                      htmlInput: {step: "1"},
                      inputLabel: {shrink: true},
                    }}
                    {...register("video_start_time")}
                    error={!!errors.video_start_time}
                    helperText={errors.video_start_time ? errors.video_start_time.message : ""}
                />
            </Box>

            {/* Submit Button */}
            <Box textAlign="center" mt={2}>
                <Button variant="contained" color="primary" type="submit">
                    Submit
                </Button>
            </Box>
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
  


  return  (
    <Container>
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                mt: 4, 
                p: 2, 
                border: '1px solid #ccc', 
                borderRadius: 2 
            }}
        >
            {videoFilePath ? (
                <Box    
                  sx={{
                    width: '100%',
                    height: "fit-content",
                    borderRadius: 2, // 8px rounded corners
                    overflow: 'hidden', // Clips the video content to match the border radius
                    border: '2px solid', // Optional border
                    borderColor: 'primary.main', // Border color using theme's primary color
                    boxShadow: 3, // Box shadow for elevation effect
                }}>
                    <MediaController>
                        <video
                            ref={videoRef}
                            slot="media"
                            src={convertFileSrc(videoFilePath)}
                            preload="auto"
                            muted
                            crossOrigin=""
                            style={{ width: '100%', borderRadius: 8 }}
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
                </Box>
            ) : (
                <Box textAlign="center">
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        No video file selected
                    </Typography>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={() => selectVideoFile(setVideoFilePath)}
                    >
                        Select Video File
                    </Button>
                </Box>
            )}

            {!videoStartTime && (
                <Box mt={4} width="100%">
                    <VideoStartTimeForm />
                </Box>
            )}
        </Box>
    </Container>
  );
}

export default VideoPlayer;
