from __future__ import absolute_import

import unittest
from .utils import FlaskTestCase

class TestProfileAPI(FlaskTestCase):
  def test_changename(self):
    self.login()
    response, data = self.postJSON("/api/v1/profile/changename", data={"name": "a name"})
    self.assertStatus(200, response)

    self.user.reload()
    self.assertEquals("a name", self.user.name)

  def test_changename_reject_permission(self):
    response, data = self.postJSON("/api/v1/profile/changename", data={"name": "a name"})
    self.assertStatus(403, response)

  def test_changename_reject_badrequest(self):
    response, data = self.postJSON("/api/v1/profile/changename", data={"invalid": "invalid"})
    self.assertStatus(400, response)

    response, data = self.postJSON("/api/v1/profile/changename", data={"name": "a name", "invalid": "invalid"})
    self.assertStatus(400, response)

if __name__ == "__main__":
  unittest.main()