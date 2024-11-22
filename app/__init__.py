
import os
import time
import logging
import cv2
import numpy as np
from flask import Blueprint, jsonify, request, url_for
from PIL import Image
import svgwrite
from app.models.camera import Camera

# Initialize the camera instance
global_camera = Camera()

# Initialize the Blueprint for handling camera-related routes
bp = Blueprint('camera', __name__)

# This function streams the camera feed to the browser
def gen(camera):
    while True:
        frame = camera.get_frame()  # Get a frame from the camera
        if frame:
            # Convert the frame to a numpy array
            np_frame = np.frombuffer(frame, dtype=np.uint8)
            # Decode the image
            img = cv2.imdecode(np_frame, cv2.IMREAD_COLOR)
            # Flip the image horizontally for a better user experience
            img_flipped = cv2.flip(img, 1)
            # Encode the flipped image back to JPEG format
            _, jpeg = cv2.imencode('.jpg', img_flipped)
            # Convert the encoded image to bytes for streaming
            frame_flipped = jpeg.tobytes()

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame_flipped + b'\r\n\r\n')

# Capture image from the camera and save it
@bp.route('/capture_image', methods=['POST'])
def capture_image():
    try:
        # Define the directory where images will be saved
        save_dir = os.path.abspath("app/static/images")
        os.makedirs(save_dir, exist_ok=True)

        # Generate a unique filename for the captured image
        image_filename = f"captured_{int(time.time())}.png"
        image_path = os.path.join(save_dir, image_filename)

        # Capture the image using the camera's capture_image method
        img = global_camera.capture_image()
        # Save the image as a PNG file
        img.save(image_path, format='PNG')

        # Return the URL of the saved image
        image_url = url_for('static', filename=f'images/{image_filename}')
        return jsonify({'status': 'Image captured successfully', 'image_url': image_url})
    except Exception as e:
        return jsonify({'status': f'Error capturing image: {str(e)}'})

# Function to remove the background using OpenCV (if you don't want to use removebg)
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

# Function to process the image, detect edges, and generate an SVG outline
def capture_and_process_image(camera, save_path):
    try:
        # Capture the image using the camera's capture_image method
        logging.info("Capturing image from webcam")
        img = global_camera.capture_image()

        # Save the captured image temporarily
        temp_image_path = "temp_captured_image.png"
        img.save(temp_image_path, format='PNG')

        # Remove the background
        logging.info("Removing background from image")
        img_no_bg = remove_background(temp_image_path)

        # Convert the image to a format suitable for OpenCV
        img_no_bg_cv = cv2.cvtColor(img_no_bg, cv2.COLOR_RGB2BGR)

        # Convert the image to grayscale
        logging.info("Converting image to grayscale")
        gray = cv2.cvtColor(img_no_bg_cv, cv2.COLOR_BGR2GRAY)

        # Apply a binary threshold to get a binary image
        logging.info("Applying binary threshold")
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        # Find contours
        logging.info("Finding contours")
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Create an SVG drawing to save the contours
        logging.info(f"Saving contours to SVG file: {save_path}")
        dwg = svgwrite.Drawing(save_path, profile='tiny')

        # Add contours to the SVG drawing
        for contour in contours:
            points = [(float(point[0][0]), float(point[0][1])) for point in contour]
            dwg.add(dwg.polygon(points, fill='black'))

        # Save the SVG file
        dwg.save()
        logging.info(f"Image processed and saved as SVG: {save_path}")

    except Exception as e:
        logging.error(f"Error processing image: {str(e)}")
        raise RuntimeError(f"Error processing image: {str(e)}")
