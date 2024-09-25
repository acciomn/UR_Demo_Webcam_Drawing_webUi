import signal as sig
import sys
import logging
from flask import Blueprint, Response, jsonify, render_template, url_for, request, send_from_directory
from app.controllers.camera_controller import gen, global_camera
import os, time
from PIL import Image

bp = Blueprint('camera', __name__)

def signal_handler(signal_rcvd, _):
    logging.info("Signal handler called with signal: %s", signal_rcvd)
    exit_app()

# Register the signal handler
sig.signal(sig.SIGINT, signal_handler)

@bp.route('/')
def index():
    return render_template('index.html')

@bp.route('/video_feed')
def video_feed():
    return Response(gen(global_camera),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@bp.route('/start_camera', methods=['POST'])
def start_camera():
    try:
        global_camera.start()
        return jsonify({'status': 'Camera started'})
    except Exception as e:
        return jsonify({'status': f'Error starting camera: {str(e)}'})

@bp.route('/stop_camera', methods=['POST'])
def stop_camera():
    try:
        global_camera.stop()
        return jsonify({'status': 'Camera stopped'})
    except Exception as e:
        return jsonify({'status': f'Error stopping camera: {str(e)}'})

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
        img.save(image_path, format='PNG')

        image_url = url_for('static', filename=f'images/{image_filename}')
        return jsonify({'status': 'Image captured successfully', 'image_url': image_url})
    except Exception as e:
        return jsonify({'status': f'Error capturing image: {str(e)}'})

@bp.route('/load_image', methods=['POST'])
def load_image():
    try:
        image_filename = request.form['image_path']
        image_path = os.path.join("app/static/images", image_filename)
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")
        image_url = url_for('static', filename=f'images/{image_filename}')
        return jsonify({'status': 'Image loaded successfully', 'image_url': image_url})
    except Exception as e:
        return jsonify({'status': f'Error loading image: {str(e)}'})

@bp.route('/display_image/<filename>')
def display_image(filename):
    return send_from_directory('app/static/images', filename)

@bp.route('/exit', methods=['POST'])
def exit_app():
    try:
        logging.info("Exit route called")
        # Clear the captured image
        save_dir = os.path.abspath("app/static/images")
        for filename in os.listdir(save_dir):
            file_path = os.path.join(save_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        global_camera.stop()
        os._exit(0)  # force quit the application
    except Exception as e:
        return f"Error exiting app: {str(e)}"

@bp.route('/clear_images', methods=['POST'])
def clear_images():
    try:
        save_dir = os.path.abspath("app/static/images")
        for filename in os.listdir(save_dir):
            file_path = os.path.join(save_dir, filename)
            if os.path.isfile(file_path):
                os.remove(file_path)
        return jsonify({'status': 'All images cleared successfully'})
    except Exception as e:
        return jsonify({'status': f'Error clearing images: {str(e)}'})
