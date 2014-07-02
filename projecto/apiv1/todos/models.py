from __future__ import absolute_import

from kvkit import (
  ReferenceProperty,
  DateTimeProperty,
  ListProperty,
  BooleanProperty,
  DictProperty,
  StringProperty
)

from ...models import BaseDocument, Content, Project, User, rc

from settings import DATABASES

class Todo(BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["todos"])}

  parent = ReferenceProperty(Project, index=True, load_on_demand=True)
  assigned = ReferenceProperty(User, index=True, load_on_demand=True)
  due = DateTimeProperty(default=lambda: None)
  tags = ListProperty(index=True)
  done = BooleanProperty(default=False)
  content = DictProperty() # markdown -> markdown, html -> html

  # For this, to avoid things like spaces in the name, we use the md5 of the name.
  milestone = StringProperty(index=True)

  def archive(self):
    archived_item = ArchivedTodo(key=self.key, data=self)
    archived_item.save()
    self.delete()
    return archived_item


class ArchivedTodo(Todo):
  _riak_options = {"bucket": rc.bucket(DATABASES["archived_todos"])}