# import cv2
# import numpy as np
# from app.models.camera import Camera

# global_camera = Camera()

# def gen(camera):
#     while True:
#         frame = camera.get_frame()
#         if frame:
#             # Convert the frame to a numpy array
#             np_frame = np.frombuffer(frame, dtype=np.uint8)
#             # Decode the image
#             img = cv2.imdecode(np_frame, cv2.IMREAD_COLOR)
#             # Flip the image horizontally
#             img_flipped = cv2.flip(img, 1)
#             # Encode the flipped image back to JPEG format
#             _, jpeg = cv2.imencode('.jpg', img_flipped)
#             # Convert the encoded image to bytes
#             frame_flipped = jpeg.tobytes()

#             yield (b'--frame\r\n'
#                    b'Content-Type: image/jpeg\r\n\r\n' + frame_flipped + b'\r\n\r\n')




# # from flask import Blueprint, request, jsonify
# # from PIL import Image
# # import base64
# # import io
# # import cv2
# # import numpy as np

# # bp = Blueprint('camera', __name__)

# # @bp.route('/api/upload', methods=['POST'])
# # def upload_image():
# #     data = request.get_json()
# #     image_data = data['image']
    
# #     # Decode the image
# #     image_data = image_data.split(",")[1]  # Remove metadata
# #     image = Image.open(io.BytesIO(base64.b64decode(image_data)))

# #     # Convert image to OpenCV format for processing
# #     open_cv_image = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

# #     # Example processing logic to create an outline
# #     gray = cv2.cvtColor(open_cv_image, cv2.COLOR_BGR2GRAY)
# #     gray = cv2.medianBlur(gray, 5)
# #     edges = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY, 9, 9)
# #     color = cv2.bilateralFilter(open_cv_image, 9, 300, 300)
# #     cartoon = cv2.bitwise_and(color, color, mask=edges)

# #     # Save the cartoon (outline) image
# #     cartoon_image = Image.fromarray(cv2.cvtColor(cartoon, cv2.COLOR_BGR2RGB))
# #     cartoon_image.save("output_cartoon.png")  # Save outline image

# #     # Return the outline image path as response
# #     return jsonify({'status': 'success', 'outline': "output_cartoon.png"}), 200

import cv2
import numpy as np
import logging

def remove_background(image_path):
    try:
        logging.info(f"Removing background for image: {image_path}")

        # Read the image
        image = cv2.imread(image_path)
        if image is None:
            raise FileNotFoundError(f"Image not found at path: {image_path}")

        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply a binary threshold to get a binary image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY_INV)

        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Create a mask for the foreground
        mask = np.zeros_like(image)
        cv2.drawContours(mask, contours, -1, (255, 255, 255), thickness=cv2.FILLED)

        # Extract the foreground
        foreground = cv2.bitwise_and(image, mask)

        logging.info("Background removed successfully")
        return foreground

    except Exception as e:
        logging.error(f"Error removing background: {str(e)}")
        raise
