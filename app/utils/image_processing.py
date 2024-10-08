import cv2
import numpy as np
import svgwrite

def remove_background(image_path):
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

    return foreground

def convert_to_svg(image, svg_path):
    # Convert the image to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Apply a binary threshold to get a binary image
    _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Create an SVG drawing
    dwg = svgwrite.Drawing(svg_path, profile='tiny')

    # Add contours to the SVG
    for contour in contours:
        points = [(point[0][0], point[0][1]) for point in contour]
        dwg.add(dwg.polygon(points, fill='black'))

    # Save the SVG file
    dwg.save()

def process_image(image_path, svg_path):
    # Remove the background
    foreground = remove_background(image_path)

    # Convert to SVG
    convert_to_svg(foreground, svg_path)