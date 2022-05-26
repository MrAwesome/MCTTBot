#!/bin/bash

source ~/bin/init-nvm
nvm use 16
nodemon -i testit.ts -i tmp/ -i src/Akroma/ -- src/index.ts
