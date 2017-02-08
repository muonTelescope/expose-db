# Expose DB
This module communicates with a mysql backend database provided by the "db" module. 

## Schema
The database consists of a "detector"  table that contains information about each detector and that can be connected to each detector getting a table that holds its data. The tables are accociated to the detector information by a alias, that is the name of the detector specific table.

## REST API
The rest api is exposed on the port listed in the config.js file. This api allows preforming queries to get data in multiple formats.

The data can be returned in chart, json or csv files. An example for a detector named lloydWright would look like the following.

```
/lloydWright?type=csv
```

And one for a averaged chart display with two collums.
```
/lloydWright?type=chart&select={"attributes":["createdAt", "Zero and One", "Zero and Two"]}&limitDays=0&averageMin=10
```
More information on the availible commands on the select query string can be seen in the [sequelize documention](http://docs.sequelizejs.com/en/latest/docs/querying/).

Adding is done with a query string for peramters, and a API key that is a randomly generated UUID that is required for making changes.

```
/add/lloydWright?Zero=3&One=5&apiKey=*****************
```

## Installing
The module is designed to be easily spun up using docker. A node instance is . There are two dockerfiles availible for both arm, and x86 systems.

### Build
The docker image needs to be built, tagging it makes it easier to run it.

#### Manually

```bash
docker build -t "expose-db" --file x86.Dockerfile .
```

```bash
docker run -p 8000:8000 --name expose-db -v /cygdrive/c/Users/sawaiz/Desktop/expose-db:/usr/src/app expose-db 
```

#### Compose
If expose-db is in a subfolder adding this to your parent `docker-compose.yml` file should allow just `docker-compose up` to bring your continer up and connectedto the other containters.

```yml
  expose-db:
    build: 
      context: ./expose-db
      dockerfile: x86.Dockerfile
    volumes:
      - ./expose-db:/usr/src/app:rw
    ports:
      - "5858:5858"
    links:
      - db
```