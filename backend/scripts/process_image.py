import cv2
import sys
import os
import numpy as np
import svgwrite
import json
from rembg import remove

def generate_hatching_lines(contour, scale, x_offset, y_offset, spacing=4, angle=45, exclude_face=False, face_center=None, face_radius=None):
    """Generate hatching lines within a contour for shading/texture, excluding the face region if specified."""
    try:
        # Skip small contours to reduce noise
        if cv2.contourArea(contour) < 2000:
            return []

        # Check if this contour is the face (largest contour near the center)
        if exclude_face and face_center and face_radius:
            x, y, w, h = cv2.boundingRect(contour)
            contour_center = (x + w / 2, y + h / 2)
            distance_to_face_center = np.sqrt((contour_center[0] - face_center[0])**2 + (contour_center[1] - face_center[1])**2)
            if distance_to_face_center < face_radius:
                return []  # Skip hatching for the face region

        x, y, w, h = cv2.boundingRect(contour)
        angle_rad = np.deg2rad(angle)
        step_x = spacing * np.cos(angle_rad)
        step_y = spacing * np.sin(angle_rad)
        
        mask = np.zeros((h, w), dtype=np.uint8)
        cv2.drawContours(mask, [contour], -1, 255, thickness=cv2.FILLED, offset=(-x, -y))
        
        hatching_lines = []
        t = 0
        while True:
            x1 = x + t * step_x
            y1 = y + t * step_y
            x2 = x + w * np.cos(angle_rad) + t * step_x
            y2 = y + h * np.sin(angle_rad) + t * step_y
            
            if x1 > x + w and x2 > x + w and y1 > y + h and y2 > y + h:
                break
            
            line = []
            for px in range(int(min(x1, x2)), int(max(x1, x2)) + 1):
                py = y1 + (px - x1) * (y2 - y1) / (x2 - x1 + 1e-6)
                if px >= x and px < x + w and py >= y and py < y + h:
                    if mask[int(py - y), int(px - x)] == 255:
                        line.append((px, py))
            
            if len(line) > 1:
                scaled_line = [( (pt[0] - min_x) * scale + x_offset, (pt[1] - min_y) * scale + y_offset ) for pt in line]
                hatching_lines.append(scaled_line)
            
            t += 1
        
        return hatching_lines
    except Exception as e:
        return []

def generate_text_gcode(text, x_start, y_start, scale, font_scale=0.5):
    """Generate GCode for drawing text at the specified position."""
    gcode_lines = []
    gcode_lines.append("(Drawing text)")
    gcode_lines.append(f"G0 Z5 (Pen up)")
    
    # Simple font representation for A-Z and space
    font = {
        'A': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 0), (0.5, 1, 1, 1)],  # A
        'B': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 1), (0, 1, 1, 1), (1, 1, 1, 0), (0, 0, 1, 0)],  # B
        'C': [(1, 0, 0, 0), (0, 0, 0, 2), (0, 2, 1, 2)],  # C
        'D': [(0, 0, 0, 2), (0, 2, 1, 1.5), (1, 1.5, 1, 0.5), (1, 0.5, 0, 0)],  # D
        'E': [(1, 0, 0, 0), (0, 0, 0, 2), (0, 2, 1, 2), (0, 1, 1, 1)],  # E
        'F': [(0, 0, 0, 2), (0, 2, 1, 2), (0, 1, 1, 1)],  # F
        'G': [(1, 0, 0, 0), (0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 1)],  # G
        'H': [(0, 0, 0, 2), (1, 0, 1, 2), (0, 1, 1, 1)],  # H
        'I': [(0, 0, 1, 0), (0.5, 0, 0.5, 2), (0, 2, 1, 2)],  # I
        'J': [(0, 0, 1, 0), (1, 0, 1, 2), (1, 2, 0, 2)],  # J
        'K': [(0, 0, 0, 2), (1, 0, 0, 1), (0, 1, 1, 2)],  # K
        'L': [(0, 0, 0, 2), (0, 0, 1, 0)],  # L
        'M': [(0, 0, 0, 2), (0, 2, 0.5, 1), (0.5, 1, 1, 2), (1, 2, 1, 0)],  # M
        'N': [(0, 0, 0, 2), (0, 2, 1, 0), (1, 0, 1, 2)],  # N
        'O': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 0), (1, 0, 0, 0)],  # O
        'P': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 1), (1, 1, 0, 1)],  # P
        'Q': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 0), (1, 0, 0, 0), (0.5, 0.5, 1, 0)],  # Q
        'R': [(0, 0, 0, 2), (0, 2, 1, 2), (1, 2, 1, 1), (1, 1, 0, 1), (0, 1, 1, 0)],  # R
        'S': [(1, 0, 0, 0), (0, 0, 0, 1), (0, 1, 1, 1), (1, 1, 1, 2), (1, 2, 0, 2)],  # S
        'T': [(0, 2, 1, 2), (0.5, 2, 0.5, 0)],  # T
        'U': [(0, 2, 0, 0), (0, 0, 1, 0), (1, 0, 1, 2)],  # U
        'V': [(0, 2, 0.5, 0), (0.5, 0, 1, 2)],  # V
        'W': [(0, 2, 0, 0), (0, 0, 0.5, 1), (0.5, 1, 1, 0), (1, 0, 1, 2)],  # W
        'X': [(0, 0, 1, 2), (0, 2, 1, 0)],  # X
        'Y': [(0, 2, 0.5, 1), (0.5, 1, 1, 2), (0.5, 1, 0.5, 0)],  # Y
        'Z': [(0, 2, 1, 2), (1, 2, 0, 0), (0, 0, 1, 0)],  # Z
        ' ': [],  # Space
    }
    
    current_x = x_start
    char_width = 1.0 * font_scale  # Width of each character in drawing units
    char_height = 2.0 * font_scale  # Height of each character in drawing units
    
    for char in text.upper():
        if char not in font:
            current_x += char_width * 1.5  # Skip unsupported characters with spacing
            continue
        
        char_lines = font[char]
        for line in char_lines:
            x1, y1, x2, y2 = line
            # Scale and position the line
            x1 = current_x + x1 * char_width
            y1 = y_start + y1 * char_height
            x2 = current_x + x2 * char_width
            y2 = y_start + y2 * char_height
            # Convert to GCode coordinates
            x1 = x1 * scale
            y1 = y1 * scale
            x2 = x2 * scale
            y2 = y2 * scale
            gcode_lines.append(f"G0 X{x1:.3f} Y{y1:.3f} (Move to start of line)")
            gcode_lines.append("G1 Z0 (Pen down)")
            gcode_lines.append(f"G1 X{x2:.3f} Y{y2:.3f} (Draw line)")
            gcode_lines.append("G0 Z5 (Pen up)")
        
        current_x += char_width * 1.5  # Add spacing between characters
    
    return gcode_lines

