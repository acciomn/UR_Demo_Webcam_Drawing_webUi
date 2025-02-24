import { createTheme } from '@mui/material/styles';

const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode palette
          primary: {
            main: '#1976d2', // Blue
          },
          secondary: {
            main: '#dc004e', // Red
          },
          background: {
            default: '#f4f6f8', // Light gray
            paper: '#ffffff', // White for cards/dialogs
          },
          text: {
            primary: '#171717', // Dark text
            secondary: '#555555', // Gray text
          },
        }
      : {
          // Dark mode palette
          primary: {
            main: '#90caf9', // Lighter blue for better contrast
          },
          secondary: {
            main: '#f48fb1', // Lighter red for contrast
          },
          background: {
            default: '#1a1a1a', // Dark gray
            paper: '#2d2d2d', // Slightly lighter dark for cards/dialogs
          },
          text: {
            primary: '#e0e0e0', // Light text
            secondary: '#b0b0b0', // Gray text
          },
        }),
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Rounded buttons
        },
      },
    },
  },
});

export const createCustomTheme = (mode) => createTheme(getDesignTokens(mode));