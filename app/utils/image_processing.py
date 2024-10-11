import os
import cv2
import svgwrite
import requests
import numpy as np
import logging
from app.utils.file_handling import save_file

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)

def download_image(url, save_path):
    try:
        # Send a GET request to the URL
        response = requests.get(url)
        response.raise_for_status()  # Raise an error for bad status codes
        logging.info(f"Image downloaded successfully from {url}")

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

def remove_background(image_url, save_path):
    try:
        logging.info(f"Removing background for image: {image_url}")
        # Download the image
        download_image(image_url, save_path)

        # Read the image
        image = cv2.imread(save_path)
        if image is None:
            raise FileNotFoundError(f"Image not found at path: {save_path}")

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

def convert_to_svg(image):
    logging.info("Converting image to SVG")
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply a binary threshold to get a binary image
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    logging.info("Image converted to SVG successfully")
    return contours

def process_image(image_path, svg_path):
    logging.info(f"Processing image: {image_path} to SVG: {svg_path}")
    # Remove the background
    foreground = remove_background(image_path, svg_path)
    logging.info("Background removed")

    # Convert to SVG
    contours = convert_to_svg(foreground)
    logging.info("Image converted to SVG")

    # Save the SVG using the save_file function
    save_file(contours, svg_path, 'svg')
    logging.info("Image processing completed")

    return svg_path

def convert_png_to_svg(png_path):
    try:
        # Ensure the file exists
        if not os.path.exists(png_path):
            raise FileNotFoundError(f"File not found: {png_path}")

        # Read the image
        image = cv2.imread(png_path)
        if image is None:
            raise ValueError(f"Failed to read image: {png_path}")

        # Convert the image to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Apply a binary threshold to get a binary image
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        # Find contours
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Create the SVG file path
        svg_path = os.path.splitext(png_path)[0] + '.svg'

        # Create an SVG drawing
        dwg = svgwrite.Drawing(svg_path, profile='tiny')

        # Add contours to the SVG drawing
        for contour in contours:
            points = [(point[0][0], point[0][1]) for point in contour]
            dwg.add(dwg.polygon(points, fill='black'))

        # Save the SVG file
        dwg.save()

        logging.info(f"Converted {png_path} to {svg_path} successfully")
        return svg_path

    except Exception as e:
        logging.error(f"Error converting {png_path} to SVG: {str(e)}")
        raise

# Example usage
# convert_png_to_svg('app/static/images/captured_image.png')