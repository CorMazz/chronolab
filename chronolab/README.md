# Chronolab

Chronolab is an application that is designed to allow for visualization of lab video and lab data concurrently, as if you were in the lab live, day-of, watching video and data stream in on your screens.

## Design Decisions

### Frontend vs. Backend CSV Data Handling

Given the added complexity of having the backend handle all the data, it makes more sense to create a full Plotly figure with all the data that it needs and then simply change the axes bounds on that figure as the video changes. I can additionally add a [range slider](https://plotly.com/javascript/time-series/#time-series-with-rangeslider) to allow the user to more easily navigate through the full data of the plot. If I run into performance issues with the plot, I can look into [Plotly Resampler](https://github.com/predict-idlab/plotly-resampler) and implementing [tsdownsample](https://github.com/predict-idlab/tsdownsample) on my own. There should not be that big of a performance issue with implementing that, even if I have to serialize the DataFrame contents to JSON before sending them to the frontend, since the downsampling will greatly limit the size of the data being passed to the frontend.

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
8. 

## TODO

1. Add the -performance feature to Polars to make it faster (at the expense of compile time)
2. [Determine how to make Plotly faster](https://www.somesolvedproblems.com/2018/07/how-do-i-make-plotly-faster.html) before trying to implement downsampling

## Last Thing I Was Working On

Have the plot change it's x-axis based on the current time of the video.
