// // import { exec } from 'child_process';
// // import { promisify } from 'util';
// // import fs from 'fs/promises';
// // import path from 'path';
// // import { v4 as uuidv4 } from 'uuid';
// // import imageType from 'image-type';

// // // Promisify exec to use async/await
// // const execPromise = promisify(exec);

// // // Define directories using absolute paths
// // const PROJECT_ROOT = process.cwd();
// // const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public'); // backend/public
// // const IMAGES_DIR = path.join(PUBLIC_DIR, 'images'); // backend/public/images
// // const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts'); // backend/scripts
// // const TEMP_DIR = path.join(PROJECT_ROOT, 'temp'); // Temporary directory for processing

// // // File cleanup settings
// // const FILE_RETENTION_MINUTES = 60;
// // const fileTimestamps = new Map();

// // // Ensure the images and temp directories exist
// // async function ensureImagesDir() {
// //   try {
// //     await fs.mkdir(IMAGES_DIR, { recursive: true });
// //     await fs.mkdir(TEMP_DIR, { recursive: true });
// //     console.log(`Ensured directories exist: ${IMAGES_DIR}, ${TEMP_DIR}`);
// //   } catch (error) {
// //     console.error('Error creating directories:', error);
// //     throw new Error('Failed to create directories');
// //   }
// // }

// // // Clean up old files
// // async function cleanupOldFiles() {
// //   try {
// //     const now = Date.now();
// //     const files = await fs.readdir(IMAGES_DIR);
// //     for (const file of files) {
// //       const filePath = path.join(IMAGES_DIR, file);
// //       const timestamp = fileTimestamps.get(filePath);
// //       if (timestamp && (now - timestamp) > FILE_RETENTION_MINUTES * 60 * 1000) {
// //         await fs.unlink(filePath);
// //         fileTimestamps.delete(filePath);
// //         console.log(`Deleted old file: ${filePath}`);
// //       }
// //     }
// //   } catch (error) {
// //     console.error('Error during file cleanup:', error);
// //   }
// // }

// // // Validate the image data
// // async function validateImage(base64Data) {
// //   try {
// //     const buffer = Buffer.from(base64Data, 'base64');
// //     const type = await imageType(buffer);
// //     if (!type || !['png', 'jpeg', 'jpg'].includes(type.ext)) {
// //       throw new Error('Invalid image format. Only PNG and JPEG are supported.');
// //     }
// //     if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
// //       throw new Error('Image size exceeds 5MB limit.');
// //     }
// //     return buffer;
// //   } catch (error) {
// //     console.error('Error validating image:', error);
// //     throw error;
// //   }
// // }

// // export default async function handler(req, res) {
// //   // Enable CORS for requests from http://localhost:3001 (frontend)
// //   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
// //   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
// //   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

// //   // Handle preflight OPTIONS request
// //   if (req.method === 'OPTIONS') {
// //     res.status(200).end();
// //     return;
// //   }

// //   console.log(`Received request to ${req.url}`);

// //   if (req.method !== 'POST') {
// //     console.error(`Method ${req.method} not allowed`);
// //     res.status(405).json({ status: 'error', message: 'Method not allowed' });
// //     return;
// //   }

// //   const { image, sensitivity, name, drawName } = req.body;

// //   // Handle different endpoints
// //   if (req.url.includes('/api/process_image')) {
// //     // Endpoint to process image and return file paths
// //     try {
// //       if (!image || !sensitivity) {
// //         console.error('Missing image or sensitivity in request body');
// //         res.status(400).json({ status: 'error', message: 'Missing image or sensitivity' });
// //         return;
// //       }

// //       const sensitivityNum = parseInt(sensitivity, 10);
// //       if (isNaN(sensitivityNum) || sensitivityNum < 1 || sensitivityNum > 100) {
// //         console.error('Invalid sensitivity value:', sensitivity);
// //         res.status(400).json({ status: 'error', message: 'Sensitivity must be a number between 1 and 100' });
// //         return;
// //       }

// //       await ensureImagesDir();
// //       await cleanupOldFiles();

// //       const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
// //       const imageBuffer = await validateImage(base64Data);

// //       // Create a temporary directory for this request
// //       const tempId = uuidv4();
// //       const tempRequestDir = path.join(TEMP_DIR, tempId);
// //       await fs.mkdir(tempRequestDir, { recursive: true });

// //       // Define temporary file paths
// //       const tempInputPath = path.join(tempRequestDir, `original.png`);
// //       const tempAdjustedPath = path.join(tempRequestDir, `adjusted.png`);
// //       const tempSvgPath = path.join(tempRequestDir, `adjusted.svg`);
// //       const tempGcodePathNcc = path.join(tempRequestDir, `output.txt`);

// //       // Define final file paths
// //       const finalInputPath = path.join(IMAGES_DIR, `original.png`);
// //       const finalAdjustedPath = path.join(IMAGES_DIR, `adjusted.png`);
// //       const finalSvgPath = path.join(IMAGES_DIR, `adjusted.svg`);
// //       const finalGcodePathNcc = path.join(IMAGES_DIR, `output.txt`);
// //       const finalGcodePathNc = path.join(IMAGES_DIR, `output.nc`);

