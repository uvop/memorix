#!/bin/bash

for FILE in ./lib/release/*; do
    if [[ $FILE == *exe ]] ; then
        mv $FILE memorix.exe
        zip ${FILE/exe/zip} memorix.exe
        rm memorix.exe
    else
        mv $FILE memorix
        tar -czf $FILE.tar.gz memorix
        rm memorix
    fi
done