import { createTheme, ThemeOptions } from '@mui/material/styles';

const lightTheme: ThemeOptions = {
    palette: {
      mode: 'light',
      primary: {
        main: '#5e35b1',      // Deep purple
        light: '#7e57c2',     // Lighter purple for hover states
        dark: '#4527a0',      // Darker purple for active states
      },
      secondary: {
        main: '#00897b',      // Teal as a complementary color
        light: '#4ebaaa',
        dark: '#005b4f',
      },
      background: {
        default: '#ffffff',
        paper: '#f5f5f5',
      },
    },
  };

// Dark theme configuration
const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
      light: '#e3f2fd',
      dark: '#42a5f5',
    },
    secondary: {
      main: '#ce93d8',
      light: '#f3e5f5',
      dark: '#ab47bc',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
};

// Theme creation function
function createAppTheme(mode: 'light' | 'dark') {
  return createTheme(mode === 'light' ? lightTheme : darkTheme);
}

export { createAppTheme };