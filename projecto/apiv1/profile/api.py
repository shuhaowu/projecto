from __future__ import absolute_import

from flask import request
from flask.ext.login import current_user, login_required

from ..hacks import Blueprint
from ...utils import (
    ensure_good_request,
    jsonify
)


blueprint = Blueprint("api_v1_profile", __name__,
                      static_folder="static",
                      static_url_path="/static/profile")

meta = {
  "url_prefix": "/profile"
}


@blueprint.route("/changename", methods=["POST"])
@ensure_good_request({"name"}, {"name"})
@login_required
def changename():
  current_user.name = request.json["name"]
  current_user.save()
  return jsonify(status="okay")
