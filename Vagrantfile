# -*- mode: ruby -*-
# vi: set ft=ruby :

VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "precise64"
  config.vm.box_url = "http://files.vagrantup.com/precise64.box"
  config.vm.network :private_network, ip: "192.168.33.10"
  config.vm.synced_folder ".", "/projecto", :nfs => true
  config.vm.synced_folder ".", "/vagrant", :disabled => true
  config.vm.provision :shell, :path => "vagrant/bootstrap.sh"
end
