import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '@mui/material/styles';
import { createCustomTheme } from './theme'; // Import the theme function

// Default to light mode initially
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <ThemeProvider theme={createCustomTheme('light')}>
        <App />
    </ThemeProvider>
);