# dbc-community-service

[![David](https://img.shields.io/david/DBCDK/dbc-community-service.svg?style=flat-square)](https://david-dm.org/DBCDK/dbc-community-service#info=dependencies)
[![David](https://img.shields.io/david/dev/DBCDK/dbc-community-service.svg?style=flat-square)](https://david-dm.org/DBCDK/dbc-community-service#info=devDependencies)

DBC community web service

## Logging
The dbc-community-service implements the [dbc-node-logger](https://github.com/DBCDK/dbc-node-logger) which makes it possible to log to Kafka among others.
To enure your logs will be transported to Kafka the following environment variables should be set:

- __KAFKA_TOPIC__
This defines which topic in Kafka the log messages should be associated with

- __KAFKA_HOST__
String that defines the Zookeeper connectionstring. Should be defined as `host:port`.
see [winston-kafka-transport](https://www.npmjs.com/package/winston-kafka-transport)

## How to install

### Postgres

Login with postgres user and open psql client.

```Shell
sudo -i -u postgres
psql
```


Now create a new database

```PLpgSQL
CREATE DATABASE dbc_community;
```

Create a new user with name=communitydb and password=loobbackcommunity

```PLpgSQL
CREATE USER communitydb WITH PASSWORD 'loobbackcommunity';
GRANT ALL PRIVILEGES ON DATABASE ‘dbc_community’ TO communitydb;
```

## Environment variables

- __USE_DEFAULT_CONFIG__
This environment variable ensures the config specified in datasources.development.js. This is only supported in development mode.

- __APPLICATION_NAME__
The name of the application

- __AMAZON_S3_KEYID__
Your amazon keyId, for access to S3.

- __AMAZON_S3_KEY__
Your amazon key, for access to S3.

- __UNILOGINSECRET__
Your unilogin secret, this must match whatever you use to authenticate.

- __USE_ENV_CONFIG__
This environment variable loads as much configuration from environment variables as possible. The following variables are required.

- __DATABASE_HOST__
The host running the Postgres database. 

- __DATABASE_PORT__
The port to use when connecting to the Postgres database.

- __DATABASE_DB__
The database to hold the application data.

- __DATABASE_USER__
The user to use when connecting to the database.

- __DATABASE_PASSWORD__
The password to use when connecting to the database.
