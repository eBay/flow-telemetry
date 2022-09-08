set -euof pipefail
IFS=$'\n\t'

VERSION=0.0.1
TAG=hub.tess.io/dvancouvering/flowtelemetry:$VERSION

docker login hub.tess.io

docker build -t $TAG -f ./Dockerfile .

docker push $TAG