// //       console.log(`Saving original image to: ${tempInputPath}`);
// //       await fs.writeFile(tempInputPath, imageBuffer);
// //       console.log(`Original image saved successfully`);

// //       const now = Date.now();
// //       fileTimestamps.set(finalInputPath, now);
// //       fileTimestamps.set(finalAdjustedPath, now);
// //       fileTimestamps.set(finalSvgPath, now);
// //       fileTimestamps.set(finalGcodePathNcc, now);
// //       fileTimestamps.set(finalGcodePathNc, now);

// //       const pythonCmd = process.env.PYTHON_CMD || 'python3';
// //       const scriptPath = path.join(SCRIPTS_DIR, 'process_image.py');
// //       console.log(`Resolved script path: ${scriptPath}`);
// //       const command = `${pythonCmd} "${scriptPath}" "${tempInputPath}" "${tempAdjustedPath}" "${tempSvgPath}" "${tempGcodePathNcc}" ${sensitivityNum} "${name || ''}" ${drawName ? 'true' : 'false'}`;
// //       console.log(`Executing command: ${command}`);

// //       const { stdout, stderr } = await execPromise(command);

// //       if (stderr) {
// //         console.error('Script stderr:', stderr);
// //         if (stderr.includes('ModuleNotFoundError')) {
// //           res.status(500).json({ status: 'error', message: 'Python dependencies missing. Please install required libraries (e.g., opencv-python, rembg, onnxruntime).' });
// //           return;
// //         }
// //         res.status(500).json({ status: 'error', message: `Script error: ${stderr}` });
// //         return;
// //       }

// //       const result = JSON.parse(stdout);
// //       if (result.status === 'error') {
// //         console.error('Script error:', result.message);
// //         res.status(500).json({ status: 'error', message: result.message });
// //         return;
// //       }

// //       // Move the temporary files to their final locations
// //       await fs.rename(tempInputPath, finalInputPath);
// //       await fs.rename(tempAdjustedPath, finalAdjustedPath);
// //       await fs.rename(tempSvgPath, finalSvgPath);
// //       await fs.rename(tempGcodePathNcc, finalGcodePathNcc);

// //       console.log(`Copying GCode to: ${finalGcodePathNc}`);
// //       await fs.copyFile(finalGcodePathNcc, finalGcodePathNc);
// //       console.log(`GCode copied successfully`);

// //       // Clean up the temporary directory
// //       await fs.rm(tempRequestDir, { recursive: true, force: true });

// //       const response = {
// //         status: 'success',
// //         original: `/images/${path.basename(finalInputPath)}`,
// //         bgRemoved: `/images/${path.basename(result.bg_removed_path)}`,
// //         adjusted: `/images/${path.basename(finalAdjustedPath)}`,
// //         svg: `/images/${path.basename(finalSvgPath)}`,
// //         gcode: `/images/${path.basename(finalGcodePathNcc)}`,
// //         gcodeNc: `/images/${path.basename(finalGcodePathNc)}`,
// //       };

// //       console.log('Processing successful:', response);
// //       res.status(200).json(response);
// //     } catch (error) {
// //       console.error('Error in /api/process_image:', error);
// //       res.status(500).json({ status: 'error', message: error.message });
// //     }
// //   } else if (req.url.includes('/api/process_final')) {
// //     // Endpoint to process image for front-end preview (background removal + edges)
// //     try {
// //       if (!image || !sensitivity) {
// //         console.error('Missing image or sensitivity in request body');
// //         res.status(400).json({ status: 'error', message: 'Missing image or sensitivity' });
// //         return;
// //       }

// //       const sensitivityNum = parseInt(sensitivity, 10);
// //       if (isNaN(sensitivityNum) || sensitivityNum < 1 || sensitivityNum > 100) {
// //         console.error('Invalid sensitivity value:', sensitivity);
// //         res.status(400).json({ status: 'error', message: 'Sensitivity must be a number between 1 and 100' });
// //         return;
// //       }

// //       await ensureImagesDir();
// //       await cleanupOldFiles();

// //       const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
// //       const imageBuffer = await validateImage(base64Data);

// //       // Create a temporary directory for this request
// //       const tempId = uuidv4();
// //       const tempRequestDir = path.join(TEMP_DIR, tempId);
// //       await fs.mkdir(tempRequestDir, { recursive: true });

// //       // Define temporary file paths
// //       const tempInputPath = path.join(tempRequestDir, `original.png`);
// //       const tempAdjustedPath = path.join(tempRequestDir, `adjusted.png`);
// //       const tempSvgPath = path.join(tempRequestDir, `adjusted.svg`);
// //       const tempGcodePath = path.join(tempRequestDir, `output.txt`);

// //       // Define final file paths
// //       const finalInputPath = path.join(IMAGES_DIR, `original.png`);
// //       const finalAdjustedPath = path.join(IMAGES_DIR, `adjusted.png`);

// //       console.log(`Saving original image to: ${tempInputPath}`);
// //       await fs.writeFile(tempInputPath, imageBuffer);
// //       console.log(`Original image saved successfully`);

