import { PrivateKey } from '@hashgraph/sdk';
import { Configuration } from './configuration.type';
import { getDBConfig } from './db-config';
import { validate } from './validation';

export function configure(): Configuration {
  const env = validate(process.env);
  return {
    app: {
      env: env.NODE_ENV,
      port: env.PORT,
      jwtSecret: env.JWT_SECRET,
    },
    db: getDBConfig(env),
    hedera: {
      custodialKey: PrivateKey.fromStringED25519(env.CUSTODIAL_KEY),
      testnet: {
        id: env.TESTNET_ID,
        key: env.TESTNET_KEY,
        mirrornodeUrl: env.TESTNET_MIRRORNODE_URL,
      },
      mainnet: {
        id: env.MAINNET_ID,
        key: env.MAINNET_KEY,
        mirrornodeUrl: env.MAINNET_MIRRORNODE_URL,
      },
    },
  };
}
