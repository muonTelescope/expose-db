# Dockerfile with node and wiring pi
# Based on debian with nginx installed

# Set the base image to nginx
FROM hypriot/rpi-node

# File Author / Maintainer
MAINTAINER asyed5@gsu.edu

# Install wiringPi
RUN git clone git://git.drogon.net/wiringPi
RUN cd wiringPi && ./build

# Symlink nodejs to node
RUN ln -s `which nodejs` /usr/local/bin/node

# NPM Install globals
RUN npm install -g nodemon

# Set wokring directory
WORKDIR /usr/src/app

# Expose the debug port
EXPOSE 5858

# Start node
ENTRYPOINT ["npm", "start"]

