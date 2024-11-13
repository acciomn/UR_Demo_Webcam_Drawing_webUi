import os
import cv2
import svgwrite
from rembg import remove
from PIL import Image
import logging
from urllib.parse import urlparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)


def remove_background(image_url, save_path):
    try:
        # Extract the file path from the URL
        logging.info(f"Parsing URL: {image_url}")
        parsed_url = urlparse(image_url)
        image_path = os.path.join('app/static/images', os.path.basename(parsed_url.path))
        logging.info(f"Image path extracted: {image_path}")

        # Open the input image
        logging.info(f"Opening image: {image_path}")
        input_image = Image.open(image_path)
        logging.info(f"Image opened successfully: {image_path}")

        # Convert to a PIL image
        logging.info("Converting to PIL image")
        pil_image = Image.fromarray(input_image)
        logging.info("Image converted to PIL image successfully")

        # Remove the background
        logging.info("Removing background")
        output_image = remove(pil_image)
        logging.info("Background removed successfully")

        # Save the output image
        output_image.save(save_path)
        logging.info(f"Image saved to {save_path}")
        return save_path

    except Exception as e:
        logging.error(f"Error removing background: {str(e)}")


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

    # Convert PNG and save the contours as an SVG file
    convert_png_to_svg(foreground)
    return svg_path


"""
    # Convert to SVG
    contours = convert_to_svg(foreground)
    logging.info("Image converted to SVG")

    # Save the SVG using the save_file function
    save_file(contours, svg_path, 'svg')
    logging.info("Image processing completed")
"""


# return svg_path

def save_contours_as_svg(contours, svg_path):
    # Create an SVG drawing
    dwg = svgwrite.Drawing(svg_path, profile='tiny')

    # Add contours to the SVG drawing
    for contour in contours:
        points = [(point[0][0], point[0][1]) for point in contour]
        dwg.add(dwg.polygon(points, fill='black'))

    # Save the SVG file
    dwg.save()


"""
# Example usage
image_path = 'path/to/image.png'
image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
_, binary = cv2.threshold(image, 150, 255, cv2.THRESH_BINARY)
contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
save_contours_as_svg(contours, 'output.svg')
"""


def convert_png_to_svg(png_path):
    try:
        # Ensure the file exists
        if not os.path.exists(png_path):
            raise FileNotFoundError(f"File is not found: {png_path}")

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

