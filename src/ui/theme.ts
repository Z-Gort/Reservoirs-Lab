import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light', // Light mode
    primary: {
      main: '#4351ff', // Primary color
    },
    secondary: {
      main: '#000000', // Secondary color
      light: '#e3e3e3', // Sidebar color (uses `secondary.light`)
      dark: '#d6d6d6', // Header color (uses `secondary.dark`)
    },
    background: {
      default: '#ececec', // Main app background color
      paper: '#ffffff', // Background for surfaces like cards
    },
    info: {
      main: '#f5f5f5', // Footer color
    },
  },
  typography: {
    fontFamily: '"Noto Sans", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
  },
});

export default theme;