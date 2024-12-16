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
  DialogContent
} from "@mui/material";

function App() {
  const [sensitivity, setSensitivity] = useState(50); 
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sliderValue, setSliderValue] = useState(50); // Default slider value to 50
  const [capturedImage, setCapturedImage] = useState(null); 
  const [processedCapturedImage, setProcessedCapturedImage] = useState(null);

  const [showFileInput, setShowFileInput] = useState(false);
  const fileInputRef = useRef(null);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Real-time edge detection on live feed
  const processFrame = useCallback(() => {
    if (!webcamRef.current || !webcamRef.current.video || !canvasRef.current || typeof cv === 'undefined') {
      animationRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    const src = cv.matFromImageData(imageData);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

    const edges = new cv.Mat();
    const lower = sensitivity;
    const upper = sensitivity * 2; 
    cv.Canny(gray, edges, lower, upper);

    const dst = new cv.Mat();
    cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA, 0);
    const processedImageData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);
    ctx.putImageData(processedImageData, 0, 0);

    src.delete();
    gray.delete();
    edges.delete();
    dst.delete();

    animationRef.current = requestAnimationFrame(processFrame);
  }, [sensitivity]);

  useEffect(() => {
    const checkVideoReady = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
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
  }, [processFrame]);

  // Process captured/uploaded image with the given sensitivity (front-end only)
  useEffect(() => {
    if (!capturedImage || typeof cv === 'undefined') {
      setProcessedCapturedImage(null);
      return;
    }
    const img = new Image();
    img.src = capturedImage;
    img.onload = () => {
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, img.width, img.height);

      const src = cv.matFromImageData(imageData);
      const gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);

      const edges = new cv.Mat();
      cv.Canny(gray, edges, sensitivity, sensitivity * 2);

      const dst = new cv.Mat();
      cv.cvtColor(edges, dst, cv.COLOR_GRAY2RGBA, 0);
      const processedImageData = new ImageData(new Uint8ClampedArray(dst.data), dst.cols, dst.rows);

      const outCanvas = document.createElement('canvas');
      outCanvas.width = dst.cols;
      outCanvas.height = dst.rows;
      outCanvas.getContext('2d').putImageData(processedImageData, 0, 0);
      const processedBase64 = outCanvas.toDataURL();

      setProcessedCapturedImage(processedBase64);

      src.delete();
      gray.delete();
      edges.delete();
      dst.delete();
    };
  }, [capturedImage, sensitivity]);

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
      alert("No image captured to save.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:3000/api/process_image", {
        image: capturedImage,
        sensitivity: sliderValue,
      });
  
      console.log("Backend response:", response.data);
      alert("Image processed successfully!");
      console.log("Processed Image:", response.data.processedImagePath);
      console.log("SVG File:", response.data.svgImagePath);
    } catch (error) {
      console.error("Error saving image:", error.response?.data || error.message);
      alert("An error occurred while saving the file.");
    }
  };
  
  

  const handleExit = () => {
    alert("Exit functionality not implemented.");
  };

  const clearImage = () => {
    setCapturedImage(null);
    setProcessedCapturedImage(null);
    alert("All images cleared successfully!");
  };

  return (
    <>
      {showFileInput && (
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      )}

      <AppBar position="static" color="primary">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Real-Time Edge Detection Demo
          </Typography>
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
                      <img src={capturedImage} alt="Captured/Uploaded" style={{ maxWidth: "100%", borderRadius: "8px" }} />
                      <Typography variant="body1" sx={{ mt: 1 }}>Captured/Uploaded Image</Typography>
                      {processedCapturedImage && (
                        <>
                          <img src={processedCapturedImage} alt="Processed Edges" style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px" }} />
                          <Typography variant="body1">Processed Edges (front-end preview)</Typography>
                        </>
                      )}
                    </div>
                  ) : (
                    <Typography align="center">No image captured or uploaded yet.</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Processed (Edges) of Live Feed */}
              <Grid item xs={12} md={4}>
                <Paper elevation={3} sx={{ p: 2, textAlign: "center" }}>
                  <canvas ref={canvasRef} style={{ maxWidth: "100%" }} />
                  <Typography variant="body1">Processed (Edges) View (Live Feed)</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button variant="contained" color="secondary" onClick={handleCaptureImage} sx={{ m: 1 }}>
            Capture Image
          </Button>
          <Button variant="contained" color="success" onClick={handleLoadImageClick} sx={{ m: 1 }}>
            Load Image
          </Button>
          <Button variant="contained" color="primary" onClick={handleSave} sx={{ m: 1 }}>
            Save
          </Button>
          <Button variant="contained" color="error" onClick={handleExit} sx={{ m: 1 }}>
            Exit
          </Button>
          <Button variant="contained" color="warning" onClick={clearImage} sx={{ m: 1 }}>
            Clear
          </Button>
        </Box>

        <Box sx={{ mt: 4 }}>
          <Typography>
            As you adjust the slider, the edge detection thresholds change in real-time for both the live feed and the captured/uploaded image preview.
            Clicking "Save" sends the image and sensitivity to the backend for the full pipeline (remove background, edges, SVG, NCC).
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
            <li>Both captured/uploaded image and live feed show edge results.</li>
            <li>Click "Save" to run the full pipeline on the backend (remove bg, SVG, NCC).</li>
            <li>"Exit" and some functionalities are placeholders.</li>
            <li>"Clear" removes the captured/uploaded image.</li>
          </ul>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
