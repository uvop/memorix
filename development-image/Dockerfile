FROM ubuntu:18.04

### Envrionment config-
ENV HOME "/root"
ENV DOCKER_SCRIPTS "$HOME/docker-scripts"
ENV PW "uv"

RUN echo "root:${PW}" | chpasswd 

WORKDIR $HOME

### Copy all install scripts for further steps
COPY ./scripts/ $DOCKER_SCRIPTS/
RUN find $DOCKER_SCRIPTS -name '*.sh' -exec chmod a+x {} +

# Install openssh-server
RUN $DOCKER_SCRIPTS/install-openssh-server.sh

# Prepare
RUN apt-get install -y sudo
RUN apt -y install wget software-properties-common
RUN apt-get -y install apt-transport-https build-essential
RUN apt-get update 
RUN apt-get -y install curl zsh git keychain zip

# Install NodeJS
RUN export NVM_DIR=$HOME/.nvm \
  && curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.36.0/install.sh | bash
ENV NVM_DIR $HOME/.nvm
ENV NODE_VERSION 16.14.2
RUN export NVM_DIR=$HOME/.nvm \
  && . $NVM_DIR/nvm.sh \
  && nvm install $NODE_VERSION \
  && nvm alias default $NODE_VERSION \
  && nvm use default
ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

# Install yarn
RUN wget --no-check-certificate -q -O - https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list
RUN apt-get update && apt-get -y install --no-install-recommends yarn

# Install PostgreSQL
RUN wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)"-pgdg main | tee  /etc/apt/sources.list.d/pgdg.list
RUN apt-get update && DEBIAN_FRONTEND="noninteractive"  apt -y install postgresql-11

# Install Redis
RUN wget http://download.redis.io/releases/redis-6.2.4.tar.gz -O $HOME/redis-6.2.4.tar.gz
RUN tar xzf $HOME/redis-6.2.4.tar.gz -C $HOME && rm $HOME/redis-6.2.4.tar.gz
RUN cd $HOME/redis-6.2.4 && make

# Configure shell
RUN mkdir $HOME/git-tools
RUN git clone https://github.com/sindresorhus/pure.git $HOME/.zsh/pure
RUN git clone https://github.com/marlonrichert/zsh-autocomplete $HOME/.zsh/zsh-autocomplete
RUN sed -i 's/required/sufficient/' /etc/pam.d/chsh
RUN chsh -s `which zsh`
COPY ./.zshrc $HOME/.zshrc

COPY ./setup.sh $HOME/setup.sh
RUN chmod +x $HOME/setup.sh

EXPOSE 22
EXPOSE 5432
EXPOSE 6379

ENTRYPOINT $DOCKER_SCRIPTS/entrypoint.sh