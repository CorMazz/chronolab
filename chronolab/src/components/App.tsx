import Controller from './Controller';
import VideoPlayer from './VideoPlayer';
import Plotter from './Plotter';
import useGlobalState from '../hooks/useGlobalState';

function App() {

  const {isMultiwindow} = useGlobalState();

  return (
    <div>
      <Controller/>
      <VideoPlayer/>
      {!isMultiwindow && <Plotter/>}
    </div>
  );
}

export default App;
