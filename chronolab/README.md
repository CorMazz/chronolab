# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Potential Features

1. Configuration File Saving Current Layout/Application State (loaded files, video section labeling, etc)
2. IOI Noting
   1. Have a dialog on the right side that allows the user to note items of interest and add a name/description of the event
   2. Allow the user to rapidly seek to that time in the event
3. Video Section Labeling
   1. Like how on YouTube you can hover over the video time bar and it will tell you what different sections there are
4. Rust backend video editing
   1. Load in separate video files and determine how to combine them and position them based on user GUI input
   2. Save the combined videos + data as a single video
5. Add tsdownsample to downsample large traces and allow for quicker data visualization.

## TODO

1. Use an [array buffer](https://v2.tauri.app/develop/calling-rust/#returning-array-buffers) to transfer data to the frontend from Polars when requested
2. Add the -performance feature to Polars to make it faster (at the expense of compile time)

## Last Thing I Was Working On
