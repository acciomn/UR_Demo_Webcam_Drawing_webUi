import signal as sig
import sys
import logging
from flask import Blueprint, Response, jsonify, render_template, url_for, request
from app.controllers.camera_controller import gen, global_camera
import os, time
from PIL import Image

bp = Blueprint('camera', __name__)

def signal_handler(signal_rcvd, _):
    logging.info("Signal handler called with signal: %s", signal_rcvd)
    exit_app()

# Register the signal handler
sig.signal(sig.SIGINT, signal_handler)

def load_image(image_path):
    if os.path.exists(image_path):
        return Image.open(image_path)
    else:
        raise FileNotFoundError(f"Image not found at path: {image_path}")


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
        image_path = global_camera.capture_image()
        image_url = url_for('static', filename=f'images/{os.path.basename(image_path)}')
        return jsonify({'status': 'Image captured successfully', 'image_url': image_url})
    except Exception as e:
        return jsonify({'status': f'Error capturing image: {str(e)}'})

@bp.route('/save_image', methods=['POST'])
def save_image():
    try:
        # Define the directory where images will be saved
        save_dir = os.path.abspath("saved_images")
        os.makedirs(save_dir, exist_ok=True)

        # Get the desired format from the request (default to PNG)
        image_format = request.form.get('format', 'PNG').upper()

        # Generate a unique filename
        image_filename = f"image_{int(time.time())}.{image_format.lower()}"
        image_path = os.path.join(save_dir, image_filename)

        # Capture the image using the camera's capture_image method
        img = global_camera.capture_image()
        img.save(image_path, format=image_format)

        return jsonify({'status': 'Image saved successfully', 'image_url': image_path})
    except Exception as e:
        return jsonify({'status': f'Error saving image: {str(e)}'})

@bp.route('/load_image', methods=['POST'])
def load_image():
    try:
        image_path = request.form['image_path']
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at path: {image_path}")
        image_url = url_for('static', filename=f'images/{os.path.basename(image_path)}')
        return jsonify({'status': 'Image loaded successfully', 'image_url': image_url})
    except Exception as e:
        return jsonify({'status': f'Error loading image: {str(e)}'})

@bp.route('/exit', methods=['POST'])
def exit_app():
    try:
        logging.info("Exit route called")
        global_camera.stop()
        os._exit(0) # Force quit the application
        return "Application exited successfully."
    except Exception as e:
        return f"Error exiting app: {str(e)}"

"""
func = request.environ.get('werkzeug.server.shutdown')
        if func is None:
            raise RuntimeError('Not running with the Werkzeug Server')
        func()
"""
