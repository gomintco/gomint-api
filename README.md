# gomint-api

# Description

API for interacting with the Hedera Hashgraph network, including custodial key control, token creation, and transaction handling

## Installation

```bash
$ npm install
```

## Running the app

First create `.env` file that contains all the necessary environment variables. See `.env.example` for the required environment variables

Run MySQL docker container

```bash
$  compose -f compose.dev.yaml up -d
```

Run migrations and seeds

```bash
$ npm run mig:run
$ npm run seed:run
```

Start the app in a certain mode

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Migrations and Seeds

```bash
# creates a new empty seed
$ npm run seed:new <name of the new seed>

# runs all seeds that are down
$ npm run seed:run

# reverts the latest run seed
$ npm run seed:rev

# generates a new migration
$ npm run mig:gen <name of the new migration>

# runs all migrations that are down
$ npm run mig:run

# reverts the latest run migration
$ npm run mig:rev
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
