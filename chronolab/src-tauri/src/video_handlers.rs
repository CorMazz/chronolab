use tauri::{AppHandle, Emitter};

/// This gets called by the video component when the video time has updated. The video is constantly polled to determine the current video time
/// If the time has changed, this function is invoked on the front end. We will use a global emitter here since the Plotter component may be on a
/// different window, so we need to be able to communicate with it regardless. The video time is delivered as a time in seconds from the beginning
/// of the video.
#[tauri::command]
pub async fn emit_video_time_change(app: AppHandle, video_time: f64) -> Result<(), String> {
    app.emit("video-time-change", video_time)
        .map_err(|e| format!("Failed to emit event: {:?}", e))
}
