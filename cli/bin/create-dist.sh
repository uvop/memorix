#!/bin/bash

for FILE in ./lib/release/*; do
    if [[ $FILE == *exe ]] ; then
        mv $FILE memorix.exe
        zip ${FILE/exe/zip} memorix.exe
        mv memorix.exe $FILE;
    else
        mv $FILE memorix
        tar -czf $FILE.tar.gz memorix
        mv memorix $FILE
    fi
done