FROM node:25.7.0-bookworm

WORKDIR /ebay/app
COPY --chown=ebayapp:app . /ebay/app/

RUN npm install

# TODO run tests

# run app
EXPOSE 8080
CMD npm start