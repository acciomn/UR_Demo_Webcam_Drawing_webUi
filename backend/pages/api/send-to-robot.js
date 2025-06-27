import { exec } from 'child_process';
import path from 'path';
import net from 'net';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const { filename } = req.body;
  if (!filename) {
    res.status(400).json({ success: false, error: 'No filename provided' });
    return;
  }

  // Always use the file from public/images
  const ROBOT_IP = '192.168.1.160';
  const FTP_USER = 'root';
  const FTP_PASS = 'easybot';
  const REMOTE_DIR = '/programs';
  const localFile = path.join(process.cwd(), 'public', 'images', path.basename(filename));

  // FTP upload using lftp
  const lftpCmd = `lftp -u ${FTP_USER},${FTP_PASS} sftp://${ROBOT_IP} -e "cd ${REMOTE_DIR}; put ${localFile}; bye"`;

  exec(lftpCmd, (error, stdout, stderr) => {
    if (error) {
      res.status(500).json({ success: false, error: stderr || error.message });
    } else {
      // After FTP, send URScript to robot to load and run the toolpath
      const script = `
def run_toolpath():
  path_id = mc_load_path("/programs/${path.basename(filename)}", False)
  mc_add_path(path_id, 1.0, 0.1, 0.0)
  mc_run_motion()
end
run_toolpath()
`;
      const client = new net.Socket();
      client.connect(30001, ROBOT_IP, () => {
        client.write(script);
        client.end();
      });
      client.on('error', (err) => {
        res.status(200).json({ success: true, output: stdout, scriptError: err.message });
      });
      client.on('close', () => {
        res.status(200).json({ success: true, output: stdout });
      });
    }
  });
}
}
