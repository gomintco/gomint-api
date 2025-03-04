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
      jwtExpiresIn: env.JWT_EXPIRES_IN,
    },
    db: getDBConfig(env),
    hedera: {
      testnet: {
        id: env.TESTNET_ID,
        key: env.TESTNET_KEY,
        mirrornodeUrl: env.TESTNET_MIRRORNODE_URL,
        custodialKey: PrivateKey.fromStringED25519(env.TESTNET_CUSTODIAL_KEY),
      },
      mainnet: {
        id: env.MAINNET_ID,
        key: env.MAINNET_KEY,
        mirrornodeUrl: env.MAINNET_MIRRORNODE_URL,
        custodialKey: PrivateKey.fromStringED25519(env.MAINNET_CUSTODIAL_KEY),
      },
    },
    ipfs: {
      web3StorageKey: env.WEB3_STORAGE_KEY,
      web3StorageProof: env.WEB3_STORAGE_PROOF,
    },
  };
}