// //       const now = Date.now();
// //       fileTimestamps.set(finalInputPath, now);
// //       fileTimestamps.set(finalAdjustedPath, now);

// //       const pythonCmd = process.env.PYTHON_CMD || 'python3';
// //       const scriptPath = path.join(SCRIPTS_DIR, 'process_image.py');
// //       console.log(`Resolved script path: ${scriptPath}`);
// //       const command = `${pythonCmd} "${scriptPath}" "${tempInputPath}" "${tempAdjustedPath}" "${tempSvgPath}" "${tempGcodePath}" ${sensitivityNum} "" false`;
// //       console.log(`Executing command: ${command}`);

// //       const { stdout, stderr } = await execPromise(command);

// //       if (stderr) {
// //         console.error('Script stderr:', stderr);
// //         if (stderr.includes('ModuleNotFoundError')) {
// //           res.status(500).json({ status: 'error', message: 'Python dependencies missing. Please install required libraries (e.g., opencv-python, rembg, onnxruntime).' });
// //           return;
// //         }
// //         res.status(500).json({ status: 'error', message: `Script error: ${stderr}` });
// //         return;
// //       }

// //       const result = JSON.parse(stdout);
// //       if (result.status === 'error') {
// //         console.error('Script error:', result.message);
// //         res.status(500).json({ status: 'error', message: result.message });
// //         return;
// //       }

// //       // Move the temporary files to their final locations
// //       await fs.rename(tempInputPath, finalInputPath);
// //       await fs.rename(tempAdjustedPath, finalAdjustedPath);

// //       // Clean up the temporary directory
// //       await fs.rm(tempRequestDir, { recursive: true, force: true });

// //       const response = {
// //         status: 'success',
// //         bgRemoved: `/images/${path.basename(result.bg_removed_path)}`,
// //         edges: `/images/${path.basename(finalAdjustedPath)}`,
// //       };

// //       console.log('Edge processing successful:', response);
// //       res.status(200).json(response);
// //     } catch (error) {
// //       console.error('Error in /api/process_final:', error);
// //       res.status(500).json({ status: 'error', message: error.message });
// //     }
// //   } else {
// //     console.error('Endpoint not found:', req.url);
// //     res.status(404).json({ status: 'error', message: 'Endpoint not found' });
// //   }
// // }



























// import { exec } from 'child_process';
// import { promisify } from 'util';
// import fs from 'fs/promises';
// import path from 'path';
// import { v4 as uuidv4 } from 'uuid';
// import imageType from 'image-type';

// // Promisify exec to use async/await with a timeout
// const execPromise = promisify(exec);

// // Define directories using absolute paths
// const PROJECT_ROOT = process.cwd();
// const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public'); // backend/public
// const IMAGES_DIR = path.join(PUBLIC_DIR, 'images'); // backend/public/images
// const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts'); // backend/scripts
// const TEMP_DIR = path.join(PROJECT_ROOT, 'temp'); // Temporary directory for processing

// // File cleanup settings
// const FILE_RETENTION_MINUTES = 60;
// const fileTimestamps = new Map();

// // Ensure the images and temp directories exist
// async function ensureImagesDir() {
//   try {
//     await fs.mkdir(IMAGES_DIR, { recursive: true });
//     await fs.mkdir(TEMP_DIR, { recursive: true });
//     console.log(`Ensured directories exist: ${IMAGES_DIR}, ${TEMP_DIR}`);
//   } catch (error) {
//     console.error('Error creating directories:', error);
//     throw new Error(`Failed to create directories: ${error.message}`);
//   }
// }

// // Clean up old files
// async function cleanupOldFiles() {
//   try {
//     const now = Date.now();
//     const files = await fs.readdir(IMAGES_DIR);
//     for (const file of files) {
//       const filePath = path.join(IMAGES_DIR, file);
//       const timestamp = fileTimestamps.get(filePath);
//       if (timestamp && (now - timestamp) > FILE_RETENTION_MINUTES * 60 * 1000) {
//         await fs.unlink(filePath);
//         fileTimestamps.delete(filePath);
//         console.log(`Deleted old file: ${filePath}`);
//       }
//     }
//   } catch (error) {
//     console.error('Error during file cleanup:', error);
//   }
// }

// // Validate the image data
// async function validateImage(base64Data) {
//   try {
//     const buffer = Buffer.from(base64Data, 'base64');
//     const type = await imageType(buffer);
//     if (!type || !['png', 'jpeg', 'jpg'].includes(type.ext)) {
//       throw new Error('Invalid image format. Only PNG and JPEG are supported.');
//     }
//     if (buffer.length > 10 * 1024 * 1024) { // 10MB limit
//       throw new Error('Image size exceeds 10MB limit.');
//     }
//     return buffer;
//   } catch (error) {
//     console.error('Error validating image:', error);
//     throw error;
//   }
// }

// // Export config to increase body size limit
// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '10mb', // Increase to 10MB
//     },
//   },
// };

