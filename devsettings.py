import os.path

APP_FOLDER = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(APP_FOLDER, "static")
TEMPLATES_FOLDER = os.path.join(APP_FOLDER, "templates")

DEBUG = True

MAX_CONTENT_LENGTH = 20 * 1024 * 1024

SECRET_KEY = "gf-KH8H4yX2u63xsu6mz"

DEPLOY_IP = "127.0.0.1"
DEPLOY_PORT = 8800