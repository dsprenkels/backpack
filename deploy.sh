#!/bin/sh

export NODE_ENV="production"
export PUBLIC_URL="/paklijst"

npm run-script build || exit 1
rsync -ravuzh --delete build/ suki:/var/www/as8.nl/paklijst/ || exit 1
