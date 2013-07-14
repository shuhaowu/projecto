from flask import Blueprint, request, make_response
from flask.ext.login import login_user, logout_user
import settings
import os
import requests
import ujson
from ..utils import jsonify, hook_user_to_projects

from ..models import User

MODULE_NAME = "auth"
TEMPLATES_FOLDER = os.path.join(settings.TEMPLATES_FOLDER, MODULE_NAME)

blueprint = Blueprint(MODULE_NAME, __name__,
                      template_folder=TEMPLATES_FOLDER,
                      static_folder=settings.STATIC_FOLDER)

meta = {
  "url_prefix" : "/auth",
}

@blueprint.route("/login", methods=["POST"])
def login():
  payload = {
    "assertion": request.form["assertion"],
    "audience": request.url_root
  }

  response = requests.post("https://verifier.login.persona.org/verify", data=payload)
  if response.status_code == 200:
    persona_data = ujson.loads(response.text)
    if persona_data["status"] == "okay" and persona_data["audience"] == payload["audience"]:
      email = persona_data["email"]
      user = User.register_or_login(email)
      login_user(user)
      hook_user_to_projects(user)
      return jsonify(status="ok")
    else:
      return jsonify(**persona_data), 403
  else:
    return make_response(response.text), response.status_code

@blueprint.route("/logout", methods=["POST"])
def logout():
  logout_user()
  return jsonify(status="ok")