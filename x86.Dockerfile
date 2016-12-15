# Dockerfile to build iot webserver
# Based on debian with nginx installed

# Set the base image to nginx
FROM node

# File Author / Maintainer
MAINTAINER asyed5@gsu.edu

# Update
# RUN apt-get -y update && apt-get install -y \
# package \
# package

# Symlink nodejs to node
# RUN ln -s `which nodejs` /usr/local/bin/node

# NPM Install globals
RUN npm install -g nodemon@1.10.0

# Set wokring directory
WORKDIR /usr/src/app

# Expose the default port
EXPOSE 5858

# Start node
ENTRYPOINT ["npm", "start"]
