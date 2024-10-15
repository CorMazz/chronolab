# Chronolab

Chronolab is an application that is designed to allow for visualization of lab video and lab data concurrently, as if you were in the lab live, day-of, watching video and data stream in on your screens.

## Proof-Of-Concept

The proof-of-concept release on GitHub works in the dev mode on Windows. You need to select the uneditted example dataset, and any random video. Start the dev build with `pnpm tauri dev`, click `load video` and select a video, click `load csv` and select a csv file, then open the plot. Press play on the video and the plot should move as the time in the video moves.

## Design Decisions

### Frontend vs. Backend CSV Data Handling

Given the added complexity of having the backend handle all the data, it makes more sense to create a full Plotly figure with all the data that it needs and then simply change the axes bounds on that figure as the video changes. I can additionally add a [range slider](https://plotly.com/javascript/time-series/#time-series-with-rangeslider) to allow the user to more easily navigate through the full data of the plot. If I run into performance issues with the plot, I can look into [Plotly Resampler](https://github.com/predict-idlab/plotly-resampler) and implementing [tsdownsample](https://github.com/predict-idlab/tsdownsample) on my own. There should not be that big of a performance issue with implementing that since the downsampling will greatly limit the size of the data being passed to the frontend.

### Frontend vs. Backend State

Following the principle of One Absolute Truth (OAT), I am going to design this such that the application state is maintained in the Rust backend and the React frontend sets up event listeners for state change. This will enable easier development of future save functionality, since I can serialize the Rust AppState struct, save it to a file, and then reload that to restart the app with the same settings that the user previously had. This will also limit potential mismatched state between the frontend and the backend, hopefully limiting bugs. This might take more developer effort though, since I am essentially bypassing React's state management.

#### Architecture

This was implemented on the backend in the `/src-tauri/src/global_state.rs` file with a Rust struct and on the frontend in the `/src/hooks/useGlobalState.ts` file using a custom React hook. The custom React hook returns wrapped versions of standard React state modifying functions that first update the global state contained in the `global_state.rs` file, and then update the local state from the standard `useState()` React hook. The custom React hook also has a `useEffect` which places a listener on the container component that listens for the global events emitted by `global_state.rs` which indicate that a specific part of the global state has changed.

## Potential Features

1. **Configuration File Saving Current Layout/Application State (loaded files, video section labeling, etc)**
2. **IOI Noting**
   1. Have a dialog on the right side that allows the user to note items of interest and add a name/description of the event
   2. Allow the user to rapidly seek to that time in the event
3. **Video Section Labeling**
   1. Like how on YouTube you can hover over the video time bar and it will tell you what different sections there are
4. **Rust backend video editing**
   1. Load in separate video files and determine how to combine them and position them based on user GUI input
   2. Save the combined videos + data as a single video
5. **Add tsdownsample to downsample large traces and allow for quicker data visualization.**
6. **Add a callback to update the y-axis range when there is a rangeslider the same way that [this guy did it](https://github.com/plotly/plotly.js/issues/1876#issuecomment-1232030346).**
7. **Automatic video start time parsing**
   1. Search for anything resembling a datetime string in the video file name and use that as the video start time.

## TODO

1. Add the -performance feature to Polars to make it faster (at the expense of compile time)
2. [Determine how to make Plotly faster](https://www.somesolvedproblems.com/2018/07/how-do-i-make-plotly-faster.html) before trying to implement downsampling
3. Deal with smoothing the Plotly relayout. Right now it is still choppy/buggy. Look into [easing functions](https://plotly.com/python/reference/layout/#layout-transition-easing)
4. Add Tailwind and start making this thing pretty.

## Last Thing I Was Working On

Global state and refactoring has now been successfully implemented. Now it is time to start expanding on the plot state by adding more user fed details about the DataFrame to load, such as what the time column is, if the time column is sorted, what other columns we want to load and plot, etc.

Pretty soon it is time to add tailwind and make this thing pretty.

