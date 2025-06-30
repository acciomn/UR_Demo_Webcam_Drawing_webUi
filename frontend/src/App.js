/* global cv */
import React, { useState, useRef, useEffect, useCallback, Component } from "react";
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
  TextField,
  IconButton,
  Checkbox,
} from "@mui/material";
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { styled } from '@mui/system';
import HelpIcon from '@mui/icons-material/Help';
import SettingsIcon from '@mui/icons-material/Settings';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import UploadIcon from '@mui/icons-material/Upload';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';

// Error Boundary Component to Catch Runtime Errors
class ErrorBoundary extends Component {
  state = { hasError: false, error: null, errorInfo: null };

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Something went wrong.
          </Typography>
          <Typography variant="body1">
            {this.state.error && this.state.error.toString()}
          </Typography>
          <Typography variant="body2">
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Reload Page
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

// Custom theme for a modern look
const createCustomTheme = (mode) => createTheme({
  palette: {
    mode: mode,
    primary: {
      main: mode === 'dark' ? '#3f51b5' : '#1976d2',
    },
    secondary: {
      main: mode === 'dark' ? '#f50057' : '#d32f2f',
    },
    background: {
      default: mode === 'dark' ? '#121212' : '#f5f5f5',
      paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.9rem',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '8px 16px',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

// Styled components for modern design
const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  textAlign: 'center',
  background: theme.palette.background.paper,
  borderRadius: 12,
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(1),
  padding: theme.spacing(1, 3),
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: 8,
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  margin: theme.spacing(1, 0),
  '& .MuiInputBase-root': {
    borderRadius: 8,
  },
  '& .MuiInputLabel-root': {
    fontWeight: 500,
  },
}));

const BOX_SIZE = 250;
const BOX_HEIGHT = 200;

const ImageContainer = styled('div')({
  width: BOX_SIZE,
  height: BOX_HEIGHT,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  borderRadius: '8px',
  marginBottom: '10px',
  background: '#fff'
});

function App() {
  const [sensitivity, setSensitivity] = useState(50);
  const [helpOpen, setHelpOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [processedCapturedImage, setProcessedCapturedImage] = useState(null); // Background removed + edges (for Process Edges button)
  const [bgRemovedImage, setBgRemovedImage] = useState(null); // Background-removed only (for preview)
  const [edgeDetectedImage, setEdgeDetectedImage] = useState(null); // Edge-detected captured image (for 5th window)
  const [cvReady, setCvReady] = useState(false); // Track OpenCV.js readiness
  const [showFileInput, setShowFileInput] = useState(false);
  const [darkMode, setDarkMode] = useState(false); // State for dark mode toggle
  const [svgFile, setSvgFile] = useState(null); // Store SVG file path
  const [gcodeFile, setGcodeFile] = useState(null); // Store GCode file path
  const [drawingStatus, setDrawingStatus] = useState(""); // Track drawing status
  const [userName, setUserName] = useState(""); // Store user-entered name
  const [drawName, setDrawName] = useState(false); // State for checkbox to draw name
  const [sendStatus, setSendStatus] = useState(""); // Add state for send-to-robot status

  const fileInputRef = useRef(null);
  const webcamRef = useRef(null);
  const liveCanvasRef = useRef(null); // Canvas for live feed edge detection
  const capturedCanvasRef = useRef(null); // Canvas for captured image edge detection
  const animationRef = useRef(null);

  // Define the backend URL (can be overridden by environment variable for portability)
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

  // Create theme based on dark mode state
  const theme = createCustomTheme(darkMode ? 'dark' : 'light');

  // Check if OpenCV.js is fully loaded and functional
  useEffect(() => {
    const checkCvLoaded = () => {
      if (
        typeof window.cv === "object" &&
        typeof window.cv.matFromImageData === "function"
      ) {
        setCvReady(true);
        console.log("OpenCV.js is fully loaded and ready");
      } else if (Date.now() - startTime > 30000) { // 30-second timeout
        console.error("Timeout waiting for OpenCV.js to load");
        alert("Failed to load OpenCV.js. Check network and console for errors.");
      } else {
        console.log("Waiting for OpenCV.js to load...");
        setTimeout(checkCvLoaded, 100);
      }
    };
    const startTime = Date.now();
    checkCvLoaded();
  }, []);

  // Real-time edge detection on live camera feed (for the new 4th window)
  const processLiveFeedForEdges = useCallback(() => {
    if (
      !cvReady ||
      !webcamRef.current ||
      !webcamRef.current.video ||
      !liveCanvasRef.current
    ) {
      console.log("Skipping live feed edge detection: cvReady, webcamRef, or liveCanvasRef not ready");
      animationRef.current = requestAnimationFrame(processLiveFeedForEdges);
      return;
    }

    const video = webcamRef.current.video;
    if (!video || video.readyState !== 4) {
      console.log("Video not ready, skipping frame");
      animationRef.current = requestAnimationFrame(processLiveFeedForEdges);
      return;
    }

    const canvas = liveCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("Live canvas context not available, skipping frame");
      animationRef.current = requestAnimationFrame(processLiveFeedForEdges);
      return;
    }

    try {
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
      console.error("Error in processLiveFeedForEdges:", e);
    }

    animationRef.current = requestAnimationFrame(processLiveFeedForEdges);
  }, [cvReady, sensitivity]);

  // Set up the live feed edge detection
  useEffect(() => {
    if (!cvReady) {
      console.log("OpenCV.js not ready, skipping live feed edge detection");
      return;
    }

    let checkVideoReady;
    const setupVideo = () => {
      checkVideoReady = setInterval(() => {
        if (
          webcamRef.current &&
          webcamRef.current.video &&
          webcamRef.current.video.readyState === 4 &&
          liveCanvasRef.current
        ) {
          const video = webcamRef.current.video;
          const canvas = liveCanvasRef.current;
          if (canvas) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            animationRef.current = requestAnimationFrame(processLiveFeedForEdges);
            clearInterval(checkVideoReady);
          } else {
            console.log("Live canvas not ready yet, waiting...");
          }
        } else {
          console.log("Waiting for webcam video or live canvas to be ready...");
        }
      }, 500);
    };

    setupVideo();

    return () => {
      if (checkVideoReady) {
        clearInterval(checkVideoReady);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [processLiveFeedForEdges, cvReady]);

  // Process the captured/uploaded image for edge detection (real-time with slider)
  const processCapturedImageForEdges = useCallback(() => {
    if (!cvReady || !capturedImage || !capturedCanvasRef.current) {
      console.log("Skipping edge detection: cvReady, capturedImage, or capturedCanvasRef not ready");
      setEdgeDetectedImage(null);
      return;
    }

    const canvas = capturedCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.log("Captured canvas context not available");
      return;
    }

    try {
      // Load the captured image into an HTMLImageElement
      const img = new Image();
      img.src = capturedImage;
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
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
        const processedImageData = new ImageData(
          new Uint8ClampedArray(dst.data),
          dst.cols,
          dst.rows
        );
        ctx.putImageData(processedImageData, 0, 0);

        // Convert the canvas to a data URL and store it in state
        const edgeDetectedDataUrl = canvas.toDataURL();
        setEdgeDetectedImage(edgeDetectedDataUrl);

        src.delete();
        gray.delete();
        edges.delete();
        dst.delete();
      };
      img.onerror = (error) => {
        console.error("Error loading captured image for edge detection:", error);
      };
    } catch (e) {
      console.error("Error in processCapturedImageForEdges:", e);
      setEdgeDetectedImage(null);
    }
  }, [cvReady, capturedImage, sensitivity]);

  // Run edge detection whenever capturedImage or sensitivity changes
  useEffect(() => {
    processCapturedImageForEdges();
  }, [processCapturedImageForEdges]);

  // Process captured/uploaded image with background removal and edge detection (for Process Edges button)
  const processImageForPreview = async () => {
    if (!cvReady || !capturedImage) {
      alert("No image captured or uploaded to process.");
      return;
    }

    try {
      setDrawingStatus("Processing edges...");
      console.log("Sending request to /api/process_final with image:", capturedImage.substring(0, 50) + "...");
      const response = await axios.post(`${BACKEND_URL}/api/process_final`, {
        image: capturedImage,
        sensitivity,
      });

      console.log("Response from /api/process_final:", response.data);
      setBgRemovedImage(`${BACKEND_URL}${response.data.bgRemoved}`);
      setProcessedCapturedImage(`${BACKEND_URL}${response.data.edges}`);
      // If backend returns SVG path, set it here
      if (response.data.svg) {
        setSvgFile(response.data.svg);
      }
      setDrawingStatus("Edges processed successfully!");
      setTimeout(() => setDrawingStatus(""), 5000);
    } catch (error) {
      console.error("Error in processImageForPreview:", {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null,
      });
      setDrawingStatus("Error: " + (error.response?.data?.message || error.message));
      setTimeout(() => setDrawingStatus(""), 5000);
    }
  };

  const handleCaptureImage = () => {
    if (!webcamRef.current) {
      console.error("Webcam reference is not available");
      alert("Webcam is not available. Please ensure camera access is granted.");
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setCapturedImage(imageSrc);
      } else {
        console.error("Failed to capture image from webcam");
        alert("Failed to capture image. Please try again.");
      }
    } catch (error) {
      console.error("Error capturing image:", error);
      alert("Error capturing image: " + error.message);
    }
  };

  const handleLoadImageClick = () => {
    setShowFileInput(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleSave = async () => {
    if (!capturedImage) {
      alert("No image captured or uploaded to save.");
      return;
    }

    try {
      setDrawingStatus("Processing...");
      console.log("Sending request to /api/process_image with image:", capturedImage.substring(0, 50) + "...");
      const response = await axios.post(`${BACKEND_URL}/api/process_image`, {
        image: capturedImage,
        sensitivity,
        name: userName,
        drawName: drawName,
      });

      console.log("Response from /api/process_image:", response.data);
      setSvgFile(response.data.svg);
      setGcodeFile(response.data.gcode);
      // Remove the line that sets processedCapturedImage to the SVG
    } catch (error) {
      console.error("Error in handleSave:", {
        message: error.message,
        response: error.response ? error.response.data : null,
        status: error.response ? error.response.status : null,
      });
      setDrawingStatus("Error: " + (error.response?.data?.message || error.message));
      setTimeout(() => setDrawingStatus(""), 5000);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCapturedImage(ev.target.result);
      // Only reset SVG and GCode, not processedCapturedImage
      setSvgFile(null);
      setGcodeFile(null);
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      alert("Error reading file: " + error.message);
    };
    reader.readAsDataURL(file);
  };

  const handleExit = () => {
    alert("Exit functionality not implemented.");
  };

  const handleProcessEdges = () => {
    processImageForPreview();
  };

  // Handler for sending GCode to robot via FTP
  const handleSendToRobot = async () => {
    setSendStatus("Sending to robot via FTP...");
    try {
      // POST to backend API endpoint (no filename needed, backend always sends output.nc)
      const response = await axios.post(`${BACKEND_URL}/api/send-to-robot`);
      if (response.data.success) {
        setSendStatus("File sent to robot successfully!");
        window.alert("File sent to robot successfully!\n" + (response.data.ftpConfirmation || ""));
      } else {
        setSendStatus("Failed to send file: " + (response.data.error || "Unknown error"));
      }
    } catch (err) {
      setSendStatus("Error: " + (err.response?.data?.error || err.message));
    }
    setTimeout(() => setSendStatus(""), 5000);
  };

  const clearImage = () => {
    setCapturedImage(null);
    setBgRemovedImage(null);
    setProcessedCapturedImage(null);
    setEdgeDetectedImage(null);
    setSvgFile(null);
    setGcodeFile(null);
    setDrawingStatus("");
    setUserName("");
    setDrawName(false);
    setSendStatus(""); // Clear send status as well
    alert("All images and files cleared successfully!");
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
    <ErrorBoundary>
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
              Face Drawing Robot
            </Typography>
            <FormControlLabel
              control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />}
              label={darkMode ? "Dark Mode" : "Light Mode"}
              sx={{ marginRight: 2 }}
            />
            <IconButton color="inherit" onClick={() => setHelpOpen(true)}>
              <HelpIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => setSettingsOpen(true)}>
              <SettingsIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Grid container spacing={3} justifyContent="center" alignItems="flex-start">
            {/* Slider */}
            <Grid item xs={12} sm={6} md={2}>
              <StyledPaper elevation={3}>
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
                  sx={{ height: BOX_HEIGHT, mx: "auto" }}
                />
              </StyledPaper>
            </Grid>

            {/* Live Camera Feed */}
            <Grid item xs={12} sm={6} md={2}>
              <StyledPaper elevation={3}>
                <ImageContainer>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    width={BOX_SIZE}
                    height={BOX_HEIGHT}
                    videoConstraints={{ facingMode: "user" }}
                    style={{ width: "100%", height: "100%", objectFit: "contain" }}
                  />
                </ImageContainer>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Live Camera Feed
                </Typography>
              </StyledPaper>
            </Grid>

            {/* Captured/Uploaded Image */}
            <Grid item xs={12} sm={6} md={2}>
              <StyledPaper elevation={3}>
                {capturedImage ? (
                  <div>
                    <ImageContainer>
                      <img
                        src={capturedImage}
                        alt="Captured Image"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </ImageContainer>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                      Captured Image
                    </Typography>
                    {bgRemovedImage && (
                      <>
                        <ImageContainer>
                          <img
                            src={bgRemovedImage}
                            alt="Background Removed"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </ImageContainer>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Background Removed
                        </Typography>
                      </>
                    )}
                    {processedCapturedImage && (
                      <>
                        <ImageContainer>
                          <img
                            src={processedCapturedImage}
                            alt="Processed Edges"
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                          />
                        </ImageContainer>
                        <Typography variant="body1">
                          Processed Edges
                        </Typography>
                      </>
                    )}
                  </div>
                ) : (
                  <Typography align="center">
                    No image captured or uploaded yet.
                  </Typography>
                )}
              </StyledPaper>
            </Grid>

            {/* Live Camera Feed with Edge Detection */}
            <Grid item xs={12} sm={6} md={2}>
              <StyledPaper elevation={3}>
                <ImageContainer>
                  <canvas ref={liveCanvasRef} style={{ width: '100%', height: '100%' }} />
                </ImageContainer>
                <Typography variant="body1" sx={{ mt: 1 }}>
                  Live Edge Detection
                </Typography>
              </StyledPaper>
            </Grid>

            {/* Processed (Edges) View */}
            <Grid item xs={12} sm={6} md={2}>
              <StyledPaper elevation={3}>
                {edgeDetectedImage ? (
                  <>
                    <ImageContainer>
                      <img
                        src={edgeDetectedImage}
                        alt="Edge Detected Image"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </ImageContainer>
                    <Typography variant="body1" sx={{ mt: 1 }}>
                      Processed (Edges) View
                    </Typography>
                  </>
                ) : (
                  <Typography align="center">
                    No edge-detected image available.
                  </Typography>
                )}
                <canvas ref={capturedCanvasRef} style={{ display: 'none' }} />
              </StyledPaper>
            </Grid>

            {/* SVG Display - Make this box larger to show SVG fully */}
            <Grid item xs={12} sm={12} md={4}>
              <StyledPaper elevation={3}>
                {svgFile ? (
                  <Box>
                    <Typography variant="h6">Generated SVG:</Typography>
                    <Box
                      sx={{
                        width: BOX_SIZE * 2,
                        height: BOX_HEIGHT * 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#fff",
                        position: "relative",
                        overflow: "hidden",
                        margin: "0 auto"
                      }}
                    >
                      <object
                        data={`${BACKEND_URL}${svgFile}`}
                        type="image/svg+xml"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                          pointerEvents: "none"
                        }}
                        aria-label="SVG Preview"
                      />
                    </Box>
                    <StyledButton
                      variant="contained"
                      href={`${BACKEND_URL}${svgFile}`}
                      download="adjusted.svg"
                      sx={{ mt: 1 }}
                    >
                      Download SVG
                    </StyledButton>
                  </Box>
                ) : (
                  <Typography variant="body1">
                    No SVG generated yet.
                  </Typography>
                )}
              </StyledPaper>
            </Grid>
          </Grid>

