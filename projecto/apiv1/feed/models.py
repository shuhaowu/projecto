from __future__ import absolute_import

from kvkit import (
  Document,
  ReferenceProperty,
  StringProperty
)

from ...models import BaseDocument, Content, rc, Project, Comment

from settings import DATABASES

class ArchivedFeedItem(BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["archived_feed"])}

  parent = ReferenceProperty(Project, index=True, load_on_demand=True)
  type = StringProperty()


class FeedItem(BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["feed"])}

  parent = ReferenceProperty(Project, index=True, load_on_demand=True)
  type = StringProperty()

  def archive(self):
    archived_item = ArchivedFeedItem(key=self.key, data=self)
    archived_item.save()
    self.delete()
    return archived_item

  def delete(self, *args, **kwargs):
    """Overriden as we need to delete the children"""
    for comment in Comment.index("parent", self.key):
      comment.delete()

    return Document.delete(self, *args, **kwargs)
