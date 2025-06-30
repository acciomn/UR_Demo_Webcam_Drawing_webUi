import { execFile } from 'child_process';
import path from 'path';
import net from 'net';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ success: false, error: 'Method not allowed' });
      return;
    }

    const filename = "output.nc";
    const ROBOT_IP = '192.168.1.160';
    const FTP_USER = 'root';
    const FTP_PASS = 'easybot';
    const REMOTE_DIR = '/programs';
    const localFile = path.join(process.cwd(), 'public', 'images', filename);
    const remoteFile = REMOTE_DIR + '/' + filename;

    // Log start of FTP
    console.log('Starting FTP upload (Python):', localFile);

    // Call the Python script for FTP upload
    execFile(
      'python',
      [
        path.join(process.cwd(), 'ftp_upload.py'),
        ROBOT_IP,
        FTP_USER,
        FTP_PASS,
        localFile,
        remoteFile
      ],
      { timeout: 20000 },
      (error, stdout, stderr) => {
        // Log all outputs for debugging
        console.log('FTP upload stdout:', stdout);
        console.log('FTP upload stderr:', stderr);

        if (error) {
          console.error('FTP upload error:', stderr || error.message);
          if (!res.headersSent) {
            res.status(500).json({ 
              success: false, 
              error: stderr || error.message, 
              ftpOutput: stdout, 
              ftpError: stderr,
              confirmation: `Failed to send ${filename} to /programs/ on robot.`
            });
          }
        } else {
          console.log('FTP upload successful. Output:', stdout);
          // After FTP, send URScript to robot to load and run the toolpath
          const script = `
def run_toolpath():
  path_id = mc_load_path("/programs/${filename}", False)
  mc_add_path(path_id, 1.0, 0.1, 0.0)
  mc_run_motion()
end
run_toolpath()
`;
          const client = new net.Socket();
          let responded = false;

          // Set a timeout for the socket (e.g., 10 seconds)
          client.setTimeout(10000, () => {
            if (!responded) {
              responded = true;
              console.error('Socket timeout');
              if (!res.headersSent) {
                res.status(500).json({ success: false, error: 'Socket timeout' });
              }
              client.destroy();
            }
          });

          client.connect(30001, ROBOT_IP, () => {
            console.log('Connected to robot, sending script:', filename);
            client.write(script);
            client.end();
          });
          client.on('error', (err) => {
            if (!responded) {
              responded = true;
              console.error('Socket error:', err.message);
              if (!res.headersSent) {
                res.status(200).json({ 
                  success: true, 
                  output: stdout, 
                  scriptError: err.message, 
                  ftpConfirmation: `Sent to /programs/${filename} on robot. FTP output: ${stdout}`,
                  ftpError: stderr
                });
              }
            }
          });
          client.on('close', () => {
            if (!responded) {
              responded = true;
              console.log('Socket closed, response sent');
              if (!res.headersSent) {
                res.status(200).json({ 
                  success: true, 
                  output: stdout, 
                  ftpConfirmation: `Sent to /programs/${filename} on robot. FTP output: ${stdout}`,
                  ftpError: stderr
                });
              }
            }
          });
        }
      }
    );
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message || 'Unknown error' });
    }
  }
}
