import cv2
import threading
from PIL import Image

class Camera:
    def __init__(self):
        self.cap = None
        self.lock = threading.Lock()

    def start(self):
        with self.lock:
            if self.cap is None:
                self.cap = cv2.VideoCapture(0)
                if not self.cap.isOpened():
                    self.cap = None
                    raise RuntimeError("Could not start camera.")

    def stop(self):
        with self.lock:
            if self.cap is not None:
                self.cap.release()
                self.cap = None

    def get_frame(self):
        with self.lock:
            if self.cap is None:
                return None
            ret, frame = self.cap.read()
            if not ret:
                return None
            _, buffer = cv2.imencode('.jpg', frame)
            return buffer.tobytes()

    def capture_image(self):
        with self.lock:
            if self.cap is not None:
                ret, frame = self.cap.read()
                if ret:
                    # Convert the frame to a PIL Image
                    image = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    return image
                else:
                    raise RuntimeError("Failed to capture image.")
            else:
                raise RuntimeError("Camera is not running.")

