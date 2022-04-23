# Memorix

### Development

- Locally (linux)
  - Install nvm
  - Build and run docker image for redis and postgres access - see below
  - Add these to your `.zshrc`
    ```sh
    export DATABASE_URL=postgresql://postgres:uv@localhost:5432/memorix?schema=public
    export REDIS_URL=redis://localhost:6379/0
    ```
  - Run `./install.sh`
  - Open `develop.code-workspace` with VSCode
- Docker (any)
  - Install docker
  - **Windows** - Run `git config --global core.autocrlf false` before cloning.
  - Run `docker build ./development-image -t memorix-dev`
  - Run `docker run -p 2022:22 -p 5432:5432 -p 6379:6379 --name memorix-app -d memorix-dev`
  - Install plugin `Remote - SSH` for VSCode
  - Connect to machine using command `ssh root@localhost -p 2022` (pass `uv`)
  - After connecting run inside machine `./setup.sh`
  - Open `~/dev/memorix/develop.code-workspace` with VSCode
