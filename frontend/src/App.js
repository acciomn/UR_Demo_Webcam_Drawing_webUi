// import React, { useState, useRef } from 'react';
// import axios from 'axios';
// import { 
//     AppBar, 
//     Toolbar, 
//     Typography, 
//     Container, 
//     Button, 
//     Grid, 
//     Box, 
//     Paper 
// } from '@mui/material';
// import Camera from './components/Camera';
// import DrawingCanvas from './components/DrawingCanvas'; // Assuming you have this component

// function App() {
//     const [image, setImage] = useState(null);
//     const [outline, setOutline] = useState(null); // State for the outline image
//     const webcamRef = useRef(null);

//     const handleCapture = async (capturedImage) => {
//         setImage(capturedImage);
//         try {
//             const response = await axios.post('/api/upload', { image: capturedImage });
//             setOutline(response.data.outline); // Assume the server returns an outline image URL
//             console.log('Image sent to server');
//         } catch (error) {
//             console.error('Error uploading image:', error);
//         }
//     };

//     const startCamera = () => {
//         console.log("Camera started");
//     };

//     const stopCamera = () => {
//         console.log("Camera stopped");
//     };

//     const loadImage = () => {
//         const input = document.createElement('input');
//         input.type = 'file';
//         input.accept = 'image/*';
//         input.onchange = (e) => {
//             const file = e.target.files[0];
//             const reader = new FileReader();
//             reader.onloadend = () => {
//                 setImage(reader.result); // Set the loaded image
//             };
//             if (file) {
//                 reader.readAsDataURL(file);
//             }
//         };
//         input.click(); // Trigger the file input
//     };

//     const processImage = () => {
//         console.log("Process image");
//     };

//     const saveImage = () => {
//         console.log("Save image");
//     };

//     const clearImage = () => {
//         setImage(null); // Clear the image state
//         setOutline(null); // Clear the outline state as well
//         console.log("Image cleared");
//     };

//     return (
//         <>
//             {/* App Bar */}
//             <AppBar position="static" color="primary">
//                 <Toolbar>
//                     <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
//                         UR Drawing Demo
//                     </Typography>
//                     <Button color="inherit">Help</Button>
//                     <Button color="inherit">Settings</Button>
//                 </Toolbar>
//             </AppBar>

//             {/* Main Content */}
//             <Container maxWidth="md" sx={{ mt: 4 }}>
//                 <Grid container spacing={3}>
//                     {/* Top Windows */}
//                     <Grid item xs={12} md={6}>
//                         <Paper elevation={3} sx={{ padding: 2 }}>
//                             <Camera onCapture={handleCapture} />
//                         </Paper>
//                     </Grid>
//                     <Grid item xs={12} md={6}>
//                         <Paper elevation={3} sx={{ padding: 2 }}>
//                             {image && (
//                                 <Box sx={{ textAlign: 'center' }}>
//                                     <img
//                                         src={image}
//                                         alt="Captured"
//                                         style={{ maxWidth: '100%', borderRadius: '8px' }}
//                                     />
//                                 </Box>
//                             )}
//                         </Paper>
//                     </Grid>

//                     {/* Bottom Window */}
//                     <Grid item xs={12}>
//                         <Paper elevation={3} sx={{ padding: 2 }}>
//                             {outline ? (
//                                 <Box sx={{ textAlign: 'center' }}>
//                                     <img
//                                         src={outline}
//                                         alt="Outline"
//                                         style={{ maxWidth: '100%', borderRadius: '8px' }}
//                                     />
//                                 </Box>
//                             ) : (
//                                 <Typography align="center">No outline image available.</Typography>
//                             )}
//                         </Paper>
//                     </Grid>

//                     {/* Action Buttons */}
//                     <Grid item xs={12}>
//                         <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
//                             <Button variant="contained" color="primary" onClick={startCamera}>Start Camera</Button>
//                             <Button variant="contained" color="secondary" onClick={stopCamera}>Stop Camera</Button>
//                             <Button variant="contained" color="primary" onClick={handleCapture}>Capture Image</Button>
//                             <Button variant="contained" color="secondary" onClick={loadImage}>Load Image</Button>
//                             <Button variant="contained" color="primary" onClick={processImage}>Process Image</Button>
//                             <Button variant="contained" color="secondary" onClick={saveImage}>Save</Button>
//                             <Button variant="outlined" color="primary" onClick={clearImage}>Clear</Button>
//                         </Box>
//                     </Grid>
//                 </Grid>
//             </Container>
//         </>
//     );
// }

// export default App;

import React, { useState } from 'react';
import axios from 'axios';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Container, 
    Button, 
    Grid, 
    Box, 
    Paper 
} from '@mui/material';

function App() {
    const [image, setImage] = useState(null);
    const [outline, setOutline] = useState(null); // State for the outline image

    const handleCapture = async (capturedImage) => {
        setImage(capturedImage); // Set captured image to state
        try {
            // Send image to backend for processing
            const response = await axios.post('/capture_image', { image: capturedImage });

            // Receive the outline image URL
            setOutline(response.data.outline); // Set outline image URL in state
            console.log('Image sent to server');
        } catch (error) {
            console.error('Error uploading image:', error);
        }
    };

    return (
        <>
            {/* App Bar */}
            <AppBar position="static" color="primary">
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                        UR Drawing Demo
                    </Typography>
                    <Button color="inherit">Help</Button>
                    <Button color="inherit">Settings</Button>
                </Toolbar>
            </AppBar>

            {/* Main Content */}
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                    {/* Top Windows */}
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ padding: 2 }}>
                            {/* Camera Component */}
                            <Button variant="contained" color="primary" onClick={handleCapture}>Capture Image</Button>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper elevation={3} sx={{ padding: 2 }}>
                            {/* Display captured image */}
                            {image && (
                                <Box sx={{ textAlign: 'center' }}>
                                    <img
                                        src={image}
                                        alt="Captured"
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                </Box>
                            )}
                        </Paper>
                    </Grid>

                    {/* Bottom Window for Outline */}
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ padding: 2 }}>
                            {/* Display the outline (SVG) */}
                            {outline ? (
                                <Box sx={{ textAlign: 'center' }}>
                                    <img
                                        src={outline} // This will display the outline (SVG image)
                                        alt="Outline"
                                        style={{ maxWidth: '100%', borderRadius: '8px' }}
                                    />
                                </Box>
                            ) : (
                                <Typography align="center">No outline image available.</Typography>
                            )}
                        </Paper>
                    </Grid>

                    {/* Action Buttons */}
                    <Grid item xs={12}>
                        <Box display="flex" justifyContent="center" flexWrap="wrap" gap={2} sx={{ mt: 2 }}>
                            <Button variant="contained" color="primary">Start Camera</Button>
                            <Button variant="contained" color="secondary">Stop Camera</Button>
                            <Button variant="contained" color="primary" onClick={handleCapture}>Capture Image</Button>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </>
    );
}

export default App;
