FROM hub.tess.io/raptorhub/nodejs-base-image:nodev16-0.4.6

WORKDIR /ebay/app
COPY --chown=ebayapp:app . /ebay/app/

RUN npm install

# TODO run tests

# run app
EXPOSE 8080
CMD npm start