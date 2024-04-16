import { Client, Hbar } from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';
import { Network } from 'src/app.interface';

@Injectable()
export class ClientService {
  getClient(network: Network) {
    switch (network) {
      case Network.MAINNET:
        return Client.forMainnet().setOperator(
          process.env.MAINNET_ID,
          process.env.MAINNET_KEY,
        );
      case Network.TESTNET:
        return Client.forTestnet().setOperator(
          process.env.TESTNET_ID,
          process.env.TESTNET_KEY,
        );
      default:
        throw new Error('Invalid network');
    }
  }

  buildClient(network: Network, accountId: string, privateKey: string) {
    switch (network) {
      case Network.MAINNET:
        return Client.forMainnet()
          .setOperator(accountId, privateKey)
          .setDefaultMaxTransactionFee(new Hbar(50));
      case Network.TESTNET:
        return Client.forTestnet()
          .setOperator(accountId, privateKey)
          .setDefaultMaxTransactionFee(new Hbar(50));
      default:
        throw new Error('Invalid network');
    }
  }
}
