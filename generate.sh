#!/usr/bin/env bash

set -e

BASE=src

mkdir -p $BASE/{app,server,config,db,auth,security,steganography,routes,utils}

mkdir -p $BASE/db/repos
mkdir -p $BASE/auth/services
mkdir -p $BASE/security/services
mkdir -p $BASE/steganography/{text,image,audio,reciprocal}

touch \
$BASE/app/app.js \
$BASE/server/server.js \
$BASE/config/{env.js,database.js,crypto.js} \
$BASE/db/{index.js,init.js} \
$BASE/db/repos/{users.repo.js,apiKeys.repo.js,rateLimits.repo.js,encryptionKeys.repo.js} \
$BASE/auth/{auth.middleware.js} \
$BASE/auth/services/{jwt.service.js,apiKey.service.js} \
$BASE/security/services/{password.service.js,encryption.service.js} \
$BASE/security/rateLimit.middleware.js \
$BASE/steganography/text/text.stego.js \
$BASE/steganography/image/image.stego.js \
$BASE/steganography/audio/audio.stego.js \
$BASE/steganography/reciprocal/reciprocal.service.js \
$BASE/routes/{auth.routes.js,encryption.routes.js,text.routes.js,image.routes.js,audio.routes.js,reciprocal.routes.js} \
$BASE/utils/{binary.util.js,response.util.js,error.util.js}

echo "✔ Directory structure created"
