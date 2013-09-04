from __future__ import absolute_import
import os

from flask import Flask, render_template, redirect, url_for
from flask.ext.login import current_user

from .blueprints import blueprints
from .extensions import login_manager, register_assets, partials
from .models import establish_connections
from settings import APP_FOLDER, STATIC_FOLDER, TEMPLATES_FOLDER

app = Flask(__name__, static_folder=STATIC_FOLDER, template_folder=TEMPLATES_FOLDER)
app.config.from_pyfile(os.path.join(APP_FOLDER, "settings.py"))

# Login management
login_manager.setup_app(app)

# Seasurf initializations
from .extensions import csrf
csrf.init_app(app)

# Database shit
establish_connections()

# asset stuffs
register_assets(app)


# App stuff
@app.before_request
def before_request():
  app.jinja_env.globals["partials"] = partials


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


# register blueprints automatically.
for blueprint, meta in blueprints:
  app.register_blueprint(blueprint, **meta)
