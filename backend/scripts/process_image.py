import cv2
import sys
import os
import numpy as np
import svgwrite
import json
from rembg import remove  # For background removal

def process_image(input_path, adjusted_path, svg_path, gcode_path, sensitivity):
    try:
        print(f"Processing image: {input_path} with sensitivity: {sensitivity}")

        # Read the original image and save it
        original_img = cv2.imread(input_path, cv2.IMREAD_COLOR)
        if original_img is None:
            raise FileNotFoundError(f"Could not load the input image: {input_path}")
        cv2.imwrite(input_path, original_img)  # Ensure original.png is saved explicitly
        print(f"Original image saved to: {input_path}")

        # Background removal using rembg
        print("Removing background...")
        img_no_bg = remove(original_img)  # Returns a PIL image
        img_no_bg = cv2.cvtColor(np.array(img_no_bg), cv2.COLOR_RGBA2BGR)
        bg_removed_path = os.path.join(os.path.dirname(adjusted_path), "no_bg.png")
        cv2.imwrite(bg_removed_path, img_no_bg)
        print(f"Background-removed image saved to: {bg_removed_path}")

        # Edge detection on background-removed image
        gray = cv2.cvtColor(img_no_bg, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, int(sensitivity), int(sensitivity) * 2)
        
        # Save adjusted.png (background-removed + edges)
        print(f"Saving edge-detected image to: {adjusted_path}")
        success = cv2.imwrite(adjusted_path, edges)
        if not success:
            raise IOError(f"Failed to save {adjusted_path}")
        print(f"Edge-detected image (adjusted.png) saved successfully to: {adjusted_path}")

        # Convert to SVG with contours
        print("Converting edge-detected image to SVG...")
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        height, width = edges.shape
        dwg = svgwrite.Drawing(svg_path, profile="tiny", size=(width, height))

        for contour in contours:
            points = [(float(pt[0][0]), float(pt[0][1])) for pt in contour]
            if len(points) > 1:
                dwg.add(dwg.polyline(points, fill="none", stroke="black"))
        dwg.save()
        print(f"SVG file saved to: {svg_path}")

        # Convert to GCode
        print("Converting SVG to GCode...")
        scale = 0.1  # Scale pixels to mm (adjust as needed)
        with open(gcode_path, "w") as gcode_file:
            gcode_file.write("(GCode generated from image)\n")
            gcode_file.write("G21 (Set units to millimeters)\n")
            gcode_file.write("G90 (Absolute positioning)\n")
            gcode_file.write("G28 (Go to home position)\n")
            gcode_file.write("G1 F1500 (Set feed rate)\n")
            gcode_file.write("M3 S1000 (Spindle on)\n")

            for contour in contours:
                gcode_file.write("G0 Z5 (Pen up)\n")
                for i, pt in enumerate(contour):
                    x, y = pt[0][0] * scale, pt[0][1] * scale
                    if i == 0:
                        gcode_file.write(f"G0 X{x:.3f} Y{y:.3f}\n")
                        gcode_file.write("G1 Z0 (Pen down)\n")
                    else:
                        gcode_file.write(f"G1 X{x:.3f} Y{y:.3f}\n")
                gcode_file.write("G0 Z5 (Pen up)\n")

            gcode_file.write("G0 X0 Y0 Z5 (Return to home)\n")
            gcode_file.write("M5 (Spindle off)\n")
            gcode_file.write("M30 (End of program)\n")
        print(f"GCode file saved to: {gcode_path}")

        return {
            "status": "success",
            "original_path": input_path,  # Original PNG
            "adjusted_path": adjusted_path,  # Background-removed + edges PNG
            "svg_path": svg_path,
            "gcode_path": gcode_path
        }

    except Exception as e:
        print(f"Error during processing: {e}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) != 6:
        print("Usage: python3 process_image.py <input_path> <adjusted_path> <svg_path> <gcode_path> <sensitivity>")
        sys.exit(1)

    input_path = sys.argv[1]
    adjusted_path = sys.argv[2]
    svg_path = sys.argv[3]
    gcode_path = sys.argv[4]
    sensitivity = sys.argv[5]

    result = process_image(input_path, adjusted_path, svg_path, gcode_path, sensitivity)
    print(json.dumps(result))
    if result["status"] == "error":
        sys.exit(1)