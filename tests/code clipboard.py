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