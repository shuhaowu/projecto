Projecto
========

Projecto is a simple project management web application built using Flask and
AngularJS. It is a completely rewrite and redesign of a previous project
management system I've written, [spm](https://github.com/shuhaowu/spm)

Authors
-------

Primary developers:

 - Shuhao Wu <shuhao@shuhaowu.com>

Features
--------

Project management systems nowadays are too complicated for small-medium sized
projects. Good ones costs money and offers the product as a service rather than
a software package that you can host on your own server.

The four main features this system offers are:

 - Feed: for project announcements
 - Todo List: todos that can be assigned and have tags, assignments, and so forth.
 - Schedules: for scheduling meetings and so forth.
 - Files: hosting and sharing files between members.

The system should play well with email. That is, I should be able to comment or
reply via email.

This is currently not implemented due to a security issue: email is too easily
spoofed. So anyone could take over. A **partial** solution to this would be
using an unique email address for each email sent out to be replied. However,
this is not necessary sufficient as these email addresses could be intercepted.
However, it could be *good enough* for many projects.

A secure solution would be getting the users to upload a certificate and have
them digitally sign their email. This would be for the more serious projects.

So the proposed solution is to have default no email reply, and a semi secure
version using unique addresses and a secure version using signatures.

### Feed ###

The feed is pretty much like a twitter feed that you can comment on. This can
be used for project announcements.

A feature that is needed is sending emails to everyone (except those that
unsubscribed) once the feed is updated. Same thing with comments that they
follow. People should be able to reply with email as well.

### Todo List ###

The todo list supports tags, assigned, due date, commenting. This one supports
markdown input so people can post in rich text.

The todo list have should have some rudimentary access control: that is, only
the owners, assigned, and creator can mark an item as done and modify details.
Commenting is available to anyone in the project.

Also we need email reminders.

### File upload ###

File upload allows anyone to upload files (we should keep revisions). The files
should have some rudimentary access control: only owners and creator can alter
file details, delete, and upload new versions.

This still needs to be worked on.

### Schedules ###

Schedule meetings for the team. Allow them to give time and location. Integrate
with Gcalendar, iCal, and Google Maps.

This still needs to be worked on

### Management ###

The management tab allows project owners to add owners and collaborators. In the
event of an user not registered with a system, once they login with their email
with Persona, they will be automatically added to the system..

### Mozilla Persona based login system ###

Projecto uses Mozilla Persona as its login system. This is awesome as we never
have to manage passwords. Projects that are serious about security could use
their own domains and use their own authentication scheme according to the
Mozilla Persona specs.

Running this
------------

To be written.