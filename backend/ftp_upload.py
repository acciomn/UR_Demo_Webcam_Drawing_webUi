import sys
import paramiko
import os

def sftp_upload(host, username, password, local_path, remote_path):
    try:
        transport = paramiko.Transport((host, 22))
        transport.connect(username=username, password=password)
        sftp = paramiko.SFTPClient.from_transport(transport)

        print(f"Connected to {host} as {username}")

        sftp.put(local_path, remote_path)
        print(f"Uploaded {local_path} to {remote_path}")

        sftp.close()
        transport.close()
    except Exception as e:
        print(f"SFTP Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: ftp_upload.py <host> <username> <password> <local_path> <remote_path>", file=sys.stderr)
        sys.exit(1)
    _, host, username, password, local_path, remote_path = sys.argv
    sftp_upload(host, username, password, local_path, remote_path)
