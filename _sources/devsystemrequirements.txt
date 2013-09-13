.. _devsystemrequirements:

=======================
Dev System Requirements
=======================

For development, it is recommended that you use Linux. None of the maintainers
use Macs for development. It should work in theory, but YMMV. Note that a 
debian based environment will be the best as the production environment will
be on Debian.

Windows is absolutely not supported. However, if you can get it to work, bravo.

It is recommended that you use the :ref:`vagrantsetup`. This cuts down the
number of dependencies and should be much easier to work with.

Projecto's requirements are fairly light. The vagrantbox only has about 400MB
of RAM and it runs just fine.

Vagrant Setup
-------------

The requirements for the vagrant setup is fairly light. You need to install 
the followings:

- `Vagrant <http://vagrantup.com>`_
- `NFS <https://help.ubuntu.com/community/SettingUpNFSHowTo>`_

Manual setup
------------

The manual requirements are quite complicated. Refer to vagrant/bootstrap.sh to
see what's going on.
