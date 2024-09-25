from app import create_app

config_name = 'default'  # or 'development', 'testing', 'production'
app = create_app(config_name)

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