// export default async function handler(req, res) {
//   // Enable CORS for requests from http://localhost:3001 (frontend)
//   res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   // Handle preflight OPTIONS request
//   if (req.method === 'OPTIONS') {
//     console.log('Handling OPTIONS request');
//     res.status(200).end();
//     return;
//   }

//   console.log(`Received request to ${req.url}`);

//   if (req.method !== 'POST') {
//     console.error(`Method ${req.method} not allowed`);
//     res.status(405).json({ status: 'error', message: 'Method not allowed' });
//     return;
//   }

//   const { image, sensitivity, name, drawName } = req.body;

//   if (req.url.includes('/api/process_image')) {
//     // Endpoint to process image and return file paths
//     try {
//       if (!image || !sensitivity) {
//         console.error('Missing image or sensitivity in request body');
//         res.status(400).json({ status: 'error', message: 'Missing image or sensitivity' });
//         return;
//       }

//       const sensitivityNum = parseInt(sensitivity, 10);
//       if (isNaN(sensitivityNum) || sensitivityNum < 1 || sensitivityNum > 100) {
//         console.error('Invalid sensitivity value:', sensitivity);
//         res.status(400).json({ status: 'error', message: 'Sensitivity must be a number between 1 and 100' });
//         return;
//       }

//       console.log('Ensuring images directory...');
//       await ensureImagesDir();
//       console.log('Cleaning up old files...');
//       await cleanupOldFiles();

//       console.log('Validating image...');
//       const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
//       const imageBuffer = await validateImage(base64Data);

//       // Create a temporary directory for this request
//       const tempId = uuidv4();
//       const tempRequestDir = path.join(TEMP_DIR, tempId);
//       console.log(`Creating temporary directory: ${tempRequestDir}`);
//       await fs.mkdir(tempRequestDir, { recursive: true });

//       // Define temporary file paths
//       const tempInputPath = path.join(tempRequestDir, `original.png`);
//       const tempAdjustedPath = path.join(tempRequestDir, `adjusted.png`);
//       const tempSvgPath = path.join(tempRequestDir, `adjusted.svg`);
//       const tempGcodePathNcc = path.join(tempRequestDir, `output.txt`);

//       // Define final file paths
//       const finalInputPath = path.join(IMAGES_DIR, `original.png`);
//       const finalAdjustedPath = path.join(IMAGES_DIR, `adjusted.png`);
//       const finalSvgPath = path.join(IMAGES_DIR, `adjusted.svg`);
//       const finalGcodePathNcc = path.join(IMAGES_DIR, `output.txt`);
//       const finalGcodePathNc = path.join(IMAGES_DIR, `output.nc`);

//       console.log(`Saving original image to: ${tempInputPath}`);
//       await fs.writeFile(tempInputPath, imageBuffer);
//       console.log(`Original image saved successfully`);

//       const now = Date.now();
//       fileTimestamps.set(finalInputPath, now);
//       fileTimestamps.set(finalAdjustedPath, now);
//       fileTimestamps.set(finalSvgPath, now);
//       fileTimestamps.set(finalGcodePathNcc, now);
//       fileTimestamps.set(finalGcodePathNc, now);

//       const pythonCmd = process.env.PYTHON_CMD || 'python3';
//       const scriptPath = path.join(SCRIPTS_DIR, 'process_image.py');
//       console.log(`Resolved script path: ${scriptPath}`);
//       const command = `${pythonCmd} "${scriptPath}" "${tempInputPath}" "${tempAdjustedPath}" "${tempSvgPath}" "${tempGcodePathNcc}" ${sensitivityNum} "${name || ''}" ${drawName ? 'true' : 'false'}`;
//       console.log(`Executing command: ${command}`);

//       // Increase timeout to 20 seconds
//       const { stdout, stderr } = await execPromise(command, { timeout: 20000 });

//       if (stderr) {
//         console.error('Script stderr:', stderr);
//         if (stderr.includes('ModuleNotFoundError')) {
//           res.status(500).json({ status: 'error', message: 'Python dependencies missing. Please install required libraries (e.g., opencv-python, rembg, onnxruntime).' });
//           return;
//         }
//         res.status(500).json({ status: 'error', message: `Script error: ${stderr}` });
//         return;
//       }

//       console.log('Python script stdout:', stdout);
//       let result;
//       try {
//         result = JSON.parse(stdout);
//       } catch (parseError) {
//         console.error('Failed to parse stdout as JSON:', parseError);
//         console.error('Raw stdout:', stdout);
//         res.status(500).json({ status: 'error', message: `Failed to parse script output: ${parseError.message}` });
//         return;
//       }

//       if (result.status === 'error') {
//         console.error('Script error:', result.message);
//         res.status(500).json({ status: 'error', message: result.message });
//         return;
//       }

//       console.log('Checking if temporary files exist before moving...');
//       const tempFiles = [tempInputPath, tempAdjustedPath, tempSvgPath, tempGcodePathNcc];
//       for (const tempFile of tempFiles) {
//         const exists = await fs.access(tempFile).then(() => true).catch(() => false);
//         console.log(`Temporary file ${tempFile} exists: ${exists}`);
//         if (!exists) {
//           throw new Error(`Temporary file ${tempFile} does not exist`);
//         }
//       }

