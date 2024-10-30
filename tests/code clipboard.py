@bp.route('/capture_image', methods=['POST'])
def capture_image():
    try:

        # Define the directory where images will be saved
        save_dir = os.path.abspath("app/static/images")
        os.makedirs(save_dir, exist_ok=True)

        # Generate a unique filename
        image_filename = f"captured_{int(time.time())}.png"
        image_path = os.path.join(save_dir, image_filename)

        # Capture the image using the camera's capture_image method
        img = global_camera.capture_image()
        # Save the image using the PIL save method
        img.save(image_path, format='PNG')
        # Save the image using the save_file function
        # save_file(img, image_url, 'png')

        image_url = url_for('static', filename=f'images/{image_filename}')
        return jsonify({'status': 'Image captured successfully', 'image_url': image_url})
    except Exception as e:
        return jsonify({'status': f'Error capturing image: {str(e)}'})

def remove_background(image_url, save_path):
    try:
        logging.info(f"Removing background for image: {image_url}")
        # Download the image
        # download_image(image_url, save_path)

        # Read the image
        image = cv2.imread(image_url)
        if image is None:
            raise FileNotFoundError(f"Image not found at path: {image_url}")

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

# pil_image = Image.fromarray(image)

def capture_and_process_image(camera, save_path):
    try:
        # Capture the image using the camera's capture_image method
        logging.info("Capturing image from webcam")
        img = global_camera.capture_image()

        # Remove the background
        logging.info("Removing background from image")
        img_no_bg = remove(img)

        # Convert the image to a format suitable for OpenCV
        img_no_bg_cv = cv2.cvtColor(np.array(img_no_bg), cv2.COLOR_RGB2BGR)

        # Convert the image to grayscale
        logging.info("Converting image to grayscale")
        gray = cv2.cvtColor(img_no_bg_cv, cv2.COLOR_BGR2GRAY)

        # Apply a binary threshold to get a binary image
        logging.info("Applying binary threshold")
        _, binary = cv2.threshold(gray, 150, 255, cv2.THRESH_BINARY)

        # Find contours
        logging.info("Finding contours")
        contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        # Create an SVG drawing
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