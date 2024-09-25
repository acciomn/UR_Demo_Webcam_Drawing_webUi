from flask import Flask
import os
from instance.config import config

def create_app(config_name=None):
    app = Flask(__name__, static_folder='static')

    # Load the configuration from the instance folder
    config_name = config_name or os.getenv('FLASK_CONFIG', 'default')
    try:
        app.config.from_object(config[config_name])
    except KeyError:
        raise ValueError(f"Invalid configuration name: {config_name}")
    except ModuleNotFoundError:
        raise ImportError(f"Cannot find the configuration module 'instance.config.{config[config_name]}'")

    # Set environment variables programmatically (if needed)
    os.environ['DEBUG'] = 'True'
    os.environ['FLASK_CONFIG'] = 'development'

    with app.app_context():
        from .controllers import camera_controller
        from .views import views  # Import the views module
        # app.register_blueprint(camera_controller.bp)
        app.register_blueprint(views.bp)  # Register the views blueprint

    return app