//       console.log('Deleting existing final files if they exist...');
//       // Delete final files if they exist to avoid conflicts
//       const finalFiles = [finalInputPath, finalAdjustedPath, finalSvgPath, finalGcodePathNcc, finalGcodePathNc];
//       for (const finalPath of finalFiles) {
//         try {
//           await fs.unlink(finalPath);
//           console.log(`Deleted existing file: ${finalPath}`);
//         } catch (error) {
//           if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
//             console.error(`Error deleting file ${finalPath}:`, error);
//             throw error;
//           }
//         }
//       }

//       console.log('Moving temporary files to final locations...');
//       await fs.rename(tempInputPath, finalInputPath);
//       console.log(`Moved ${tempInputPath} to ${finalInputPath}`);
//       await fs.rename(tempAdjustedPath, finalAdjustedPath);
//       console.log(`Moved ${tempAdjustedPath} to ${finalAdjustedPath}`);
//       await fs.rename(tempSvgPath, finalSvgPath);
//       console.log(`Moved ${tempSvgPath} to ${finalSvgPath}`);
//       await fs.rename(tempGcodePathNcc, finalGcodePathNcc);
//       console.log(`Moved ${tempGcodePathNcc} to ${finalGcodePathNcc}`);

//       console.log(`Copying GCode to: ${finalGcodePathNc}`);
//       await fs.copyFile(finalGcodePathNcc, finalGcodePathNc);
//       console.log(`GCode copied successfully`);

//       console.log('Cleaning up temporary directory...');
//       await fs.rm(tempRequestDir, { recursive: true, force: true });
//       console.log('Temporary directory cleaned up');

//       const response = {
//         status: 'success',
//         original: `/images/${path.basename(finalInputPath)}`,
//         bgRemoved: `/images/${path.basename(result.bg_removed_path)}`,
//         adjusted: `/images/${path.basename(finalAdjustedPath)}`,
//         svg: `/images/${path.basename(finalSvgPath)}`,
//         gcode: `/images/${path.basename(finalGcodePathNcc)}`,
//         gcodeNc: `/images/${path.basename(finalGcodePathNc)}`,
//       };

//       console.log('Processing successful:', response);
//       res.status(200).json(response);
//     } catch (error) {
//       console.error('Error in /api/process_image:', error);
//       res.status(500).json({ status: 'error', message: error.message });
//     }
//   } else if (req.url.includes('/api/process_final')) {
//     // Endpoint to process image for front-end preview (background removal + edges)
//     try {
//       if (!image || !sensitivity) {
//         console.error('Missing image or sensitivity in request body');
//         res.status(400).json({ status: 'error', message: 'Missing image or sensitivity' });
//         return;
//       }

//       const sensitivityNum = parseInt(sensitivity, 10);
//       if (isNaN(sensitivityNum) || sensitivityNum < 1 || sensitivityNum > 100) {
//         console.error('Invalid sensitivity value:', sensitivity);
//         res.status(400).json({ status: 'error', message: 'Sensitivity must be a number between 1 and 100' });
//         return;
//       }

//       console.log('Ensuring images directory...');
//       await ensureImagesDir();
//       console.log('Cleaning up old files...');
//       await cleanupOldFiles();

//       console.log('Validating image...');
//       const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
//       const imageBuffer = await validateImage(base64Data);

//       // Create a temporary directory for this request
//       const tempId = uuidv4();
//       const tempRequestDir = path.join(TEMP_DIR, tempId);
//       console.log(`Creating temporary directory: ${tempRequestDir}`);
//       await fs.mkdir(tempRequestDir, { recursive: true });

//       // Define temporary file paths
//       const tempInputPath = path.join(tempRequestDir, `original.png`);
//       const tempAdjustedPath = path.join(tempRequestDir, `adjusted.png`);
//       const tempSvgPath = path.join(tempRequestDir, `adjusted.svg`);
//       const tempGcodePath = path.join(tempRequestDir, `output.txt`);

//       // Define final file paths
//       const finalInputPath = path.join(IMAGES_DIR, `original.png`);
//       const finalAdjustedPath = path.join(IMAGES_DIR, `adjusted.png`);

//       console.log(`Saving original image to: ${tempInputPath}`);
//       await fs.writeFile(tempInputPath, imageBuffer);
//       console.log(`Original image saved successfully`);

//       const now = Date.now();
//       fileTimestamps.set(finalInputPath, now);
//       fileTimestamps.set(finalAdjustedPath, now);

//       const pythonCmd = process.env.PYTHON_CMD || 'python3';
//       const scriptPath = path.join(SCRIPTS_DIR, 'process_image.py');
//       console.log(`Resolved script path: ${scriptPath}`);
//       const command = `${pythonCmd} "${scriptPath}" "${tempInputPath}" "${tempAdjustedPath}" "${tempSvgPath}" "${tempGcodePath}" ${sensitivityNum} "" false`;
//       console.log(`Executing command: ${command}`);

//       // Increase timeout to 20 seconds
//       const { stdout, stderr } = await execPromise(command, { timeout: 20000 });

