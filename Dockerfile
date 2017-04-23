# Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
# Distributed under the terms of the GNU Affero General Public License v3

FROM node

RUN mkdir -p /code
COPY . /code
WORKDIR /code
RUN npm install
VOLUME /code
VOLUME /code/node_modules/config

ENV DB_HOST="localhost" \
	DB_USER="website" \
	DB_PORT="5432" \
	DB_NAME="website" \
	DB_PASS="" \
	CONFIG_HOST="localhost" \
	CONFIG_PORT="8080" \
	FORWARD="localhost:8080"

CMD [ "npm", "start" ]
