from __future__ import absolute_import

from kvkit import (
  ReferenceProperty,
  StringProperty
)

from ...models import BaseDocument, Content, rc, Project, Comment, CommentParentMixin

from settings import DATABASES


class ArchivedFeedItem(CommentParentMixin, BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["archived_feed"])}
  _child_class = Comment

  parent = ReferenceProperty(Project, index=True, load_on_demand=True)
  type = StringProperty()


class FeedItem(CommentParentMixin, BaseDocument, Content):
  _riak_options = {"bucket": rc.bucket(DATABASES["feed"])}
  _child_class = Comment

  parent = ReferenceProperty(Project, index=True, load_on_demand=True)
  type = StringProperty()

  def archive(self):
    archived_item = ArchivedFeedItem(key=self.key, data=self)
    archived_item.save()
    self.delete()
    return archived_item
