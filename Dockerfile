# Copyright 2017 (c) Michael Thomas (malinka) <malinka@entropy-development.com>
# Distributed under the terms of the GNU Affero General Public License v3

FROM us.gcr.io/entropy-development/node

RUN mkdir -p /code
COPY . /code
WORKDIR /code
RUN npm install
VOLUME /code

ENV	CONFIG_HOST="localhost" \
	CONFIG_PORT="8081"

CMD [ "npm", "start" ]
