#!/bin/sh

export NODE_ENV="production"
export PUBLIC_URL="/paklijst"

npm run-script build || exit 1
rsync -ravuzh --delete build/ suki:/var/www/ds7s.nl/paklijst/ || exit 1