//       if (stderr) {
//         console.error('Script stderr:', stderr);
//         if (stderr.includes('ModuleNotFoundError')) {
//           res.status(500).json({ status: 'error', message: 'Python dependencies missing. Please install required libraries (e.g., opencv-python, rembg, onnxruntime).' });
//           return;
//         }
//         res.status(500).json({ status: 'error', message: `Script error: ${stderr}` });
//         return;
//       }

//       console.log('Python script stdout:', stdout);
//       let result;
//       try {
//         result = JSON.parse(stdout);
//       } catch (parseError) {
//         console.error('Failed to parse stdout as JSON:', parseError);
//         console.error('Raw stdout:', stdout);
//         res.status(500).json({ status: 'error', message: `Failed to parse script output: ${parseError.message}` });
//         return;
//       }

//       if (result.status === 'error') {
//         console.error('Script error:', result.message);
//         res.status(500).json({ status: 'error', message: result.message });
//         return;
//       }

//       console.log('Checking if temporary files exist before moving...');
//       const tempFiles = [tempInputPath, tempAdjustedPath];
//       for (const tempFile of tempFiles) {
//         const exists = await fs.access(tempFile).then(() => true).catch(() => false);
//         console.log(`Temporary file ${tempFile} exists: ${exists}`);
//         if (!exists) {
//           throw new Error(`Temporary file ${tempFile} does not exist`);
//         }
//       }

//       console.log('Deleting existing final files if they exist...');
//       // Delete final files if they exist to avoid conflicts
//       const finalFiles = [finalInputPath, finalAdjustedPath];
//       for (const finalPath of finalFiles) {
//         try {
//           await fs.unlink(finalPath);
//           console.log(`Deleted existing file: ${finalPath}`);
//         } catch (error) {
//           if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
//             console.error(`Error deleting file ${finalPath}:`, error);
//             throw error;
//           }
//         }
//       }

//       console.log('Moving temporary files to final locations...');
//       await fs.rename(tempInputPath, finalInputPath);
//       console.log(`Moved ${tempInputPath} to ${finalInputPath}`);
//       await fs.rename(tempAdjustedPath, finalAdjustedPath);
//       console.log(`Moved ${tempAdjustedPath} to ${finalAdjustedPath}`);

//       console.log('Cleaning up temporary directory...');
//       await fs.rm(tempRequestDir, { recursive: true, force: true });
//       console.log('Temporary directory cleaned up');

//       const response = {
//         status: 'success',
//         bgRemoved: `/images/${path.basename(result.bg_removed_path)}`,
//         edges: `/images/${path.basename(finalAdjustedPath)}`,
//       };

//       console.log('Edge processing successful:', response);
//       res.status(200).json(response);
//     } catch (error) {
//       console.error('Error in /api/process_final:', error);
//       res.status(500).json({ status: 'error', message: error.message });
//     }
//   } else {
//     console.error('Endpoint not found:', req.url);
//     res.status(404).json({ status: 'error', message: 'Endpoint not found' });
//   }
// }


import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import imageType from 'image-type';

// Promisify exec to use async/await
const execPromise = promisify(exec);

// Define directories using absolute paths
const PROJECT_ROOT = process.cwd();
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public'); // backend/public
const IMAGES_DIR = path.join(PROJECT_ROOT, 'public', 'images'); // backend/public/images
const SCRIPTS_DIR = path.join(PROJECT_ROOT, 'scripts'); // backend/scripts
const TEMP_DIR = path.join(PROJECT_ROOT, 'temp'); // Temporary directory for processing

// File cleanup settings
const FILE_RETENTION_MINUTES = 60;
const fileTimestamps = new Map();

