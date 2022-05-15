#!/bin/bash

source ~/bin/init-nvm
nvm use 16
nodemon -i src/Akroma/__pycache__ -i src/Akroma/tda_data/ -i src/Akroma/tda_token.json -- src/index.ts
