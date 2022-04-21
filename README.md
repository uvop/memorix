# Memorix

### Development

- Locally (linux)
  - Install Node LTS
  - Run `./install.sh`
  - Open `develop.code-workspace` with VSCode
- Docker (any)
  - Install docker
  - **Windows** - Run `git config --global core.autocrlf false` before cloning.
  - Run `docker build ./development-image -t memorix-dev`
  - Run `docker create -p 127.0.0.1:2022:22/tcp --name memorix-app memorix-dev`
  - Run `docker start memorix-app`
  - Install plugin `Remote - SSH` for VSCode
  - Connect to machine using command `ssh root@localhost -p 2022` (pass `uv`)
  - After connecting run inside machine `./setup.sh`
  - Open `~/dev/memorix/develop.code-workspace` with VSCode
