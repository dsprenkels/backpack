#!/bin/sh

export NODE_ENV="production"
export PUBLIC_URL="/backpack"

npm run-script build || exit 1
rsync -ravuzh --delete build/ suki:/var/www/as8.nl/backpack/ || exit 1
