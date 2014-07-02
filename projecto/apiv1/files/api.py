from __future__ import absolute_import

from flask import request, abort, send_file
from flask.ext.login import current_user
from kvkit import NotFoundError

from ..hacks import Blueprint
from .models import File
from ...utils import ensure_good_request, project_access_required, jsonify

blueprint = Blueprint("api_v1_files", __name__,
                      static_folder="static",
                      static_url_path="/static/files")

meta = {
  "url_prefix": "/projects/<project_id>/files"
}


def _get_path():
  path = request.args.get("path", None)
  if path is None:
    return None, abort(400)

  path = path.strip()
  if path == "/":
    return None, abort(400)

  return path, None


@blueprint.route("/", methods=["GET"])
@project_access_required
def get_item(project):
  path = request.args.get("path", None)
  if path is None:
    return abort(400)

  if path == "/":
    r = {"path": "/"}
    r["children"] = children = []
    for f in File.lsroot(project):
      children.append(f.serialize_for_client(recursive=False))
    return jsonify(**r)
  else:
    try:
      f = File.get_by_project_path(project, path)
    except NotFoundError:
      return abort(404)
    else:
      if not request.args.get("download", False):
        return jsonify(**f.serialize_for_client())
      else:
        return send_file(f.fspath, as_attachment=True)


@blueprint.route("/", methods=["POST"])
@project_access_required
@ensure_good_request(set(), allow_json_none=True)
def create_item(project):
  path, err = _get_path()
  if err:
    return err

  try:
    File.get_by_project_path(project, path)
  except NotFoundError:
    is_directory = path.strip().endswith("/")
    data = {"path": path}
    if not is_directory:
      data["file"] = request.files.get("file", None)
      if not data["file"]:
        return abort(400)

    data["project"] = project
    data["author"] = current_user._get_current_object()
    f = File.create(data=data)
    try:
      f.save()
    except NotFoundError:
      return abort(404)

    return jsonify(**f.serialize_for_client())
  else:
    return jsonify(error="That path already exists!"), 400


@blueprint.route("/", methods=["PUT"])
@project_access_required
@ensure_good_request(set(), allow_json_none=True)
def update_item(project):
  path, err = _get_path()
  if err:
    return err

  try:
    f = File.get_by_project_path(project, path)
  except NotFoundError:
    return abort(404)
  else:
    # TODO: if files gets more meta data, we can update them here.
    # Otherwise we only need to update the content.
    if request.files.get("file", None) and not f.is_directory:
      f.update_content(request.files["file"].read())
      request.files["file"].close()
    else:
      return abort(400)

    return jsonify(**f.serialize_for_client())


@blueprint.route("/", methods=["DELETE"])
@project_access_required
@ensure_good_request(set(), allow_json_none=True)
def delete_item(project):
  path, err = _get_path()
  if err:
    return err

  try:
    f = File.get_by_project_path(project, path)
  except NotFoundError:
    return abort(404)
  else:
    f.delete()
    return jsonify(status="okay")


@blueprint.route("/move", methods=["PUT"])
@project_access_required
@ensure_good_request({"path"})
def move_item(project):
  path, err = _get_path()
  if err:
    return err

  try:
    f = File.get_by_project_path(project, path)
  except NotFoundError:
    return abort(404)
  else:
    try:
      f.move(request.json["path"], current_user._get_current_object())
    except NotFoundError:
      return abort(404)

    return jsonify(status="okay")