// Ensure the images and temp directories exist
async function ensureImagesDir() {
  try {
    await fs.mkdir(IMAGES_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    console.log(`Ensured directories exist: ${IMAGES_DIR}, ${TEMP_DIR}`);
  } catch (error) {
    console.error('Error creating directories:', error);
    throw new Error('Failed to create directories');
  }
}

// Clean up old files
async function cleanupOldFiles() {
  try {
    const now = Date.now();
    const files = await fs.readdir(IMAGES_DIR);
    for (const file of files) {
      const filePath = path.join(IMAGES_DIR, file);
      const timestamp = fileTimestamps.get(filePath);
      if (timestamp && (now - timestamp) > FILE_RETENTION_MINUTES * 60 * 1000) {
        await fs.unlink(filePath);
        fileTimestamps.delete(filePath);
        console.log(`Deleted old file: ${filePath}`);
      }
    }
  } catch (error) {
    console.error('Error during file cleanup:', error);
  }
}

// Validate the image data
async function validateImage(base64Data) {
  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const type = await imageType(buffer);
    if (!type || !['png', 'jpeg', 'jpg'].includes(type.ext)) {
      throw new Error('Invalid image format. Only PNG and JPEG are supported.');
    }
    if (buffer.length > 5 * 1024 * 1024) { // 5MB limit
      throw new Error('Image size exceeds 5MB limit.');
    }
    return buffer;
  } catch (error) {
    console.error('Error validating image:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS for requests from http://localhost:3001 (frontend)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3001');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  console.log(`Received request to ${req.url}`);

  if (req.method !== 'POST') {
    console.error(`Method ${req.method} not allowed`);
    res.status(405).json({ status: 'error', message: 'Method not allowed' });
    return;
  }

  const { image, sensitivity, name, drawName } = req.body;

  // Handle different endpoints
  if (req.url.includes('/api/process_image')) {
    // Endpoint to process image and return file paths
    try {
      if (!image || !sensitivity) {
        console.error('Missing image or sensitivity in request body');
        res.status(400).json({ status: 'error', message: 'Missing image or sensitivity' });
        return;
      }

      const sensitivityNum = parseInt(sensitivity, 10);
      if (isNaN(sensitivityNum) || sensitivityNum < 1 || sensitivityNum > 100) {
        console.error('Invalid sensitivity value:', sensitivity);
        res.status(400).json({ status: 'error', message: 'Sensitivity must be a number between 1 and 100' });
        return;
      }

      await ensureImagesDir();
      await cleanupOldFiles();

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = await validateImage(base64Data);

      // Create a temporary directory for this request
      const tempId = uuidv4();
      const tempRequestDir = path.join(TEMP_DIR, tempId);
      await fs.mkdir(tempRequestDir, { recursive: true });

      // Define temporary file paths
      const tempInputPath = path.join(tempRequestDir, `original.png`);
      const tempAdjustedPath = path.join(tempRequestDir, `adjusted.png`);
      const tempSvgPath = path.join(tempRequestDir, `adjusted.svg`);
      const tempGcodePathNcc = path.join(tempRequestDir, `output.txt`);

      // Define final file paths
      const finalInputPath = path.join(IMAGES_DIR, `original.png`);
      const finalAdjustedPath = path.join(IMAGES_DIR, `adjusted.png`);
      const finalSvgPath = path.join(IMAGES_DIR, `adjusted.svg`);
      const finalGcodePathNcc = path.join(IMAGES_DIR, `output.txt`);
      const finalGcodePathNc = path.join(IMAGES_DIR, `output.nc`);

      console.log(`Saving original image to: ${tempInputPath}`);
      await fs.writeFile(tempInputPath, imageBuffer);
      console.log(`Original image saved successfully`);

      const now = Date.now();
      fileTimestamps.set(finalInputPath, now);
      fileTimestamps.set(finalAdjustedPath, now);
      fileTimestamps.set(finalSvgPath, now);
      fileTimestamps.set(finalGcodePathNcc, now);
      fileTimestamps.set(finalGcodePathNc, now);

      const pythonCmd = process.env.PYTHON_CMD || 'python3';
      const scriptPath = path.join(SCRIPTS_DIR, 'process_image.py');
      console.log(`Resolved script path: ${scriptPath}`);
      const command = `${pythonCmd} "${scriptPath}" "${tempInputPath}" "${tempAdjustedPath}" "${tempSvgPath}" "${tempGcodePathNcc}" ${sensitivityNum} "${name || ''}" ${drawName ? 'true' : 'false'}`;
      console.log(`Executing command: ${command}`);

      const { stdout, stderr } = await execPromise(command);

      if (stderr) {
        console.error('Script stderr:', stderr);
        if (stderr.includes('ModuleNotFoundError')) {
          res.status(500).json({ status: 'error', message: 'Python dependencies missing. Please install required libraries (e.g., opencv-python, rembg, onnxruntime).' });
          return;
        }
        res.status(500).json({ status: 'error', message: `Script error: ${stderr}` });
        return;
      }

      const result = JSON.parse(stdout);
      if (result.status === 'error') {
        console.error('Script error:', result.message);
        res.status(500).json({ status: 'error', message: result.message });
        return;
      }

      // Move the temporary files to their final locations
      await fs.rename(tempInputPath, finalInputPath);
      await fs.rename(tempAdjustedPath, finalAdjustedPath);
      await fs.rename(tempSvgPath, finalSvgPath);
      await fs.rename(tempGcodePathNcc, finalGcodePathNcc);

      console.log(`Copying GCode to: ${finalGcodePathNc}`);
      await fs.copyFile(finalGcodePathNcc, finalGcodePathNc);
      console.log(`GCode copied successfully`);

      // Clean up the temporary directory
      await fs.rm(tempRequestDir, { recursive: true, force: true });

      const response = {
        status: 'success',
        original: `/images/${path.basename(finalInputPath)}`,
        bgRemoved: `/images/${path.basename(result.bg_removed_path)}`,
        adjusted: `/images/${path.basename(finalAdjustedPath)}`,
        svg: `/images/${path.basename(finalSvgPath)}`,
        gcode: `/images/${path.basename(finalGcodePathNcc)}`,
        gcodeNc: `/images/${path.basename(finalGcodePathNc)}`,
      };

      console.log('Processing successful:', response);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error in /api/process_image:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  } else if (req.url.includes('/api/process_final')) {
    // Endpoint to process image for front-end preview (background removal + edges)
    try {
      if (!image || !sensitivity) {
        console.error('Missing image or sensitivity in request body');
        res.status(400).json({ status: 'error', message: 'Missing image or sensitivity' });
        return;
      }

      const sensitivityNum = parseInt(sensitivity, 10);
      if (isNaN(sensitivityNum) || sensitivityNum < 1 || sensitivityNum > 100) {
        console.error('Invalid sensitivity value:', sensitivity);
        res.status(400).json({ status: 'error', message: 'Sensitivity must be a number between 1 and 100' });
        return;
      }

      await ensureImagesDir();
      await cleanupOldFiles();

      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
      const imageBuffer = await validateImage(base64Data);

      // Create a temporary directory for this request
      const tempId = uuidv4();
      const tempRequestDir = path.join(TEMP_DIR, tempId);
      await fs.mkdir(tempRequestDir, { recursive: true });

      // Define temporary file paths
      const tempInputPath = path.join(tempRequestDir, `original.png`);
      const tempAdjustedPath = path.join(tempRequestDir, `adjusted.png`);
      const tempSvgPath = path.join(tempRequestDir, `adjusted.svg`);
      const tempGcodePath = path.join(tempRequestDir, `output.txt`);

      // Define final file paths
      const finalInputPath = path.join(IMAGES_DIR, `original.png`);
      const finalAdjustedPath = path.join(IMAGES_DIR, `adjusted.png`);

      console.log(`Saving original image to: ${tempInputPath}`);
      await fs.writeFile(tempInputPath, imageBuffer);
      console.log(`Original image saved successfully`);

      const now = Date.now();
      fileTimestamps.set(finalInputPath, now);
      fileTimestamps.set(finalAdjustedPath, now);

      const pythonCmd = process.env.PYTHON_CMD || 'python3';
      const scriptPath = path.join(SCRIPTS_DIR, 'process_image.py');
      console.log(`Resolved script path: ${scriptPath}`);
      const command = `${pythonCmd} "${scriptPath}" "${tempInputPath}" "${tempAdjustedPath}" "${tempSvgPath}" "${tempGcodePath}" ${sensitivityNum} "" false`;
      console.log(`Executing command: ${command}`);

      // Increase timeout to 20 seconds
      const { stdout, stderr } = await execPromise(command, { timeout: 20000 });

      if (stderr) {
        console.error('Script stderr:', stderr);
        if (stderr.includes('ModuleNotFoundError')) {
          res.status(500).json({ status: 'error', message: 'Python dependencies missing. Please install required libraries (e.g., opencv-python, rembg, onnxruntime).' });
          return;
        }
        res.status(500).json({ status: 'error', message: `Script error: ${stderr}` });
        return;
      }

      console.log('Python script stdout:', stdout);
      let result;
      try {
        result = JSON.parse(stdout);
      } catch (parseError) {
        console.error('Failed to parse stdout as JSON:', parseError);
        console.error('Raw stdout:', stdout);
        res.status(500).json({ status: 'error', message: `Failed to parse script output: ${parseError.message}` });
        return;
      }

      if (result.status === 'error') {
        console.error('Script error:', result.message);
        res.status(500).json({ status: 'error', message: result.message });
        return;
      }

      console.log('Checking if temporary files exist before moving...');
      const tempFiles = [tempInputPath, tempAdjustedPath];
      for (const tempFile of tempFiles) {
        const exists = await fs.access(tempFile).then(() => true).catch(() => false);
        console.log(`Temporary file ${tempFile} exists: ${exists}`);
        if (!exists) {
          throw new Error(`Temporary file ${tempFile} does not exist`);
        }
      }

      console.log('Deleting existing final files if they exist...');
      // Delete final files if they exist to avoid conflicts
      const finalFiles = [finalInputPath, finalAdjustedPath];
      for (const finalPath of finalFiles) {
        try {
          await fs.unlink(finalPath);
          console.log(`Deleted existing file: ${finalPath}`);
        } catch (error) {
          if (error.code !== 'ENOENT') { // Ignore if file doesn't exist
            console.error(`Error deleting file ${finalPath}:`, error);
            throw error;
          }
        }
      }

      console.log('Moving temporary files to final locations...');
      await fs.rename(tempInputPath, finalInputPath);
      console.log(`Moved ${tempInputPath} to ${finalInputPath}`);
      await fs.rename(tempAdjustedPath, finalAdjustedPath);
      console.log(`Moved ${tempAdjustedPath} to ${finalAdjustedPath}`);

      console.log('Cleaning up temporary directory...');
      await fs.rm(tempRequestDir, { recursive: true, force: true });
      console.log('Temporary directory cleaned up');

      const response = {
        status: 'success',
        bgRemoved: `/images/${path.basename(result.bg_removed_path)}`,
        edges: `/images/${path.basename(finalAdjustedPath)}`,
      };

      console.log('Edge processing successful:', response);
      res.status(200).json(response);
    } catch (error) {
      console.error('Error in /api/process_final:', error);
      res.status(500).json({ status: 'error', message: error.message });
    }
  } else {
    console.error('Endpoint not found:', req.url);
    res.status(404).json({ status: 'error', message: 'Endpoint not found' });
  }
}