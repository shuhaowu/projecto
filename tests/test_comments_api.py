from __future__ import absolute_import

from datetime import datetime, timedelta

from kvkit import NotFoundError

from projecto.models import Comment

from .utils import ProjectTestCase, new_comment, new_feeditem

class TestCommentsAPI(ProjectTestCase):
  def base_url(self, parent_id, postfix=""):
    return "/api/v1/projects/{}/comments/{}/{}".format(self.project.key, parent_id, postfix)

  def test_new_comment_for_feed(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    self.login()
    response, data = self.postJSON(self.base_url(feeditem.key), data={"content": "content"})
    self.assertStatus(200, response)
    key = data["key"]

    response, data = self.getJSON("/api/v1/projects/{}/feed/{}".format(self.project.key, feeditem.key))
    self.assertEquals(1, len(data["children"]))
    self.assertEquals(key, data["children"][0]["key"])
    self.assertEquals(self.user.key, data["children"][0]["author"]["key"])

    self.logout()
    user2 = self.create_user("test2@test.com")

    self.project.collaborators.append(user2.key)
    self.project.save()

    self.login(user2)

    response, data = self.postJSON(self.base_url(feeditem.key), data={"content": "content"})
    self.assertStatus(200, response)
    key = data["key"]

    # to fix issues where the datetime is the same and sort order gets weirded out.
    comment = Comment.get(key)
    comment.date = datetime.now() + timedelta(1)
    comment.save()

    response, data = self.getJSON("/api/v1/projects/{}/feed/{}".format(self.project.key, feeditem.key))
    self.assertEquals(2, len(data["children"]))
    self.assertEquals(key, data["children"][1]["key"])
    self.assertEquals(user2.key, data["children"][1]["author"]["key"])

    self.project.collaborators.remove(user2.key)
    self.project.save()

  def test_new_comment_for_feed_reject_permission(self):
    response, data = self.postJSON(self.base_url("nokey"), data={"content": "content"})
    self.assertStatus(403, response)

    user2 = self.create_user("malicious@eve.com")
    self.login(user2)

    response, data = self.postJSON(self.base_url("nokey"), data={"content": "content"})
    self.assertStatus(403, response)

  def test_new_comment_for_feed_reject_badrequest(self):
    self.login()
    response, data = self.postJSON(self.base_url("nokey"), data={"wrong": "content"})
    self.assertStatus(400, response)

    response, data = self.postJSON(self.base_url("nokey"), data={"toomuch": "stuff", "content": "content"})
    self.assertStatus(400, response)

    response, data = self.postJSON(self.base_url("nokey"), data={})
    self.assertStatus(400, response)

  def test_list_comments_for_feed(self):
    self.login()
    keys = []
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    for i in xrange(10):
      comment = new_comment(self.user, feeditem.key, content="content" + str(i), date=datetime.now() + timedelta(seconds=i), save=True)
      keys.append(comment.key)

    response, data = self.getJSON("/api/v1/projects/{}/feed/{}".format(self.project.key, feeditem.key))
    self.assertStatus(200, response)
    self.assertEquals(10, len(data["children"]))
    # test if date ordering is done correctly
    self.assertEquals(keys, [c["key"] for c in data["children"]])

  def test_delete_comment_for_feed(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    comment = new_comment(self.user, feeditem.key, content="content", save=True)

    self.login()
    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(200, response)

    with self.assertRaises(NotFoundError):
      comment.reload()

    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(404, response)

    user2 = self.create_user("test2@test.com")
    self.project.collaborators.append(user2.key)
    self.project.save()
    comment = new_comment(user2, feeditem.key, content="content", save=True)

    # still logged in as the project owner
    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(200, response)
    with self.assertRaises(NotFoundError):
      comment.reload()

    comment = new_comment(user2, feeditem.key, content="content", save=True)
    self.logout()
    self.login(user2)

    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(200, response)
    with self.assertRaises(NotFoundError):
      comment.reload()

    self.project.collaborators.remove(user2.key)
    self.project.save()

  def test_delete_comment_for_feed_reject_permission(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    comment = new_comment(self.user, feeditem.key, content="content", save=True)

    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)

    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(403, response)

    self.project.collaborators.append(user2.key)
    self.project.save()

    # just to be safe
    self.logout()
    self.login(user2)

    # not post owner nor project owner.
    response, data = self.deleteJSON(self.base_url(feeditem.key, comment.key))
    self.assertStatus(403, response)

    # should not fail.
    comment.reload()

  def test_delete_comment_reject_notfound(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    comment = new_comment(self.user, feeditem.key, content="content", save=True)

    self.login()
    response, data = self.deleteJSON(self.base_url(feeditem.key, "wrongkey"))
    self.assertStatus(404, response)

    response, data = self.deleteJSON(self.base_url("wrongkey", comment.key))
    self.assertStatus(404, response)

    # Should not fail
    comment.reload()

  def test_delete_feeditem_deletes_comments(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    comment = new_comment(self.user, feeditem.key, content="content", save=True)

    self.login()
    response, data = self.deleteJSON("/api/v1/projects/{}/feed/{}".format(self.project.key, feeditem.key))
    self.assertStatus(200, response)

    with self.assertRaises(NotFoundError):
      feeditem.reload()

    with self.assertRaises(NotFoundError):
      comment.reload()
