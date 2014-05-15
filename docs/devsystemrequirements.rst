.. _devsystemrequirements:

=======================
Dev System Requirements
=======================

For development, it is recommended that you use Linux. The maintainer(s) of the
project uses Linux as their primary development platform. With Linux, you have
the option to setup the system manually, although that is *not recommended*.

It is also possible to setup vagrant on Mac and Windows. On Mac it should be
fairly straight forward. Windows does not have NFS and therefore will take some
more work.

Again, it is recommended that you use the :ref:`vagrantsetup`. This cuts down the
number of dependencies and should be much easier to work with.

Projecto's requirements are fairly light. The vagrantbox only has about 400MB
of RAM and it runs just fine.

If you find that setup, especially the Vagrant box, is broken. Notify the
maintainer(s) as soon as possible. This is a top priority as new contributors
will be blocked and lose interest if the setup instructions do not work.

Vagrant Setup
-------------

The requirements for the vagrant setup is fairly light. You need to install
the followings:

- `Vagrant <http://vagrantup.com>`_
- `NFS <https://help.ubuntu.com/community/SettingUpNFSHowTo>`_
  - For Windows, ignore this and follow the instructions in :ref:`vagrantsetup`.
- `NodeJS <http://nodejs.org/>`_
- Firefox and Chromium for now.
- After you get all of this, go to the project root and run `npm install`.
- Now remember to add `node_modules/.bin` to your `$PATH`.

Instructions for those are available online. So follow them.

Continue to :ref:`vagrantsetup`.

Manual setup
------------

The manual requirements are quite complicated. Refer to vagrant/bootstrap.sh to
see what's going on. The manual setup docs probably will not be as maintained
as the bootstrap.sh
