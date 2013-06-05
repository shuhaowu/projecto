from __future__ import absolute_import

import unittest

from .utils import FlaskTestCase

class TestBasicRoutes(FlaskTestCase):
  def test_basic_routes(self):
    self.assertStatus(200, self.client.get("/"))
    self.assertStatus(200, self.client.get("/about"))
    self.assertStatus(200, self.client.get("/tos"))
    self.assertStatus(200, self.client.get("/privacy"))
    self.assertStatus(200, self.client.get("/tech"))
    self.assertRedirect("/", self.client.get("/app"))

  def test_login(self):
    self.login()
    self.assertStatus(200, self.client.get("/app"))
    self.logout()
    self.assertRedirect("/", self.client.get("/app"))

if __name__ == "__main__":
  unittest.main()