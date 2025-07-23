# Face Drawing Robot Demo Setup Guide
Created by Jasmin Marwad (jama@universal-robots.com)

This guide walks you through setting up and running the Face Drawing Robot Demo locally.
---
## 🛠️ Prerequisites
- `Node.js` and `npm` installed
- Laptop connected to robot with ethernet
- URCap: `Remote TCP & Toolpath` installed on robot
---
## 📦 Backend Setup
1. Open a terminal and navigate to the `backend` folder:
```bash
cd UR_Demo_Webcam_Drawing_webUi/backend
npm install
npm run dev
```
2. Open a second terminal and navigate to the `frontend` folder
```bash
cd UR_Demo_Webcam_Drawing_webUi/frontend
npm install
npm start
```
3. In `UR_Demo_Webcam_Drawing_webUi/backend/pages/api/send-to-robot.js` change `const ROBOT_IP = '192.168.1.160';` to the IP address of the robot you are connecting to. 

4. The WebUI should be hosted on `localhost:3000` on your browser.

5. Use WebUI to take a picture with the device camera, or upload a picture. Click `Save GCode`, then `Process Edges`, then `Send to Robot`
buttons. 

6. `output.nc` file should appear in robot's `/programs` file. 
## 🤖 Robot Setup
1. Make a simple program on the robot. Add a toolpath from the URCap `Remote TCP & Toolpath`

2. Create a feature plane of the drawing plane

3. Teach TCP of drawing tool

4. Select `output.nc` from the `\programs` folder


