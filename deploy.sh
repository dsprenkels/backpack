#!/bin/sh

export NODE_ENV="production"
export PUBLIC_URL="/backpack"

npm run build || exit 1
rsync -ravuzh --delete dist/ suki:/var/www/as8.nl/backpack/ || exit 1
