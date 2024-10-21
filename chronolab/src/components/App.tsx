import Menu from './Menu';
import VideoPlayer from './VideoPlayer';
import useGlobalState from '../hooks/useGlobalState';
import PlotSettings from './PlotSettings';
import Plotter from './Plotter';
import { Box, Container } from '@mui/material';

function App() {

  const {isMultiwindow, loadCsvSettings} = useGlobalState({
    csvFile: false,
    loadCsvSettings: true,
    videoFile: false,
    isMultiwindow: true,
});               

  return (
    <div>
      <Menu/>
      <VideoPlayer/>
      {!isMultiwindow && (loadCsvSettings ? (
          <Plotter/> 
        ) : ( 
          <Container sx={{ mt: 4}}>
            <Box sx={{ border: '1px solid #ccc', borderRadius: 2 }}> 
              <PlotSettings/>
            </Box>
          </Container>
        )
      )}
      
    </div>
  );
}

export default App;
