from __future__ import absolute_import

import unittest
from .utils import FlaskTestCase, new_project

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
    proj = new_project(user=self.user, name="project", save=True)
    response, data = self.getJSON("/api/v1/projects/{}".format(proj.key))

    self.assertStatus(200, response)
    self.assertEquals(proj.key, data["key"])
    self.assertEquals("project", data["name"])

    # this is okay because I'm an owner
    self.assertTrue("owners" in data)
    self.assertTrue(self.user.key in data["owners"])
    self.assertTrue("collaborators" in data)
    self.assertTrue("unregistered_owners" in data)
    self.assertTrue("unregistered_collaborators" in data)

  def test_get_project_reject_permission(self):
    proj = new_project(user=self.user, name="project", save=True)

    response, _ = self.getJSON("/api/v1/projects/{}".format(proj.key))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, _ = self.getJSON("/api/v1/projects/{}".format(proj.key))
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
      keys.append(new_project(user=self.user, save=True).key)

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

  def test_list_members(self):
    project = new_project(self.user, name="project", save=True)
    user2 = self.create_user('test2@test.com')
    project.collaborators.append(user2.key)
    project.unregistered_collaborators.append("unregistered@collaborators.com")
    project.unregistered_owners.append("unregistered@owners.com")
    project.save()

    self.login()
    response, data = self.getJSON("/api/v1/projects/{}/members".format(project.key))
    self.assertStatus(200, response)

    self.assertEquals(4, len(data))
    self.assertEquals(1, len(data["owners"]))
    self.assertEquals(
      {u"name": self.user.name, u"email": u"test@test.com"},
      data["owners"][0]
    )

    self.assertEquals(1, len(data["collaborators"]))
    self.assertEquals(
      {u"name": user2.name, u"email": u"test2@test.com"},
      data["collaborators"][0]
    )

    self.assertEquals(1, len(data["unregistered_collaborators"]))
    self.assertEquals("unregistered@collaborators.com", data["unregistered_collaborators"][0])
    self.assertEquals(1, len(data["unregistered_owners"]))
    self.assertEquals("unregistered@owners.com", data["unregistered_owners"][0])

  def test_list_members_reject_permission(self):
    project = new_project(self.user, name="project", save=True)
    response, data = self.getJSON("/api/v1/projects/{}/members".format(project.key))

    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)

    response, data = self.getJSON("/api/v1/projects/{}/members".format(project.key))
    self.assertStatus(403, response)

    project.collaborators.append(user2.key)
    project.save()

    response, data = self.getJSON("/api/v1/projects/{}/members".format(project.key))
    self.assertStatus(403, response)

  def test_add_owner(self):
    project = new_project(self.user, name="project", save=True)

    user2 = self.create_user("test2@test.com")
    self.login()
    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"emails": ["test2@test.com"]})
    self.assertStatus(200, response)

    project.reload()
    self.assertEquals(2, len(project.owners))
    self.assertEquals(0, len(project.unregistered_owners))
    self.assertTrue(user2.key in project.owners)

    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"emails": ["unregistered@owners.com"]})
    self.assertStatus(200, response)

    project.reload()
    self.assertEquals(2, len(project.owners))
    self.assertEquals(1, len(project.unregistered_owners))
    self.assertTrue("unregistered@owners.com" in project.unregistered_owners)

  def test_add_owner_reject_permission(self):
    project = new_project(self.user, name="project", save=True)

    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"emails": ["test2@test.com"]})
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"emails": ["test2@test.com"]})
    self.assertStatus(403, response)

    project.collaborators.append(user2.key)
    project.save()
    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"emails": ["test2@test.com"]})
    self.assertStatus(403, response)

  def test_add_owner_reject_badrequest(self):
    project = new_project(self.user, name="project", save=True)

    self.login()
    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"invalid": "invalid"})
    self.assertStatus(400, response)

    response, data = self.postJSON("/api/v1/projects/{}/addowners".format(project.key), data={"invalid": "invalid", "emails": ["yay@yay.com"]})
    self.assertStatus(400, response)

  def test_add_collaborator(self):
    project = new_project(self.user, name="project", save=True)

    user2 = self.create_user("test2@test.com")
    self.login()
    response, data = self.postJSON("/api/v1/projects/{}/addcollaborators".format(project.key), data={"emails": ["test2@test.com"]})
    self.assertStatus(200, response)

    project.reload()
    self.assertEquals(1, len(project.collaborators))
    self.assertEquals(0, len(project.unregistered_collaborators))
    self.assertTrue(user2.key in project.collaborators)

    response, data = self.postJSON("/api/v1/projects/{}/addcollaborators".format(project.key), data={"emails": ["unregistered@collaborators.com"]})
    self.assertStatus(200, response)

    project.reload()
    self.assertEquals(1, len(project.unregistered_collaborators))
    self.assertTrue("unregistered@collaborators.com", project.unregistered_collaborators)

  # def test_add_collaborator_reject_permission(self):
  #   pass

  # def test_add_collaborator_reject_badrequest(self):
  #   pass

if __name__ == "__main__":
  unittest.main()