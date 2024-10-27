# Chronolab

Chronolab is an application that is designed to allow for visualization of lab video and lab data concurrently, as if you were in the lab live, day-of, watching video and data stream in on your screens.

## Proof-Of-Concept

The proof-of-concept release on GitHub works in the dev mode on Windows. You need to select the uneditted example dataset, and any random video. Start the dev build with `pnpm tauri dev`, click `load video` and select a video, click `load csv` and select a csv file, then open the plot. Press play on the video and the plot should move as the time in the video moves.

## Design Decisions

### Frontend vs. Backend CSV Data Handling

Given the added complexity of having the backend handle all the data, it makes more sense to create a full Plotly figure with all the data that it needs and then simply change the axes bounds on that figure as the video changes. I can additionally add a [range slider](https://plotly.com/javascript/time-series/#time-series-with-rangeslider) to allow the user to more easily navigate through the full data of the plot. If I run into performance issues with the plot, I can look into [Plotly Resampler](https://github.com/predict-idlab/plotly-resampler) and implementing [tsdownsample](https://github.com/predict-idlab/tsdownsample) on my own. There should not be that big of a performance issue with implementing that since the downsampling will greatly limit the size of the data being passed to the frontend.

### Frontend vs. Backend State

Following the principle of One Absolute Truth (OAT), I am going to design this such that the application state is maintained in the Rust backend and the React frontend sets up event listeners for state change. This will enable easier development of future save functionality, since I can serialize the Rust AppState struct, save it to a file, and then reload that to restart the app with the same settings that the user previously had. This will also limit potential mismatched state between the frontend and the backend, hopefully limiting bugs. This might take more developer effort though, since I am essentially bypassing React's state management.

#### Overall Architecture

This was implemented on the backend in the `/src-tauri/src/global_state.rs` file with a Rust struct and on the frontend in the `/src/hooks/useGlobalState.ts` file using a custom React hook. The custom React hook returns wrapped versions of standard React state modifying functions that first update the global state contained in the `global_state.rs` file, and then update the local state from the standard `useState()` React hook. The custom React hook also has a `useEffect` which places a listener on the container component that listens for the global events emitted by `global_state.rs` which indicate that a specific part of the global state has changed.

##### Frontend State Architecture

The frontend state utilizes custom hooks to enable toast messages to alert the user to any errors in updating the state. A hook which itself is a hook factory was created which returns hooks to get/listen to attributes on the global state.

##### Backend State Architecture

I want to try to ensure that the compiler enforces code correctness on the backend to reduce the chance of bugs caused by developer carelessness. The AppState struct will be composed of numerous substructs or single depth attributes. The single depth attributes will implement the newtype pattern to make the compiler enforce that two attributes which have the same primitive type are not mixed up. The set_field() and get_field() methods on the AppState struct will take in an AppStateField enum. This enum ensures that payloads from the frontend can be directly deserialized into the correct variant, and then the set_field() method can choose the correct location in AppState to store that data.

The newtype pattern prevents the type of issue we can see in the code sample here:

`AppStateField::IsModifiedSinceLastSave { value: bool } => self.is_multiwindow: bool = value`

Here, we as the developer accidentally assign `IsModifiedSinceLastSave` to the `self.is_multiwindow` field of the AppState struct, and the compiler lets us since they are both booleans. Adding newtypes for duplicate primitive types in our AppState struct prevents this.

### TimeZones

On both the backend and the frontend we shall ignore timezones, because I don't want to deal with them and the user probably doesn't either. All datetimes on the backend will be NaiveDateTimes, and on the frontend, timezones will be "naive" in that I will artificially coerce them to UTC using the date-fns-tz library.

### UI Framework

I spent probably an hour reading all the different Reddit posts about React UI frameworks, and tons of different reviews. After learning a plethora of novel insults, I decided that the community was as opinionated as they were divided on the issue. Given that this is a learning project and I've already learned TailwindCSS, I decided to try Material UI, which seemed to be a decent choice. I also tried Fluent UI, which I honestly liked the aesthetic better, but was fighting bugs for way too long and decided to pivot back to Material UI.

## Potential Features

1. **Configuration File Saving Current Layout/Application State (loaded files, video section labeling, etc)**
2. **IOI Noting**
   1. Have a dialog on the right side that allows the user to note items of interest and add a name/description of the event
   2. Allow the user to rapidly seek to that time in the event
   3. <https://hacks.mozilla.org/2014/08/building-interactive-html5-videos/>
3. **Video Section Labeling**
   1. Like how on YouTube you can hover over the video time bar and it will tell you what different sections there are
4. **Rust backend video editing**
   1. Load in separate video files and determine how to combine them and position them based on user GUI input
   2. Save the combined videos + data as a single video
5. **Add tsdownsample to downsample large traces and allow for quicker data visualization.**
6. **Add a callback to update the y-axis range when there is a rangeslider the same way that [this guy did it](https://github.com/plotly/plotly.js/issues/1876#issuecomment-1232030346).**
7. **Automatic video start time parsing**
   1. Search for anything resembling a datetime string in the video file name and use that as the video start time.
8. **Make Video React to Plot**
   1. If you click on a specific point at the plot, have the video scroll to that point.
9. **Add Frame by Frame Video Seeking**

## TODO

1. Add the -performance feature to Polars to make it faster (at the expense of compile time)
2. [Determine how to make Plotly faster](https://www.somesolvedproblems.com/2018/07/how-do-i-make-plotly-faster.html) before trying to implement downsampling
3. Deal with smoothing the Plotly relayout. Right now it is still choppy/buggy. Look into [easing functions](https://plotly.com/python/reference/layout/#layout-transition-easing)
4. Set isMultiwindow to false when the second window closes.
5. Determine if I need to switch the state to RwLock instead of Mutex
6. Attempt to cast all columns to numeric if they are not already. Flash to the user that certain columns were unable to be coerced to a numeric datatype. <https://docs.pola.rs/user-guide/expressions/casting/#strings>
7. Allow users to drag the plot window and the video window to different places.
8. Make the PlotSettings tell the user to select a CSV file if they haven't already, instead of just showing a blank screen.
9. When going to release, get all the CSP working.
10. Remove the allow inline-scripts CSP.

## Bugs

1. Unselecting a column in the PlotSettings after the plot has loaded those settings breaks stuff.
2. Selecting a new CSV file does not unload the old CSV file if one was already selected.
3. <https://github.com/react-grid-layout/react-grid-layout/pull/2043>

## Last Thing I Was Working On

Reimplement the second window functionality.
Add ability to dynamically resize plot and video. Also move the plot and video.
Add video fullscreen option.
Add toggle setting to choose whether plot should follow the video.
Add dark mode.
Add time range slider to choose how much time the plot should show when following the video.
Then keep working on plot functionality.
After that comes video IOI tagging.