def process_image(input_path, adjusted_path, svg_path, gcode_path, sensitivity, name, draw_name):
    global min_x, min_y  # Make min_x, min_y global for use in generate_hatching_lines
    try:
        # Read the original image and save it
        original_img = cv2.imread(input_path, cv2.IMREAD_COLOR)
        if original_img is None:
            raise FileNotFoundError(f"Could not load the input image: {input_path}")
        cv2.imwrite(input_path, original_img)  # Ensure original.png is saved explicitly

        # Validate image dimensions
        height, width = original_img.shape[:2]
        if width < 50 or height < 50:
            raise ValueError("Image dimensions are too small for processing")

        # Background removal using rembg
        img_no_bg = remove(original_img)
        img_no_bg_cv = cv2.cvtColor(np.array(img_no_bg), cv2.COLOR_RGBA2BGR)

        bg_removed_path = os.path.join(os.path.dirname(adjusted_path), "no_bg.png")
        success = cv2.imwrite(bg_removed_path, img_no_bg_cv)
        if not success:
            raise IOError(f"Failed to save {bg_removed_path}")

        # Edge detection on background-removed image
        gray = cv2.cvtColor(img_no_bg_cv, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)  # Enhance contrast
        gray = cv2.bilateralFilter(gray, 9, 75, 75)  # Use bilateral filter to preserve edges while reducing noise
        edges = cv2.Canny(gray, int(sensitivity) // 2, int(sensitivity) * 2)  # Adjusted thresholds
        kernel = np.ones((3, 3), np.uint8)
        edges = cv2.dilate(edges, kernel, iterations=2)
        edges = cv2.erode(edges, kernel, iterations=1)
        # Apply closing to connect fragmented edges
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

        # Save adjusted.png (background-removed + edges)
        success = cv2.imwrite(adjusted_path, edges)
        if not success:
            raise IOError(f"Failed to save {adjusted_path}")

        # Convert to SVG with contours
        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)

        # Simplify contours to reduce noise, but preserve details
        epsilon_factor = 0.001  # Reduced epsilon for more detail
        simplified_contours = []
        for contour in contours:
            if len(contour) > 2 and cv2.contourArea(contour) > 100:  # Filter small contours
                epsilon = epsilon_factor * cv2.arcLength(contour, True)
                approx = cv2.approxPolyDP(contour, epsilon, True)
                if len(approx) > 2:
                    simplified_contours.append(approx)

        if not simplified_contours:
            raise ValueError("No valid contours found in the edge-detected image")

        # Identify the face contour (largest contour near the center)
        image_center = (width / 2, height / 2)
        face_contour = max(simplified_contours, key=cv2.contourArea, default=None)
        face_center = None
        face_radius = None
        if face_contour is not None:
            x, y, w, h = cv2.boundingRect(face_contour)
            face_center = (x + w / 2, y + h / 2)
            face_radius = max(w, h) / 2

        # Calculate the bounding box of all simplified contours
        min_x, min_y = float('inf'), float('inf')
        max_x, max_y = float('-inf'), float('-inf')

        for contour in simplified_contours:
            for pt in contour:
                x, y = pt[0][0], pt[0][1]
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)

        current_width = max_x - min_x
        current_height = max_y - min_y

        if current_width < 10 or current_height < 10:
            raise ValueError("Drawing size is too small after contour simplification")

        # Generate SVG
        height, width = edges.shape
        dwg = svgwrite.Drawing(svg_path, profile="tiny", size=(width, height))
        for contour in simplified_contours:
            points = [(float(pt[0][0]), float(pt[0][1])) for pt in contour]
            if len(points) > 1:
                dwg.add(dwg.polyline(points, fill="none", stroke="black"))
        dwg.save()

        # Target A4 dimensions (in mm) with margins
        a4_width = 210  # mm
        a4_height = 297  # mm
        margin = 10  # mm
        target_width = a4_width - 2 * margin  # 190 mm
        target_height = a4_height - 2 * margin  # 277 mm

        # Calculate scaling factors
        scale_x = target_width / current_width
        scale_y = target_height / current_height
        scale = min(scale_x, scale_y)  # Preserve aspect ratio

        # Calculate the scaled dimensions
        scaled_width = current_width * scale
        scaled_height = current_height * scale

        # Calculate offsets to center the drawing
        x_offset = (a4_width - scaled_width) / 2
        y_offset = (a4_height - scaled_height) / 2

        # Convert to GCode with scaling and centering
        with open(gcode_path, "w") as gcode_file:
            gcode_file.write("(GCode generated from image for 2D drawing)\n")
            gcode_file.write("G21 (Set units to millimeters)\n")
            gcode_file.write("G90 (Absolute positioning)\n")
            gcode_file.write("G28 (Go to home position)\n")
            gcode_file.write("G1 F1500 (Set feed rate)\n")
            gcode_file.write("M3 S1000 (Spindle on)\n")

            # Draw the main contours
            for idx, contour in enumerate(simplified_contours):
                if len(contour) < 2:
                    continue  # Skip contours with too few points
                gcode_file.write(f"(Contour {idx + 1})\n")
                gcode_file.write("G0 Z5 (Pen up)\n")
                first_point = contour[0][0]
                x = (first_point[0] - min_x) * scale + x_offset
                y = (first_point[1] - min_y) * scale + y_offset
                gcode_file.write(f"G0 X{x:.3f} Y{y:.3f}\n")
                gcode_file.write("G1 Z0 (Pen down)\n")
                for pt in contour[1:]:
                    x = (pt[0][0] - min_x) * scale + x_offset
                    y = (pt[0][1] - min_y) * scale + y_offset
                    gcode_file.write(f"G1 X{x:.3f} Y{y:.3f}\n")
                gcode_file.write("G0 Z5 (Pen up)\n")

            # Add hatching lines for texture/shading, excluding the face
            for idx, contour in enumerate(simplified_contours):
                if cv2.contourArea(contour) < 2000:
                    continue
                hatching_lines = generate_hatching_lines(
                    contour, scale, x_offset, y_offset, spacing=4, angle=45,
                    exclude_face=True, face_center=face_center, face_radius=face_radius
                )
                for line in hatching_lines:
                    if len(line) < 2:
                        continue
                    gcode_file.write(f"(Hatching line {idx + 1})\n")
                    gcode_file.write("G0 Z5 (Pen up)\n")
                    x, y = line[0]
                    gcode_file.write(f"G0 X{x:.3f} Y{y:.3f}\n")
                    gcode_file.write("G1 Z0 (Pen down)\n")
                    for pt in line[1:]:
                        x, y = pt
                        gcode_file.write(f"G1 X{x:.3f} Y{y:.3f}\n")
                    gcode_file.write("G0 Z5 (Pen up)\n")

            # Draw the name below the image if draw_name is true and name is not empty
            if draw_name.lower() == 'true' and name:
                # Position the text below the image
                text_y_start = y_offset + scaled_height + 10  # 10mm below the image
                text_gcode = generate_text_gcode(name, x_offset, text_y_start, scale, font_scale=0.5)
                for line in text_gcode:
                    gcode_file.write(f"{line}\n")

            gcode_file.write("G0 X0 Y0 Z5 (Return to home)\n")
            gcode_file.write("M5 (Spindle off)\n")
            gcode_file.write("M30 (End of program)\n")

        return {
            "status": "success",
            "bg_removed_path": bg_removed_path,
            "original_path": input_path,
            "adjusted_path": adjusted_path,
            "svg_path": svg_path,
            "gcode_path": gcode_path
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 6 or len(sys.argv) > 8:
        print(json.dumps({"status": "error", "message": "Usage: python3 process_image.py <input_path> <adjusted_path> <svg_path> <gcode_path> <sensitivity> [name] [draw_name]"}))
        sys.exit(1)

    input_path = sys.argv[1]
    adjusted_path = sys.argv[2]
    svg_path = sys.argv[3]
    gcode_path = sys.argv[4]
    sensitivity = sys.argv[5]
    name = sys.argv[6] if len(sys.argv) > 6 else ""
    draw_name = sys.argv[7] if len(sys.argv) > 7 else "false"

    result = process_image(input_path, adjusted_path, svg_path, gcode_path, sensitivity, name, draw_name)
    print(json.dumps(result))
    if result["status"] == "error":
        sys.exit(1)