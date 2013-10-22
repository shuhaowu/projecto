import os

from flask import Blueprint, redirect, url_for, request, flash
from flask.ext.login import current_user

import settings
from ..models import Signup

MODULE_NAME = "signup"
TEMPLATES_FOLDER = os.path.join(settings.TEMPLATES_FOLDER, MODULE_NAME)

blueprint = Blueprint(MODULE_NAME, __name__,
                      template_folder=TEMPLATES_FOLDER,
                      static_folder=settings.STATIC_FOLDER)

meta = {
  "url_prefix" : "/signup",
}

# This is to be deleted when we launch as this is not needed.

@blueprint.route("", methods=["POST"])
def signup():
  if current_user.is_authenticated():
    return redirect(url_for("mainapp"))

  email = request.form.get("email")
  if not email or len(email.split("@")) != 2:
    flash("Please provide a valid email to signup.", "error")
  else:
    signup = Signup.get_or_new(email)
    signup.save()
    flash("You are signed up! We'll notify you when we are ready to release!", "success")

  return redirect(url_for("main"))
