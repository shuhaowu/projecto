========
Features
========

This article loosely covers all the features that we have/plan to have in 
projecto.

Overview
========

Project management systems nowadays are too complicated for small-medium sized
projects. Good ones costs money and offers the product as a service rather than
a software package that you can host on your own server.

Projecto offers four main features: 

- Feed: for project updates
- Todos: managing tasks
- Files: file sharing
- Schedule: time  scheduling with people

Feed
====

Pretty much like twitter. Short messages are made here. Tasks done in other 
parts of the systems can be posted here and so forth. People can also comment
on each feed items.

Features that need work:

- Integration with other systems: such as tasks, files, and so forth
- RSS feed

Todos
=====

Sort of like github issues. Has tags, assign, due date, and so forth. This is
a place where people can use Markdown.

Features that need work:

- Assignment of tasks, duedates
- Milestone
- Single todo view/commenting

Files
=====

Like a dropbox for the team. Has a straightforward and RESTful API to work 
with. 

This system needs to be coded.

Features that need work:

- WebDAV integration
- Commenting on files

Schedule
========

A meeting calendar for the team. 

This system needs to be designed.

Features that need work:

- CalDAV integration
- Commenting/voting on meeting times.
  - Integration with doodle?

Management
==========

Management of projects. Adding/deleting contributors, admins, and so forth.

Features that need work:

- Another class of users with readonly permission
- An owner that cannot be deleted by other admins
- Changing project name, and maybe have other attributes.
- Automatically add all users with a certain domain name for email address.

Users
=====

Login system uses Mozilla Persona for easier integration. This means people can
feel free to integrate LDAP by using a Mozilla Persona LDAP bridge for
authentication.

Gravatar for avatar, and other user profile features are currently minimal, but
could be worked on.

Planned features
================

- Email integration: Sending emails to update the team. Let team use email to
  respond to the system.
  - There are security concerns here but there are ways to mitigate this.
- Standards, standards, standards.
  - Things like WebDAV and whatnot is essential in my view. Although it would be too much work to get an MVP out for now.
- Mobile clients
  - responsive site may not be possible. A mobile webapp seem to be the way to go as we do not want to support all the platforms.

