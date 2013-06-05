from unittest import TestCase

from flask import request_started
from flask.ext.login import test_login_user, test_logout_user

from projecto import app
from projecto.models import User

class FlaskTestCase(TestCase):
  def setUp(self):
    self.app = app
    self.client = app.test_client()
    self.client.__enter__()
    self.user = User.register_or_login("test@test.com")

  def tearDown(self):
    self.client.__exit__(None, None, None)

  def assertStatus(self, status_code, response):
    self.assertEquals(status_code, response.status_code)

  def assertRedirect(self, redirect, response):
    self.assertTrue(response.status_code in (301, 302))
    # TODO: this might be.. troublesome
    self.assertTrue(response.location.endswith(redirect))

  def login(self):
    test_login_user(self.client, self.user)

  def logout(self):
    test_logout_user(self.client)
