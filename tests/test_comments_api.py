from __future__ import absolute_import

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

  def test_delete_comment_for_feed(self):
    pass

  def test_delete_comment_for_feed_reject_permission(self):
    pass
