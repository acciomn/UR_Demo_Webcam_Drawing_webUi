/* global cv */
import React, { useState, useRef, useEffect, useCallback } from "react";
import axios from "axios";
import Webcam from "react-webcam";
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Slider,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Switch,
  FormControlLabel,
} from "@mui/material";
import { createCustomTheme } from './theme'; // Import the theme function
import { ThemeProvider, useTheme } from '@mui/material/styles';

function App() {
  const [sensitivity, setSensitivity] = useState(50);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processedCapturedImage, setProcessedCapturedImage] = useState(null); // Background removed + edges
  const [bgRemovedImage, setBgRemovedImage] = useState(null); // Background-removed only (for preview)
  const [cvReady, setCvReady] = useState(false); // Track OpenCV.js readiness
  const [showFileInput, setShowFileInput] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // State for dark mode toggle

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Create theme based on dark mode state
  const theme = createCustomTheme(darkMode ? 'dark' : 'light');

  // Check if OpenCV.js is fully loaded and functional
  useEffect(() => {
    const checkCvLoaded = () => {
      if (
        window.cvReady &&
        typeof window.cv === "object" &&
        typeof window.cv.matFromImageData === "function"
      ) {
        setCvReady(true);
        console.log("OpenCV.js is ready with matFromImageData");
      } else if (Date.now() - startTime > 30000) { // 30-second timeout
        console.error("Timeout waiting for OpenCV.js to load");
        alert("Failed to load OpenCV.js. Check network and console for errors.");
      } else {
        console.log("Waiting for OpenCV.js or matFromImageData...");
        setTimeout(checkCvLoaded, 100);
      }
    };
    const startTime = Date.now();
    checkCvLoaded();
  }, []);

  // Real-time edge detection on live feed (no background removal here for performance)
  const processFrame = useCallback(() => {
    if (
      !cvReady ||
      !webcamRef.current ||
      !webcamRef.current.video ||
      !canvasRef.current
    ) {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    try {
      const src = cv.matFromImageData(imageData);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      const edges = new cv.Mat();
      const lower = sensitivity;
      const upper = sensitivity * 2;
      cv.Canny(gray, edges, lower, upper);

      const dst = new cv.Mat();
      cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA, 0);
      const processedImageData = new ImageData(
        new Uint8ClampedArray(dst.data),
        dst.cols,
        dst.rows
      );
      ctx.putImageData(processedImageData, 0, 0);

      src.delete();
      gray.delete();
      edges.delete();
      dst.delete();
    } catch (e) {
      console.error("Error in processFrame:", e);
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [sensitivity, cvReady]);

  useEffect(() => {
    if (!cvReady) return;

    const checkVideoReady = setInterval(() => {
      if (
        webcamRef.current &&
        webcamRef.current.video &&
        webcamRef.current.video.readyState === 4
      ) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        animationRef.current = requestAnimationFrame(processFrame);
        clearInterval(checkVideoReady);
      }
    }, 500);

    return () => {
      clearInterval(checkVideoReady);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [processFrame, cvReady]);

  // Process captured/uploaded image with background removal and edge detection (front-end preview)
  useEffect(() => {
    if (!cvReady || !capturedImage) {
      setBgRemovedImage(null);
      setProcessedCapturedImage(null);
      return;
    }
    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      try {
        // Convert to OpenCV Mat
        const src = cv.matFromImageData(imageData);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

        // Simple background removal (threshold-based, as a placeholder)
        const thresh = new cv.Mat();
        cv.threshold(gray, thresh, 100, 255, cv.THRESH_BINARY_INV); // Adjust threshold as needed
        const bgRemoved = new cv.Mat();
        cv.bitwise_and(src, src, bgRemoved, thresh);

        // Convert back to ImageData for preview
        const bgRemovedData = new ImageData(
          new Uint8ClampedArray(bgRemoved.data),
          bgRemoved.cols,
          bgRemoved.rows
        );
        const bgRemovedCanvas = document.createElement("canvas");
        bgRemovedCanvas.width = bgRemoved.cols;
        bgRemovedCanvas.height = bgRemoved.rows;
        bgRemovedCanvas.getContext("2d").putImageData(bgRemovedData, 0, 0);
        const bgRemovedBase64 = bgRemovedCanvas.toDataURL();
        setBgRemovedImage(bgRemovedBase64);

        // Apply edge detection on background-removed image
        const edges = new cv.Mat();
        cv.Canny(gray, edges, sensitivity, sensitivity * 2);

        const dst = new cv.Mat();
        cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA, 0);
        const processedImageData = new ImageData(
          new Uint8ClampedArray(dst.data),
          dst.cols,
          dst.rows
        );

        const outCanvas = document.createElement("canvas");
        outCanvas.width = dst.cols;
        outCanvas.height = dst.rows;
        outCanvas.getContext("2d").putImageData(processedImageData, 0, 0);
        const processedBase64 = outCanvas.toDataURL();

        setProcessedCapturedImage(processedBase64);

        src.delete();
        gray.delete();
        thresh.delete();
        bgRemoved.delete();
        edges.delete();
        dst.delete();
      } catch (e) {
        console.error("Error processing captured image:", e);
      }
    };
  }, [capturedImage, sensitivity, cvReady]);

  const handleCaptureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      }
    }
  };

  const handleLoadImageClick = () => {
    setShowFileInput(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!capturedImage) {
      alert("No image captured or uploaded to save.");
      return;
    }
  
    try {
      console.log("Sending image to backend:", capturedImage.substring(0, 50) + "..."); // Log first 50 chars of base64
      const response = await axios.post("http://localhost:3000/api/process_image", {
        image: capturedImage, // Send the original image to backend for full processing
        sensitivity,
      });
  
      console.log("Backend response:", response.data);
      alert("Image processed successfully!");
      console.log("Original Image:", response.data.original);
      console.log("Background Removed (Adjusted PNG):", response.data.adjusted);
      console.log("SVG File:", response.data.svg);
      console.log("GCode File:", response.data.gcode);
    } catch (error) {
      console.error("Error saving image:", {
        message: error.response?.data?.message || error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      alert("An error occurred while saving the file: " + (error.response?.data?.message || error.message));
    }
  };

  const handleProcessEdges = async () => {
    if (!capturedImage) {
      alert("No image captured or uploaded to process.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:3000/api/process_final", {
        image: capturedImage,
        sensitivity,
      });

      console.log("Backend response:", response.data);
      alert("Edges processed successfully!");
      console.log("Edge Detected:", response.data.edges);
    } catch (error) {
      console.error("Error processing edges:", error.response?.data || error.message);
      alert("An error occurred while processing edges: " + (error.response?.data?.message || error.message));
    }
  };

  const handleExit = () => {
    alert("Exit functionality not implemented.");
  };

  const clearImage = () => {
    setCapturedImage(null);
    setBgRemovedImage(null);
    setProcessedCapturedImage(null);
    alert("All images cleared successfully!");
  };

  if (!cvReady) {
    return (
      <Container>
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Loading OpenCV.js...
        </Typography>
      </Container>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      {showFileInput && (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      )}

      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Real-Time Edge Detection Demo
          </Typography>
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />}
            label={darkMode ? "Dark Mode" : "Light Mode"}
            sx={{ marginRight: 2 }}
          />
          <Button color="inherit" onClick={() => setHelpOpen(true)}>
            Help
          </Button>
          <Button color="inherit" onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={2}>
          {/* Slider */}
          <Grid item xs={12} md={3}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography align="center" variant="h6">
                Adjust Edge Detection
              </Typography>
              <Slider
                orientation="vertical"
                value={sensitivity}
                onChange={(e, value) => setSensitivity(value)}
                step={1}
                min={1}
                max={100}
                valueLabelDisplay="auto"
                sx={{ height: 300, mx: "auto" }}
              />
            </Paper>
          </Grid>

          {/* Middle and Right Panels */}
          <Grid item xs={12} md={9}>
            <Grid container spacing={2}>
              {/* Live Camera Feed */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={250}
                    height={200}
                    videoConstraints={{ facingMode: "user" }}
                  />
                  <Typography variant="body1">Live Camera Feed</Typography>
                </Paper>
              </Grid>

              {/* Captured/Uploaded Image and Processed */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                  {capturedImage ? (
                    <div>
                      <img
                        src={capturedImage}
                        alt="Captured/Uploaded"
                        style={{ maxWidth: "100%", borderRadius: "8px" }}
                      />
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        Captured/Uploaded Image
                      </Typography>
                      {bgRemovedImage && (
                        <>
                          <img
                            src={bgRemovedImage}
                            alt="Background Removed"
                            style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }}
                          />
                          <Typography variant="body1">Background Removed (Front-end Preview)</Typography>
                        </>
                      )}
                      {processedCapturedImage && (
                        <>
                          <img
                            src={processedCapturedImage}
                            alt="Processed Edges"
                            style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }}
                          />
                          <Typography variant="body1">
                            Processed Edges (Front-end Preview)
                          </Typography>
                        </>
                      )}
                    </div>
                  ) : (
                    <Typography align="center">
                      No image captured or uploaded yet.
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Processed (Edges) of Live Feed */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                  <canvas ref={canvasRef} style={{ maxWidth: "100%" }} />
                  <Typography variant="body1">
                    Processed (Edges) View (Live Feed)
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleCaptureImage}
            sx={{ m: 1 }}
          >
            Capture Image
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleLoadImageClick}
            sx={{ m: 1 }}
          >
            Load Image
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSave}
            sx={{ m: 1 }}
          >
            Save (Full Pipeline)
          </Button>
          <Button
            variant="contained"
            color="info"
            onClick={handleProcessEdges}
            sx={{ m: 1 }}
          >
            Process Edges
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleExit}
            sx={{ m: 1 }}
          >
            Exit
          </Button>
          <Button
            variant="contained"
            color="warning"
            onClick={clearImage}
            sx={{ m: 1 }}
          >
            Clear
          </Button>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography>
            Adjust the slider to change edge detection thresholds in real-time for both the live feed and captured/uploaded image preview. 
            "Save" runs the full backend pipeline (original PNG, background removal + edges in adjusted PNG, SVG, GCode). 
            "Process Edges" only performs edge detection on the backend.
          </Typography>
        </Box>
      </Container>

      {/* Settings Modal */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
        <DialogTitle>Settings</DialogTitle>
        <DialogContent>
          <Typography>Additional configuration options will go here.</Typography>
        </DialogContent>
      </Dialog>

      {/* Help Modal */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)}>
        <DialogTitle>Help</DialogTitle>
        <DialogContent>
          <Typography>Instructions:</Typography>
          <ul>
            <li>Use the slider to adjust edge detection sensitivity in real-time.</li>
            <li>Click "Capture Image" to snapshot from the live feed.</li>
            <li>Click "Load Image" to upload your own image.</li>
            <li>Both captured/uploaded image and live feed show edge results (front-end).</li>
            <li>
              Click "Save" to run the full pipeline on the backend (original PNG, background-removed + edges PNG, SVG, GCode).
            </li>
            <li>
              Click "Process Edges" to only perform edge detection on the backend.
            </li>
            <li>"Exit" is a placeholder.</li>
            <li>"Clear" removes the captured/uploaded image.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}

export default App;