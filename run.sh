#!/bin/bash

source ~/bin/init-nvm
nvm use 16
nodemon -i src/Akroma/ -- src/index.ts
