import cv2
import numpy as np
from app.models.camera import Camera

global_camera = Camera()

def gen(camera):
    while True:
        frame = camera.get_frame()
        if frame:
            # Convert the frame to a numpy array
            np_frame = np.frombuffer(frame, dtype=np.uint8)
            # Decode the image
            img = cv2.imdecode(np_frame, cv2.IMREAD_COLOR)
            # Flip the image horizontally
            img_flipped = cv2.flip(img, 1)
            # Encode the flipped image back to JPEG format
            _, jpeg = cv2.imencode('.jpg', img_flipped)
            # Convert the encoded image to bytes
            frame_flipped = jpeg.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_flipped + b'\r\n\r\n')
