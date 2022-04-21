#!/bin/bash

# Create or keep ssh key
mkdir -p $HOME/.ssh
ssh-keygen -t rsa -b 4096 -C "$email" -f $HOME/.ssh/id_rsa -q -P ""

# Create gitconfig
read -p "Enter Your Name (github): "  name
git config --global user.name "$name"
read -p "Enter Your Email (github): "  email
git config --global user.email "$email"

# Add credentials to gh
echo -e "\n \n \nSHA credentials:\n"
cat $HOME/.ssh/id_rsa.pub
echo -e "\n"
read -p "Copy SHA credentials to github (https://github.com/settings/keys) and press Enter once finished."  copied


mkdir -p $HOME/dev
cd $HOME/dev

if [ ! -d "$HOME/dev/memorix" ] 
then
    echo "Directory 'memorix' doesn't exist, starting setup" 
    cd $HOME/dev/bb
    git clone git@github.com:uvop/memorix.git
    cd memorix
    ./install.sh
else
    echo "Directory 'memorix' exists, skipping setup" 
fi
