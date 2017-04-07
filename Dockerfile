# Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
# Distributed under the terms of the GNU Affero General Public License v3

FROM node

RUN npm install -g nodemon
EXPOSE 8080

RUN mkdir -p /code
COPY . /code

WORKDIR /code
RUN npm install

VOLUME /code
ENV DB_HOST="localhost" \
	DB_USER="website" \
	DB_PORT="5432" \
	DB_NAME="website" \
	DB_PASS="" \
	CONFIG_HOST="localhost" \
	CONFIG_PORT="8080"

VOLUME /code/node_modules/config

CMD [ "npm", "start" ]
