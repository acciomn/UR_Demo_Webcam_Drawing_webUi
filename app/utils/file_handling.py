import os
import logging
import svgwrite
from PIL import Image
import time
from flask import jsonify, url_for

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
