from __future__ import absolute_import

import unittest
from .utils import FlaskTestCase

# TODO: needs to code in participants

class TestProjectsAPI(FlaskTestCase):
  # TODO: participating projects.
  def test_create_reject_nonuser(self):
    response, _ = self.postJSON("/api/v1/projects/", data={"name": "test"})
    self.assertStatus(403, response)

  def test_create_reject_bad_request(self):
    self.login()
    response, _ = self.postJSON("/api/v1/projects/", data={"noname": "test"})
    self.assertStatus(400, response)

    response, _ = self.postJSON("/api/v1/projects/", data={"name": "name", "extras": "extras"})
    self.assertStatus(400, response)

  def test_create_successful(self):
    self.login()
    response, data = self.postJSON("/api/v1/projects/", data={"name": "name"})
    self.assertStatus(200, response)

    self.assertEquals(1, len(data))
    self.assertTrue("key" in data)

  def test_get_project_as_owner(self):
    self.login()
    response, data = self.postJSON("/api/v1/projects/", data={"name": "project"})
    key = data["key"]
    response, data = self.getJSON("/api/v1/projects/{}".format(key))

    self.assertStatus(200, response)
    self.assertEquals(key, data["key"])
    self.assertEquals("project", data["name"])

    # this is okay because I'm an owner
    self.assertTrue("owners" in data)
    self.assertTrue(self.user.key in data["owners"])
    self.assertTrue("collaborators" in data)
    self.assertTrue("unregistered_owners" in data)
    self.assertTrue("unregistered_collaborators" in data)

  def test_get_project_reject_permission(self):
    self.login()
    _, data = self.postJSON("/api/v1/projects/", data={"name": "name"})
    self.logout()
    response, _ = self.getJSON("/api/v1/projects/{}".format(data["key"]))
    self.assertStatus(403, response)

  def test_get_project_reject_notfound(self):
    self.login()
    response, data = self.getJSON("/api/v1/project/nope")
    self.assertStatus(404, response)

    self.logout()
    response, data = self.getJSON("/api/v1/project/nope")
    self.assertStatus(404, response)

  def test_list_my_projects(self):
    self.reset_database()
    some_user = self.create_user("test2@test.com")
    self.login()

    response, data = self.getJSON("/api/v1/projects/")
    self.assertStatus(200, response)

    self.assertEquals(0, len(data["owned"]))
    self.assertEquals(0, len(data["participating"]))

    keys = []
    for i in xrange(5):
      _, data = self.postJSON("/api/v1/projects/", data={"name": "project"})
      keys.append(data["key"])

    response, data = self.getJSON("/api/v1/projects/")
    self.assertStatus(200, response)

    self.assertEquals(5, len(data["owned"]))
    self.assertEquals(0, len(data["participating"]))
    keys_from_response = sorted([p["key"] for p in data["owned"]])
    keys.sort()
    self.assertEquals(keys, keys_from_response)
    self.assertTrue("owners" not in data["owned"][0])
    self.assertTrue("collaborators" not in data["owned"][0])
    self.assertTrue("unregistered_owners" not in data["owned"][0])
    self.assertTrue("unregistered_collaborators" not in data["owned"][0])

    self.logout()
    self.login(some_user)

    response, data = self.getJSON("/api/v1/projects/")
    self.assertStatus(200, response)
    self.assertEquals(0, len(data["owned"]))
    self.assertEquals(0, len(data["participating"]))

  def test_list_reject_not_logged_in(self):
    response, _ = self.getJSON("/api/v1/projects/")
    self.assertStatus(403, response)


if __name__ == "__main__":
  unittest.main()