          {/* GCode Display (Moved Below the Grid) */}
          <Box sx={{ mt: 4 }}>
            {gcodeFile ? (
              <Box>
                <Typography variant="h6">Generated GCode:</Typography>
                <pre style={{ background: "#f0f0f0", padding: "10px", maxHeight: "200px", overflow: "auto" }}>
                  <a href={`${BACKEND_URL}${gcodeFile}`} download="output.txt">
                    Download GCode (.txt)
                  </a>
                  <br />
                  <a href={`${BACKEND_URL}${gcodeFile.replace('.txt', '.nc')}`} download="output.nc">
                    Download GCode (.nc)
                  </a>
                </pre>
              </Box>
            ) : (
              <Typography variant="body1">
                No GCode generated yet.
              </Typography>
            )}
          </Box>

          {/* Action Buttons Row */}
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <StyledTextField
                label="Enter Name (Optional)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                variant="outlined"
                sx={{ maxWidth: 300, mr: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={drawName}
                    onChange={(e) => setDrawName(e.target.checked)}
                    color="primary"
                  />
                }
                label="Draw Name Below Image"
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              <StyledButton
                variant="contained"
                color="secondary"
                onClick={handleCaptureImage}
                startIcon={<CameraAltIcon />}
              >
                Capture Image
              </StyledButton>
              <StyledButton
                variant="contained"
                color="success"
                onClick={handleLoadImageClick}
                startIcon={<UploadIcon />}
              >
                Upload Image
              </StyledButton>
              <StyledButton
                variant="contained"
                color="primary"
                onClick={handleSave}
                startIcon={<SaveIcon />}
              >
                Save GCode
              </StyledButton>
              <StyledButton
                variant="contained"
                color="info"
                onClick={handleProcessEdges}
              >
                Process Edges
              </StyledButton>
              <StyledButton
                variant="contained"
                color="warning"
                onClick={clearImage}
                startIcon={<ClearIcon />}
              >
                Clear
              </StyledButton>
              {/* Send to Robot button in the same row */}
              <StyledButton
                variant="contained"
                color="primary"
                onClick={handleSendToRobot}
                sx={{ ml: 1 }}
              >
                Send to Robot
              </StyledButton>
            </Box>
            {sendStatus && (
              <Typography variant="body2" sx={{ mt: 1, color: sendStatus.includes("success") ? "green" : "red" }}>
                {sendStatus}
              </Typography>
            )}
            {drawingStatus && (
              <Typography variant="body1" sx={{ mt: 2, color: drawingStatus.includes("Error") ? "red" : "green" }}>
                {drawingStatus}
              </Typography>
            )}
          </Box>
        </Container>

        {/* Settings Modal (Removed Robot Configuration) */}
        <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)}>
          <DialogTitle>Settings</DialogTitle>
          <DialogContent>
            <Typography>Settings are currently limited due to Ethernet connection being disabled.</Typography>
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
              <li>Click "Upload Image" to upload your own image.</li>
              <li>Enter a name (optional) and check "Draw Name Below Image" to include the name in the GCode output.</li>
              <li>Click "Save GCode" to generate PNG, SVG, and GCode files in the backend/public/images folder.</li>
              <li>Click "Process Edges" to process the captured image and display stages.</li>
              <li>Click "Clear" to remove all images and generated files.</li>
            </ul>
          </DialogContent>
        </Dialog>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


export default App;

