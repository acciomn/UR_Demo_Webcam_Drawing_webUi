import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'you-will-never-guess')
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ['true', '1', 't']
    TESTING = os.environ.get('TESTING', 'False').lower() in ['true', '1', 't']

class DevelopmentConfig(Config):
    DEBUG = True
    # Add any development-specific configurations here

class TestingConfig(Config):
    TESTING = True
    # Add any testing-specific configurations here

class ProductionConfig(Config):
    DEBUG = False
    # Add any production-specific configurations here

# Dictionary to map the configuration names to the classes
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
