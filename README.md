Projecto
========

Projecto is a simple project management web application built using Flask and
AngularJS. It is a completely rewrite and redesign of a previous project
management system I've written, [spm](https://github.com/shuhaowu/spm)

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

File upload allows anyone to upload files (we should keep revisions). The
current plan is to use WebDAV. However, the access control issue needs to
looked into as I am not familiar with that.

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

This project has a some weird dependencies (really.. all non-trivial apps have
weird dependencies).

Before we can do anything, we must get a virtual environment setup. So please
do that. Once that's done, we need to install leveldb (for now, we will probably
switch to [levelupdb](https://github.com/shuhaowu/levelupdb) or Riak later).

Installing leveldb is slightly tricky. So follow the following commands (make
sure your virtual env is activated!):

    svn checkout http://py-leveldb.googlecode.com/svn/trunk/ py-leveldb-read-only
    cd py-leveldb-read-only
    ./compile_leveldb.sh
    python setup.py build
    python setup.py install

This _should_ in theory install leveldb. To make sure, open up a python shell
and do the following:

    $ python
    Python 2.7.3 (default, Aug  1 2012, 05:14:39)
    [GCC 4.6.3] on linux2
    Type "help", "copyright", "credits" or "license" for more information.
    >>> from leveldb import LevelDB
    >>>

If you get exactly that, you should be okay and can skip this section.
If python complains with `ImportError`. There is an issue. Luckily we can
try diagonising it. Still in your python shell:

    >>> import leveldb
    >>> dir(leveldb)
    ['__doc__', '__file__', '__name__', '__package__']

If you get something like this. I would go back and try to go back and try
to do the `./compile_leveldb.sh; python setup.py build` step again.
If python complains about leveldb not being available, check if your virtualenv
is active when you did `python setup.py install`.

If you still have trouble, try doing `pip install leveldb`. And if you still
have trouble, contact one of the developers.

After install leveldb, you can use pip to install the rest via:

    $ pip install -r requirements.txt

This should take a little bit of time but should work without issues.

We need to now create a database folder:

    $ mkdir databases

Lastly, we need a settings file. In the project root:

    $ touch settings_local.py

This file should have roughly this content:

    DEBUG = True

    SECRET_KEY = "{generate a random string please :)}"

You can also override anything in settings.py here. However, you must have
`SECRET_KEY` set.

To start the server, run:

    $ python server.py
    ==================================================================
    WARNING: BCRYPT NOT AVAILABLE. DO NOT USE IN PRODUCTION WITHOUT IT
    ==================================================================
     * Running on http://localhost:8800/
     * Restarting with reloader
    ==================================================================
    WARNING: BCRYPT NOT AVAILABLE. DO NOT USE IN PRODUCTION WITHOUT IT
    ==================================================================

Ignore the warning. We don't use store passwords so it is okay.

Navigate to http://localhost:8800 to check out the site

Testing out production install
------------------------------

The deployment process is still currently quite unclear. However, it is
possible at this stage to take the production server for a spin to see what
will happen (of course, this will be behind a reverse proxy in the real
production mode). You might want to do this to see if minification happened
correctly, or if there are any other issues.

To do this, deactivate your development virtualenv and make a new virtualenv.
In this new virtualenv, install leveldb like we did in the regular environment.

Then, you need to install the production requirements. You need packages like
build-essentials and python-dev. In Ubuntu and Debian, run the following:

    # apt-get install build-essentials python-dev

If you are using another distro, install the equivalent packages.

Then, install the production requirements

    $ pip install production-requirements.txt

Now, you need to install Node and UglifyJS to minify files. Follow the
instructions [here][node-install] for node or install it using your favorite
method.

[node-install]: https://github.com/joyent/node/wiki/Installing-Node.js-via-package-manager

To install uglify, simply execute:

    $ npm install -g uglify-js

Make sure you can run uglifyjs by testing it with

    $ uglifyjs -V

Now, go to you settings_local.py file and change `DEBUG` to `True`.

Run the server and you should see:

    $ python server.py
    ==================================================================
    WARNING: BCRYPT NOT AVAILABLE. DO NOT USE IN PRODUCTION WITHOUT IT
    ==================================================================

Again, ignore the message. Now you can head to http://localhost:8800 to test
out the production server.

Deploying Projecto
------------------

Not available yet.

Tips for development
--------------------

 - Run all tests automagically: `python -m unittest discover`
 - Do `pip install pdbpp` and once you get into the debugger, type `sticky` and
   hit enter.
