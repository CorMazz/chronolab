import { useState } from 'react';
import Plot from 'react-plotly.js';
import { invoke } from "@tauri-apps/api/core";

function Plotter() {

  async function getDataFrame() {
    invoke('get_csv_data').then((serialized_df) => console.log(serialized_df));
  }

  // const [plotData, setPlotData] = useState<any[]>([]);

  // // Function to select CSV and process the DataFrame
  // async function handleCSVFile() {
  //   const file = await open({ multiple: false, directory: false });
  //   if (file) {
  //     // Invoke the Rust backend to process the DataFrame
  //     const data = await invoke('process_dataframe', { path: file }) as string;
  //     const jsonData = JSON.parse(data);

  //     // Process the data to fit Plotly's format
  //     const trace = {
  //       x: jsonData['column_name'],  // Specify the appropriate column names
  //       y: jsonData['another_column'],
  //       type: 'scatter',
  //       mode: 'lines+markers',
  //       marker: { color: 'red' },
  //     };

  //     setPlotData([trace]);
  //   }


    return (
      <div className="container">
        <Plot
        data={[
          {
            x: [1, 2, 3],
            y: [2, 6, 3],
            type: 'scatter',
            mode: 'lines+markers',
            marker: {color: 'red'},
          },
          {type: 'bar', x: [1, 2, 3], y: [2, 5, 3]},
        ]}
        layout={ {width: 800, height: 600, title: 'A Fancy Plot'} }
        />

        <button onClick={getDataFrame}>Get Data</button>

      </div>
    );
  }
  
  export default Plotter;
  