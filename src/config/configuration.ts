import { ConfigurationType } from './config.type';
import dataSource from './data-source';

export default (): ConfigurationType => ({
  port: parseInt(process.env.PORT) || 3000,
  db: dataSource,
  hedera: {
    testNet: {
      id: process.env.TESTNET_ID,
      key: process.env.TESTNET_KEY,
    },
    mainNet: {
      id: process.env.MAINNET_ID,
      key: process.env.MAINNET_KEY,
    },
  },
});
