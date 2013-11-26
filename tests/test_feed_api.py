from __future__ import absolute_import

from datetime import datetime, timedelta
import time

from projecto.models import ArchivedFeedItem, FeedItem

import unittest
from .utils import ProjectTestCase, new_feeditem

class TestFeedAPI(ProjectTestCase):
  def base_url(self, postfix):
    return "/api/v1/projects/{}/feed{}".format(self.project.key, postfix)

  def test_new_feeditem(self):
    self.login()
    response, data = self.postJSON(self.base_url("/"), data={"content": "a post"})
    self.assertStatus(200, response)
    self.assertTrue("key" in data)
    self.assertTrue("content" in data)
    self.assertEquals("a post", data["content"])
    self.assertTrue("date" in data)
    self.assertTrue(data["date"] - time.time() < 5) # Created within 5 seconds is okay.

  def test_new_feeditem_reject_bad_request(self):
    self.login()
    response = self.post(self.base_url("/"), data={})
    self.assertStatus(400, response)
    response = self.post(self.base_url("/"), data={"invalid": "invalid"})
    self.assertStatus(400, response)
    response = self.post(self.base_url("/"), data={"content": "content", "extrainvalid": "invalid"})
    self.assertStatus(400, response)

  def test_new_feeditem_reject_permission(self):
    response = self.post(self.base_url("/"), data={"content": "content"})
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response = self.post(self.base_url("/"), data={"content": "content"})
    self.assertStatus(403, response)

  def test_get_feeditem(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    self.login()
    response, data = self.getJSON(self.base_url("/" + feeditem.key))
    self.assertTrue("key" in data)
    self.assertEquals(feeditem.key, data["key"])
    self.assertTrue("content" in data)
    self.assertEquals("content", data["content"])
    self.assertTrue("author" in data)
    self.assertEquals(self.user.key, data["author"]["key"])
    self.assertTrue("date" in data)
    self.assertTrue(data["date"] - time.time() < 5) # Created within 5 seconds is okay.
    self.assertTrue("children" in data)
    self.assertEquals([], data["children"])

  def test_get_feeditem_reject_permission(self):
    feeditem = new_feeditem(self.user, self.project, content="content", save=True)
    response = self.get(self.base_url("/" + feeditem.key))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response = self.get(self.base_url("/" + feeditem.key))
    self.assertStatus(403, response)

  def test_get_feeditem_reject_notfound(self):
    self.login()
    response = self.get(self.base_url("/nope"))
    self.assertStatus(404, response)

    self.logout()
    response = self.get(self.base_url("/nope"))
    self.assertStatus(403, response) # Because no access to the project

  def test_delete_feeditem(self):
    self.login()
    feeditem = new_feeditem(self.user, project=self.project, content="content", save=True)
    response, data = self.deleteJSON(self.base_url("/" + feeditem.key))
    self.assertStatus(200, response)

    response, data = self.getJSON(self.base_url("/" + feeditem.key))
    self.assertStatus(404, response)

  def test_delete_feeditem_reject_notfound(self):
    self.login()

    response, data = self.deleteJSON(self.base_url("/nope"))
    self.assertStatus(404, response)

  def test_delete_feeditem_reject_permission(self):
    feeditem = new_feeditem(self.user, project=self.project, content="content", save=True)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, _ = self.deleteJSON(self.base_url("/" + feeditem.key))
    self.assertStatus(403, response)

  def test_index_feeditems(self):
    self.reset_database()
    keys = []
    now = datetime.now()
    for i in xrange(10):
      fi = new_feeditem(self.user, project=self.project, content="content" + str(i), date=now + timedelta(i), save=True)
      keys.append(fi.key)

    keys.reverse() # When we index, it's sorted via date

    self.login()
    response, data = self.getJSON(self.base_url("/"))
    self.assertTrue(1, len(data))
    self.assertTrue("feed" in data)
    self.assertTrue(10, len(data["feed"]))
    for i, item in enumerate(data["feed"]):
      self.assertEquals(keys[i], item["key"])
      self.assertEquals("content" + str(9 - i), item["content"])

  def test_index_feeditems_will_archive_oldones(self):
    self.reset_database()
    for i in xrange(250):
      new_feeditem(self.user, project=self.project, content="content", save=True)

    self.login()
    self.get(self.base_url("/"))
    self.assertEquals(200, len(list(FeedItem.index_keys_only("parent", self.project.key))))
    self.assertEquals(50, len(list(ArchivedFeedItem.index_keys_only("parent", self.project.key))))

  def test_index_feeditems_reject_permission(self):
    response, data = self.getJSON(self.base_url("/"))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, data = self.getJSON(self.base_url("/"))
    self.assertStatus(403, response)

if __name__ == "__main__":
  unittest.main()