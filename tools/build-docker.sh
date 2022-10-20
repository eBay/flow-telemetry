set -euof pipefail
IFS=$'\n\t'

VERSION=0.0.2
TAG=ebay/flowtelemetry:$VERSION

docker build -t $TAG -f ./Dockerfile .