from __future__ import absolute_import

import unittest

from .utils import FlaskTestCase

class TestBasicRoutes(FlaskTestCase):
  def test_basic_routes(self):
    self.assertStatus(200, self.get("/"))
    self.assertStatus(200, self.get("/features"))
    self.assertRedirect("/", self.get("/app"))

  def test_login_logout(self):
    self.login()
    self.assertStatus(200, self.get("/app"))
    self.logout()
    self.assertRedirect("/", self.get("/app"))

if __name__ == "__main__":
  unittest.main()