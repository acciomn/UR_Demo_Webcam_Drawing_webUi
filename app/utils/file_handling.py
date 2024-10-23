import os
import logging
import svgwrite
import requests
import numpy as np
import cv2

def save_file(image, file_path, file_format):
    logging.info(f"Saving file: {file_path} as {file_format}")
    # Ensure the directory exists
    # save_dir = os.path.abspath("app/static/images")
    save_dir = os.path.dirname(file_path)
    if not os.path.exists(save_dir):
        os.makedirs(save_dir)

    try:
        if file_format == 'png':
            image.save(file_path, format='PNG')  # Save the PNG file
        elif file_format == 'svg':
            # Create an SVG drawing
            dwg = svgwrite.Drawing(file_path, profile='tiny')
            # Add contours to the SVG
            for contour in image:
                points = [(point[0][0], point[0][1]) for point in contour]
                dwg.add(dwg.polygon(points, fill='black'))
            # dwg.save(file_path)
            image.save(file_path, format='SVG') # Save the SVG file
        logging.info(f"File saved successfully: {file_path}")
    except Exception as e:
        logging.error(f"Error saving file {file_path}: {e}")
        raise

def download_image(image_url, save_path):
    try:
        # Send a GET request to the URL
        response = requests.get(image_url)
        response.raise_for_status()  # Raise an error for bad status codes
        logging.info(f"Image downloaded successfully from {image_url}")

        # Convert the response content to a numpy array
        image_array = np.frombuffer(response.content, np.uint8)
        logging.info("Image content converted to numpy array")

        # Decode the image array to an OpenCV image
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        if image is None:
            logging.info("Failed to decode image")
            raise ValueError("Failed to decode image")

        else:
            logging.info("Image decoded successfully")

        # Save the image to the specified path
        cv2.imwrite(save_path, image)
        print(f"Image saved to {save_path}")
        logging.info(f"Image saved to {save_path}")
        return save_path

    except Exception as e:
        print(f"Error downloading or saving image: {str(e)}")
        logging.info(f"Error downloading or saving image: {str(e)}")