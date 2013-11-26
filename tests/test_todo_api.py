from __future__ import absolute_import

from kvkit import NotFoundError
from projecto.models import Todo

import unittest
from .utils import ProjectTestCase, new_todo

class TestTodoAPI(ProjectTestCase):
  def base_url(self, postfix):
    return "/api/v1/projects/{}/todos{}".format(self.project.key, postfix)

  # We need to test for security problems like XSS here.

  def test_new_todo(self):
    self.login()
    response, data = self.postJSON(self.base_url("/"), data={"title": "A title"})

    self.assertStatus(200, response)
    self.assertTrue("key" in data)
    self.assertTrue("title" in data)
    self.assertEquals("A title", data["title"])
    self.assertTrue("author" in data)
    self.assertEquals(self.user.key, data["author"]["key"])

    response, data = self.postJSON(self.base_url("/"), data={"title": "A title", "content": "some content", "tags": ["a", "b", "c"]})
    self.assertStatus(200, response)
    self.assertTrue("key" in data)
    self.assertTrue("title" in data)
    self.assertEquals("A title", data["title"])
    self.assertTrue("author" in data)
    self.assertEquals(self.user.key, data["author"]["key"])
    self.assertTrue("content" in data)
    self.assertTrue("markdown" in data["content"])
    self.assertEquals("some content", data["content"]["markdown"])
    self.assertTrue("html" in data["content"])
    self.assertTrue("<p>some content</p>" in data["content"]["html"])
    self.assertTrue("tags" in data)
    self.assertEquals(["a", "b", "c"], data["tags"])

  def test_new_todo_reject_badrequest(self):
    self.login()
    response, data = self.postJSON(self.base_url("/"), data={"invalid": "invald"})
    self.assertStatus(400, response)

    self.postJSON(self.base_url("/"), data={"title": "title", "content": "content", "author": "invalid"})
    self.assertStatus(400, response)

  def test_new_todo_reject_permission(self):
    response, data = self.postJSON(self.base_url("/"), data={"title": "todo"})
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, data = self.postJSON(self.base_url("/"), data={"title": "todo"})
    self.assertStatus(403, response)

  # TODO: this method
  # def test_new_todo_filter_xss(self):

  def test_update_todo(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login()
    response, data = self.putJSON(self.base_url("/" + todo.key), data={"title": "todo2"})
    self.assertStatus(200, response)
    self.assertTrue("key" in data)
    self.assertEquals(todo.key, data["key"])
    self.assertEquals("todo2", data["title"])

    response, data = self.putJSON(self.base_url("/" + todo.key), data={"content": {"markdown": "aaaa"}})
    self.assertStatus(200, response)
    self.assertEquals("todo2", data["title"])
    self.assertTrue("content" in data)
    self.assertTrue("markdown" in data["content"])
    self.assertEquals("aaaa", data["content"]["markdown"])
    self.assertTrue("<p>aaaa</p>" in data["content"]["html"])

  def test_update_todo_reject_badrequest(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login()
    response, data = self.putJSON(self.base_url("/" + todo.key), data={"author": "someauthor"})
    self.assertStatus(400, response)

    response, data = self.putJSON(self.base_url("/" + todo.key), data={"title": "title", "adfaf": "adfa"})
    self.assertStatus(400, response)

  def test_update_todo_reject_permission(self):
    todo = new_todo(self.user, self.project, save=True)

    response, data = self.putJSON(self.base_url("/" + todo.key), data={"title": "todo2"})
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, data = self.putJSON(self.base_url("/" + todo.key), data={"title": "todo2"})
    self.assertStatus(403, response)

  def test_get_todo(self):
    todo = new_todo(self.user, self.project, title="todo", save=True)

    self.login()
    response, data = self.getJSON(self.base_url("/" + todo.key))
    self.assertStatus(200, response)

    self.assertEqual(todo.key, data["key"])
    self.assertEqual("todo", data["title"])
    self.assertEqual(self.user.key, data["author"]["key"])
    self.assertEqual(self.user.name, data["author"]["name"])

  def test_get_todo_reject_permission(self):
    todo = new_todo(self.user, self.project, save=True)

    response, data = self.getJSON(self.base_url("/" + todo.key))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, data = self.getJSON(self.base_url("/" + todo.key))
    self.assertStatus(403, response)

  def test_delete_todo(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login()
    response, data = self.deleteJSON(self.base_url("/" + todo.key))
    self.assertStatus(200, response)

    with self.assertRaises(NotFoundError):
      Todo.get(todo.key)

    response, data = self.deleteJSON(self.base_url("/" + todo.key))
    self.assertStatus(404, response)

  def test_delete_todo_reject_permission(self):
    todo = new_todo(self.user, self.project, save=True)

    response, data = self.deleteJSON(self.base_url("/" + todo.key))
    self.assertStatus(403, response)

  def test_markdone_todo(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login()
    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": True})
    self.assertStatus(200, response)
    todo = Todo.get(todo.key)
    self.assertTrue(todo.done)

    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": False})
    self.assertStatus(200, response)
    todo = Todo.get(todo.key)
    self.assertFalse(todo.done)

  def test_markdone_todo_reject_badrequest(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login()
    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"notdone": False})
    self.assertStatus(400, response)

    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": False, "invalid": "invalid"})
    self.assertStatus(400, response)

  def test_markdone_todo_reject_permission(self):
    todo = new_todo(self.user, self.project, save=True)

    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": True})
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)
    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": True})
    self.assertStatus(403, response)

  def test_index_todos(self):
    self.login()

    keys = []
    for i in xrange(50):
        todo = new_todo(self.user, self.project, save=True)
        keys.append(todo.key)

    keys.sort()

    response, data = self.getJSON(self.base_url("/"))
    self.assertStatus(200, response)
    self.assertEquals(4, len(data))
    self.assertTrue("todos" in data)
    self.assertEquals(1, data["currentPage"])
    self.assertEquals(50, data["totalTodos"])
    self.assertEquals(20, data["todosPerPage"])

    self.assertEquals(20, len(data["todos"]))
    k = [t["key"] for t in data["todos"]]

    response, data = self.getJSON(self.base_url("/?page=2"))
    self.assertEquals(20, len(data["todos"]))
    self.assertEquals(2, data["currentPage"])
    self.assertEquals(50, data["totalTodos"])
    self.assertEquals(20, data["todosPerPage"])
    k.extend([t["key"] for t in data["todos"]])

    response, data = self.getJSON(self.base_url("/?page=3"))
    self.assertEquals(10, len(data["todos"]))
    self.assertEquals(3, data["currentPage"])
    self.assertEquals(50, data["totalTodos"])
    self.assertEquals(20, data["todosPerPage"])
    k.extend([t["key"] for t in data["todos"]])

    k.sort()
    self.assertEquals(keys, k)

  def test_index_todos_reject_permission(self):
    response, data = self.getJSON(self.base_url("/"))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)

    response, data = self.getJSON(self.base_url("/"))
    self.assertStatus(403, response)

  def test_filter_todos(self):
    self.login()

    keys = []
    for i in xrange(30):
      response, data = self.postJSON(self.base_url("/"), data={"title": "a todo", "tags": ["tag1"]})
      keys.append(data["key"])
    for i in xrange(20):
      response, data = self.postJSON(self.base_url("/"), data={"title": "a todo", "tags": ["tag2"]})
      keys.append(data["key"])
    keys.sort()

    for i in xrange(7):
      response, data = self.postJSON(self.base_url("/"), data={"title": "a todo", "tags": ["tag3"]})

    response, data = self.getJSON(self.base_url("/filter?tags=tag1&tags=tag2&page=1"))
    self.assertStatus(200, response)
    self.assertEquals(4, len(data))
    self.assertTrue("todos" in data)
    self.assertEquals(1, data["currentPage"])
    self.assertEquals(50, data["totalTodos"])
    self.assertEquals(20, data["todosPerPage"])
    self.assertEquals(20, len(data["todos"]))
    k = [t["key"] for t in data["todos"]]

    response, data = self.getJSON(self.base_url("/filter?tags=tag1&tags=tag2&page=2"))
    self.assertEquals(2, data["currentPage"])
    self.assertEquals(50, data["totalTodos"])
    self.assertEquals(20, data["todosPerPage"])
    self.assertEquals(20, len(data["todos"]))
    k.extend([t["key"] for t in data["todos"]])

    response, data = self.getJSON(self.base_url("/filter?tags=tag1&tags=tag2&page=3"))
    self.assertEquals(3, data["currentPage"])
    self.assertEquals(50, data["totalTodos"])
    self.assertEquals(20, data["todosPerPage"])
    self.assertEquals(10, len(data["todos"]))
    k.extend([t["key"] for t in data["todos"]])

    k.sort()
    self.assertEquals(keys, k)

  def test_filter_todos_reject_permission(self):
    response, data = self.getJSON(self.base_url("/filter"))
    self.assertStatus(403, response)

    user2 = self.create_user("test2@test.com")
    self.login(user2)

    response, data = self.getJSON(self.base_url("/filter"))
    self.assertStatus(403, response)

  def test_markdone(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login()
    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": True})
    self.assertStatus(200, response)

    self.assertTrue(Todo.get(todo.key).done)

    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": False})
    self.assertStatus(200, response)

    self.assertFalse(Todo.get(todo.key).done)

  def test_markdone_reject_badrequest(self):
    todo = new_todo(self.user, self.project, save=True)

    self.login() # TODO: we really gotta refactor these
    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"title": True})
    self.assertStatus(400, response)

    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"title": True, "done": True})
    self.assertStatus(400, response)

  def test_markdone_reject_permission(self):
    todo = new_todo(self.user, self.project, save=True)

    response, data = self.postJSON(self.base_url("/" + todo.key + "/markdone"), data={"done": False})
    self.assertStatus(403, response)

  def test_list_tags(self):
    new_todo(self.user, self.project, tags=["tag1", "tag2", "another tag"], save=True)
    new_todo(self.user, self.project, tags=["tag1", "mrrow", "wut"], save=True)

    self.login()
    response, data = self.getJSON(self.base_url("/tags/"))
    self.assertStatus(200, response)
    self.assertEquals(1, len(data))
    self.assertTrue("tags" in data)
    data["tags"].sort()
    self.assertTrue(sorted(["tag1", "tag2", "mrrow", "wut", "another tag"]), data["tags"])

  def test_list_tags_reject_permission(self):
    todo = new_todo(self.user, self.project, tags=["tag1", "tag2", "another tag"], save=True)

    response, data = self.getJSON(self.base_url("/tags/"))
    self.assertStatus(403, response)

  # TODO: this gotta be written! We still might change how filter works, though
  #def test_filter(self):
  #  pass


if __name__ == "__main__":
  unittest.main()