import cv2
import sys
import os
import numpy as np
import svgwrite


def process_image(input_path, adjusted_path, svg_path, gcode_path, sensitivity):
    try:
        print(f"Processing image: {input_path} with sensitivity: {sensitivity}")

        # Step 1: Edge Detection
        img = cv2.imread(input_path, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise FileNotFoundError(f"Could not load the input image: {input_path}")

        edges = cv2.Canny(img, int(sensitivity), int(sensitivity) * 2)

        # Save edge-detected image (Adjusted PNG)
        cv2.imwrite(adjusted_path, edges)
        print(f"Edge-detected image saved to: {adjusted_path}")

        # Step 2: Convert Adjusted Image to SVG
        print("Converting edge-detected image to SVG...")
        height, width = edges.shape
        dwg = svgwrite.Drawing(svg_path, profile="tiny", size=(width, height))

        # Generate paths based on edges
        for y in range(height):
            for x in range(width):
                if edges[y, x] > 0:  # Edge pixel
                    dwg.add(dwg.circle(center=(x, y), r=0.5, fill="black"))

        dwg.save()
        print(f"SVG file saved to: {svg_path}")

        # Step 3: Convert SVG to GCode (.ncc)
        print("Converting SVG to GCode...")
        with open(gcode_path, "w") as gcode_file:
            gcode_file.write("(GCode generated from SVG)\n")
            gcode_file.write("G21 (Set units to millimeters)\n")
            gcode_file.write("G90 (Absolute positioning)\n")
            gcode_file.write("G28 (Go to home position)\n")
            gcode_file.write("G1 F1500 (Set feed rate)\n")

            for y in range(height):
                for x in range(width):
                    if edges[y, x] > 0:  # Edge pixel
                        gcode_file.write(f"G1 X{x:.3f} Y{y:.3f}\n")

            gcode_file.write("G0 X0 Y0 (Return to home)\n")
            gcode_file.write("M30 (End of program)\n")
        print(f"GCode file saved to: {gcode_path}")

    except Exception as e:
        print(f"Error during processing: {e}")
        sys.exit(1)


if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: python3 process_image.py <input_path> <adjusted_path> <svg_path> <gcode_path> <sensitivity>")
        sys.exit(1)

    input_path = sys.argv[1]
    adjusted_path = sys.argv[2]
    svg_path = sys.argv[3]
    gcode_path = sys.argv[4]
    sensitivity = sys.argv[5]

    process_image(input_path, adjusted_path, svg_path, gcode_path, sensitivity)
