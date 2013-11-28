from __future__ import absolute_import

from flask import Blueprint, request, abort
from flask.ext.login import current_user
from kvkit import NotFoundError

from ...models import FeedItem
from ...utils import ensure_good_request, project_access_required, jsonify


blueprint = Blueprint("api_v1_feed", __name__,
                      static_folder="static",
                      static_url_path="/static/feed")

meta = {
  "url_prefix": "/projects/<project_id>/feed"
}


@blueprint.route("/", methods=["POST"])
@project_access_required
@ensure_good_request({"content"}, {"content"})
def post(project):
  feeditem = FeedItem(data=request.json)
  # This is required as current_user is a werkzeug LocalProxy
  feeditem.author = current_user._get_current_object()
  feeditem.parent = project
  feeditem.save()
  return jsonify(**feeditem.serialize(restricted=("title", "parent", "author"), include_key=True))


@blueprint.route("/", methods=["GET"])
@project_access_required
def index(project):
  try:
    amount = min(int(request.args.get("amount", 20)), 200)
  except (TypeError, ValueError):
    return abort(400)
  ttype = request.args.get("type")
  feed = []

  i = 0
  for feeditem in FeedItem.index("parent", project.key):
    if ttype is not None and feeditem.type != ttype:
      continue

    if i >= 200:
      feeditem.archive()
      continue

    feed.append(feeditem.serialize_for_client("keys"))
    i += 1

  feed.sort(key=lambda item: item["date"], reverse=True)
  feed = feed[:amount]

  return jsonify(feed=feed)


@blueprint.route("/<id>", methods=["GET"])
@project_access_required
def get(project, id):
  try:
    feeditem = FeedItem.get(id)
    if feeditem.parent.key != project.key:
      raise NotFoundError
  except NotFoundError:
    return abort(404)
  else:
    return jsonify(**feeditem.serialize_for_client())


@blueprint.route("/<id>", methods=["DELETE"])
@project_access_required
def delete(project, id):
  try:
    feeditem = FeedItem.get(id)
  except NotFoundError:
    return abort(404)
  else:
    if current_user.key == feeditem.author.key or current_user.key in project.owners:
      feeditem.delete()
      return jsonify(status="okay")
    else:
      return abort(403)
