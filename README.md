# Chronolab

Chronolab is an application that is designed to allow for visualization of lab video and lab data concurrently, as if you were in the lab live, day-of, watching video and data stream in on your screens.

## MVP Release Demo

The MVP release build is a working minimum viable product of Chronolab.

https://github.com/user-attachments/assets/ee338210-2bcf-422e-b87b-5cc40037a432

[Video](https://www.youtube.com/watch?v=VLpClJHT9bQ) and [data](https://www.kaggle.com/datasets/ecoco2/household-appliances-power-consumption) used in the demo.

## Contributing

This is an open-source tool, intended to be used and collaborated on with others. Here are instructions on how to continue development of this tool.

### Development Environment

#### Linux

This application was originally intended to be developed within a Linux Dev Container. However, there is [a bug](https://github.com/tauri-apps/tauri/issues/3725) that prevents loading and playing videos on Linux. To bypass this, development was continued on Windows. Development would probably also work on MacOS.

### Developer Install

1. Install pnpm and Rust v1.81 on your computer.
2. Clone this repository into a directory.
3. Navigate to the `chronolab` directory and run `pnpm install` to add all the packages.
4. Run `pnpm tauri dev` to create hot-updating development runtime.
5. Run `pnpm tauri build` to create Windows executables for the application.

### Developer Tools

The only developer tools utilized in creating this application are the [React Developer Tools](https://react.dev/learn/react-developer-tools). They were installed via `pnpm` and can be initialized with `npx react-devtools` in a Powershell Prompt window.

## TODO

1. Add the -performance feature to Polars to make it faster (at the expense of compile time)
2. Set isMultiwindow to false when the second window closes.
3. Determine if I need to switch the state to RwLock instead of Mutex
4. Attempt to cast all columns to numeric if they are not already. Flash to the user that certain columns were unable to be coerced to a numeric datatype. <https://docs.pola.rs/user-guide/expressions/casting/#strings>
5. Allow users to drag the plot window and the video window to different places.
6. Make the PlotSettings tell the user to select a CSV file if they haven't already, instead of just showing a blank screen.
7. When going to release, get all the CSP working.
8. Remove the allow inline-scripts CSP.
9. Change the application icon from the Tauri icon.

### Bugs

1. Unselecting a column in the PlotSettings after the plot has loaded those settings breaks stuff.
2. Selecting a new CSV file does not unload the old CSV file if one was already selected.
3. <https://github.com/react-grid-layout/react-grid-layout/pull/2043>
4. After adding Apache Echarts I can no longer resize the individual plot and video windows.
   1. The Apache EChart will not resize if the application window is resized by clicking the expand button, but if it's dragged it works
5. Too many traces on the plot will cause the legend to overflow
6. There are issues with the plot and dark/light mode compatibility and text visibility

### Last Thing I Was Working On

Reimplement the second window functionality.
After that comes video IOI tagging.

## Design Decisions

These design decisions were written in the first-person as they were my (CorMazz) original thoughts as I was creating the application.

### Frontend vs. Backend CSV Data Handling

Originally I had the backend load the CSV using Polars and send it to the frontend using an IPC buffer. This was because I wanted to have the data on the backend so that I could use [tsdownsample](https://github.com/predict-idlab/tsdownsample) to mimic the functionality of [Plotly Resampler](https://github.com/predict-idlab/plotly-resampler) when I was using Plotly. This became a vestigial design decision after pivoting to Apache ECharts, since that plotting library already enables downsampling. Thus, depending on the performance of JS .csv parsers (assuming they exist), it might make sense to redesign this application to completely handle the CSV data on the front end.  

### Frontend vs. Backend State

Following the principle of One Absolute Truth (OAT), I am going to design this such that the application state is maintained in the Rust backend and the React frontend sets up event listeners for state change. This will enable easier development of future save functionality, since I can serialize the Rust AppState struct, save it to a file, and then reload that to restart the app with the same settings that the user previously had. This will also limit potential mismatched state between the frontend and the backend, hopefully limiting bugs. This might take more developer effort though, since I am essentially bypassing React's state management.

#### Overall Architecture

This was implemented on the backend in the `/src-tauri/src/global_state.rs` file with a Rust struct and on the frontend in the `/src/hooks/useGlobalState.ts` file using a custom React hook. The custom React hook returns wrapped versions of standard React state modifying functions that first update the global state contained in the `global_state.rs` file, and then update the local state from the standard `useState()` React hook. The custom React hook also has a `useEffect` which places a listener on the container component that listens for the global events emitted by `global_state.rs` which indicate that a specific part of the global state has changed.

##### Frontend State Architecture

The frontend state utilizes custom hooks to enable toast messages to alert the user to any errors in updating the state. A hook which itself is a hook factory was created which returns hooks to get/listen to attributes on the global state.

##### Backend State Architecture

I want to try to ensure that the compiler enforces code correctness on the backend to reduce the chance of bugs caused by developer carelessness. The AppState struct will be composed of numerous substructs or single depth attributes. The single depth attributes will implement the newtype pattern to make the compiler enforce that two attributes which have the same primitive type are not mixed up. The set_field() and get_field() methods on the AppState struct will take in an AppStateField enum. This enum ensures that payloads from the frontend can be directly deserialized into the correct variant, and then the set_field() method can choose the correct location in AppState to store that data.

The newtype pattern prevents the type of issue we can see in the code sample below, which is intended to set the IsModifiedSinceLastSave field on the AppState.

`AppStateField::IsModifiedSinceLastSave { value: bool } => self.is_multiwindow: bool = value`

Here, we as the developer accidentally assign `IsModifiedSinceLastSave` to the `self.is_multiwindow` field of the AppState struct, and the compiler lets us since the primitive type for both IsModifiedSinceLastSave and IsMultiwindow is a boolean. Adding newtypes for duplicate primitive types in our AppState struct prevents this.

### TimeZones

On both the backend and the frontend we shall ignore timezones, because I don't want to deal with them and the user probably doesn't either. All datetimes on the backend will be NaiveDateTimes, and on the frontend, timezones will be "naive" in that I will artificially coerce them to UTC using the date-fns-tz library.

### UI Framework

I spent probably an hour reading all the different Reddit posts about React UI frameworks, and tons of different reviews. After learning a plethora of novel insults, I decided that the community was as opinionated as they were divided on the issue. Given that this is a learning project and I've already learned TailwindCSS, I decided to try Material UI, which seemed to be a decent choice. I also tried Fluent UI, which I honestly liked the aesthetic better, but was fighting bugs for way too long and decided to pivot back to Material UI.

### Plotting Library

I originally wanted to use Ploty, but I ran into [a bug](https://community.plotly.com/t/webgl-is-not-supported-by-your-browser-for-scatter3d-on-safari-13-3-1-and-chrome-83-0-4103-106/41469) that stymied all of my forward progress. I pivoted to [Apache ECharts](https://dev.to/manufac/using-apache-echarts-with-react-and-typescript-353k) because it can handle large datasets and has better interactivity than Plotly. In Apache Echarts, downsampling is already included, so I won't have to include that myself. The x-axis range slider also works, and I was able to implement the functionality there that I wanted. Pivoting to Apache ECharts was an excellent decision and saved me a lot of pain from Plotly.

## Features

### Implemented Features

1. **Configuration File Saving Current Layout/Application State (loaded files, video section labeling, etc)**
2. **Dynamic Video Data Downsampling**
   1. This is included out-of-the-box with Apache ECharts with the sampling parameter. Keep an eye out for a [better sampling algorithm](https://github.com/apache/echarts/issues/20422) that they may implement.
3. **Add a Dynamic Rangeslider on the Plot to See All Available Data**
   1. Again, this is included out-of-the-box with Apache ECharts dataZooms.

### Potential Features

1. **IOI Noting**
   1. Have a dialog on the right side that allows the user to note items of interest and add a name/description of the event
   2. Allow the user to rapidly seek to that time in the event
   3. <https://hacks.mozilla.org/2014/08/building-interactive-html5-videos/>
2. **Video Section Labeling**
   1. Like how on YouTube you can hover over the video time bar and it will tell you what different sections there are
3. **Rust Backend Video Editing**
   1. Load in separate video files and determine how to combine them and position them based on user GUI input
   2. Save the combined videos + data as a single video
4. **Automatic Video Start Time Parsing**
   1. Search for anything resembling a datetime string in the video file name and use that as the video start time
5. **Make Video React to Plot**
   1. If you click on a specific point at the plot, have the video scroll to that point
6. **Add Frame by Frame Video Seeking**
   1. This can be done by changing the amount of time that the `skip-right` button on the video player skips by
