from __future__ import absolute_import

from flask import request, abort
from flask.ext.login import current_user
from kvkit import NotFoundError

from ..hacks import Blueprint
from ...models import Comment
from ...utils import ensure_good_request, project_access_required, jsonify

blueprint = Blueprint("api_v1_comments", __name__,
                      static_folder="static",
                      static_url_path="/static/comments")

meta = {
  "url_prefix": "/projects/<project_id>/comments/<parent_id>"
}


@blueprint.route("/", methods=["POST"])
@project_access_required
@ensure_good_request({"content", "content"})
def post(project, parent_id):
  comment = Comment(data=request.json)
  comment.author = current_user._get_current_object()
  comment.parent = parent_id
  comment.save()
  return jsonify(**comment.serialize(restricted=("title", "parent", "author"), include_key=True))


@blueprint.route("/<comment_id>", methods=["DELETE"])
@project_access_required
def delete(project, parent_id, comment_id):
  try:
    comment = Comment.get(comment_id)
  except NotFoundError:
    return abort(404)
  else:
    if comment.parent != parent_id:
      return abort(404)

    # Note that ideally we want the author of the parent post to be able to delete too.
    # however this is not possible right now as we don't know what the parent is.
    if current_user.key == comment.author.key or current_user.key in project.owners:
      comment.delete()
      return jsonify(status="okay")
    else:
      return abort(403)
