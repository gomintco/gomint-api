# gomint-api

# Description

The GoMint API is an Open Source solution for interacting with the Hedera Hashgraph network. It integrates with existing user databases and simplifies the process of creating and submitting transactions to the Hedera network.

## Features

- User authentication and authorization
- Token creation and management
- Transaction handling
- Custodial key control
- Consensus service

## Installation

```bash
$ npm install
```

## Running the app in development mode

First create `.env` file that contains all the necessary environment variables. See `.env.example` for the required environment variables

[web3.storage](https://web3.storage/) is used to store files (e.g. NFT metdata) on IPFS. Follow this [link](https://web3.storage/docs/how-to/upload/#using-the-js-client) to configure the WEB_3_XXX environment variables.

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

## Production deployment

```bash
# build the app
$ npm run build

# start the app
$ npm run start:prod

```
