import Plot from 'react-plotly.js';

function Plotter() {
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
      </div>
    );
  }
  
  export default Plotter;
  