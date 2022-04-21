source $HOME/.zsh/zsh-autocomplete/zsh-autocomplete.plugin.zsh

fpath+=$HOME/.zsh/pure
autoload -U promptinit; promptinit
prompt pure

export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

export ANDROID_SDK_ROOT=$HOME/android-sdk
export PATH="PATH=$PATH:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/cmdline-tools/tools/bin"

export DATABASE_URL=postgresql://postgres:uv@localhost:5432/default?schema=public
export REDIS_URL=redis://localhost:6379/0