from __future__ import absolute_import
from flask import Flask, render_template, redirect, url_for
from flask.ext.login import current_user
from settings import STATIC_FOLDER, TEMPLATES_FOLDER, SECRET_KEY, MAX_CONTENT_LENGTH
from .blueprints import blueprints
from .models import establish_connections
from .utils import jsonify, get_all_script_paths

app = Flask(__name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATES_FOLDER)
app.secret_key = SECRET_KEY
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH

# Login management

from flask.ext.login import LoginManager
from leveldbkit import NotFoundError
from .models import User

login_manager = LoginManager()
login_manager.setup_app(app)

@login_manager.user_loader
def load_user(user_key):
  try:
    return User.get(user_key)
  except NotFoundError:
    return None

@login_manager.unauthorized_handler
def unauthorized():
  return jsonify(status="forbidden"), 403

# Seasurf

from .utils import csrf
csrf.init_app(app)

# Database shit
establish_connections()

# App stuff

@app.before_request
def before_request():
  app.jinja_env.globals["scripts"] = get_all_script_paths()

# Here are just the pages.

@app.route("/")
def main():
  return render_template("main.html")

@app.route("/about")
def about():
  return render_template("about.html")

@app.route("/tos")
def tos():
  return render_template("tos.html")

@app.route("/privacy")
def privacy():
  return render_template("privacy.html")

@app.route("/tech")
def tech():
  return render_template("tech.html")

@app.route("/app")
def mainapp():
  if not current_user.is_authenticated():
    return redirect(url_for("main"))
  return render_template("app.html")

for blueprint, meta in blueprints:
  app.register_blueprint(blueprint, **meta)
