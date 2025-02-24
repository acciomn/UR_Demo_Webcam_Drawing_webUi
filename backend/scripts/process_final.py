import cv2
import sys
import os
import json

def process_image(input_path, output_path, sensitivity):
    try:
        print("Starting image processing...")
        
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Input file '{input_path}' does not exist.")

        print(f"Reading image from: {input_path}")
        image = cv2.imread(input_path, cv2.IMREAD_UNCHANGED)
        if image is None:
            raise ValueError("Failed to load the image. File may be corrupted or invalid.")

        # Check if image is already grayscale
        if len(image.shape) == 2:  # Grayscale image
            gray = image
        else:  # Color image
            print("Converting to grayscale...")
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        print(f"Applying edge detection with sensitivity: {sensitivity}")
        edges = cv2.Canny(gray, int(sensitivity), int(sensitivity) * 2)

        print(f"Saving processed image to: {output_path}")
        cv2.imwrite(output_path, edges)
        print("Image processing complete.")

        # Return result for API integration
        return {"status": "success", "output_path": output_path}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    print("Script started with arguments:", sys.argv)
    
    if len(sys.argv) != 4:
        print("Usage: python3 process_final.py <input_path> <output_path> <sensitivity>")
        sys.exit(1)

    input_path = sys.argv[1]
    output_path = sys.argv[2]
    sensitivity = sys.argv[3]

    result = process_image(input_path, output_path, sensitivity)
    print(json.dumps(result))
    if result["status"] == "error":
        sys.exit(1)