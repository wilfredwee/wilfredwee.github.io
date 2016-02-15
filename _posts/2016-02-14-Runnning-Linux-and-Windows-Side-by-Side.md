---
layout: post
title: "Running Linux and Windows Side by Side"
---

## Main Idea:
* Run Ubuntu Server in Virtualbox Headless Mode.
* Share Windows folder as a network share to your Guest VM.
* SSH into Ubuntu Server and use the full power of Linux.
* Why not dual-boot or Cygwin?
  1. Cygwin:
    * VM Technology has come a long way. Performance is very good. When idle, the VM takes up less than 100MB of RAM and almost 0 CPU usage. Cygwin has some very undesirable performance tradeoffs to get UNIX compatibility.
    * You get full Linux right out of the box. This includes all the programs, package managers and all the other good stuff. It's a nightmare in Cygwin land to get programs you need.
  1. Dual-boot:
    * Dual-boot performance is definitely better, but you need to dual-boot. =/
    * You might need to grapple with drivers.
    * Dual-boot uses more space.

## Required Software
* [Virtualbox](https://www.virtualbox.org/wiki/Downloads)
* [Any Linux Distro, this uses Ubuntu Server](http://www.ubuntu.com/download/server)
* [Any SSH client. I use Git for Windows (uses MSYS)](https://git-scm.com/download/win)

### Small Note:
This is not a full, step-by-step guide. It's more to give you an idea of what you can do. That said, the content in this post should be sufficient to help you accomplish running Linux with Windows without too much of a problem.

## Steps:
1. Download and install Virtualbox, and install Ubuntu Server in a Virtualbox VM. Make sure you install OpenSSH when you're installing Ubuntu Server.
1. In your Ubuntu Server terminal, install Virtualbox Guest Additions:
`sudo apt-get install virtualbox-guest-dkms virtualbox-guest-utils virtualbox-guest-x11`
1. Back in Windows, in your Virtualbox interface, select your Ubuntu VM and click `Settings`. Under `Network`, make sure that the adapter is attached to `NAT`. Then, click `Port Forwarding` and input a high-number port for Host OS, like `3022` and for Guest OS port, input `22`. We're setting this up for SSH.
<br />
<br />
![Port Forward]({{site.url}}/assets/images/vbox-port-forward.JPG)<br />
**Warning:** Any machine that can access the Host OS through the port you forwarded (in this case `3022`) will also be able to ssh into the Guest OS. This can be a good thing, if you want to ssh remotely into your Guest OS, but it's something to keep in mind.
1. Now, under `Shared Folders`, add a folder that you want to share with the Guest VM. This usually is where you keep most of your code projects. Make it `Auto Mount` and `Make Permanent`. Make sure it is a `Machine Folder`.
1. Go to your Guest OS and reboot it via `sudo reboot`.
1. Once rebooted, go to your *Windows OS* and ssh into your Guest OS. A sample command will be `ssh -p 3022 <username>@127.0.0.1`
1. Congratulations! You managed to ssh into your Guest OS.
1. To access the shared folders, it is located in `/media`.
1. Try to play around with the file system, like creating a new txtfile: `touch newtxtfile.txt`. You will notice in your Windows OS that a file is automatically created.
1. This should be sufficient, but there are a ton of stuff you can do to make your experience even better.

## Make it Better:
* On Windows, use [ConEmu](https://github.com/Maximus5/ConEmu). Makes your terminal look as good as any other Linux terminal.
* Run Ubuntu Server in Headless mode, here is a sample command: `/c/"Program Files"/Oracle/VirtualBox/VBoxManage startvm "Ubuntu" --type headless` (this is to be run by Git bash, modify accordingly if you want to make it run by cmd.) You can also startup the VM on Windows startup, just create a .bat file and place it in your Startup folder.
* In your VM, you can create a symlink for the shared folder in your home directory. `ln -s /media/<your shared folder name> ~/src`
* On Windows, make sure to configure your text editor to save files in LF (Linux line ending).
* If you want to run a server on localhost in your VM and view it on Windows, make sure you
  1. Run it on 0.0.0.0
  2. Configure port forwarding in Virtualbox as the steps above, except this time the Host OS port is any high-number port, Guest OS port is the port it is currently open on (usually 4000, 8000, 8080 etc.)
  3. On Windows, visit `http://localhost:<Host OS port you have configured>`

That's it! Please let me know if there's anything more that I can add here. I'm learning as we go as well.
