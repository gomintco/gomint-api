import { AccountId, Client, Hbar, PrivateKey } from '@hashgraph/sdk';
import { Injectable } from '@nestjs/common';
import { Network } from 'src/hedera-api/network.enum';
import { Account } from 'src/account/account.entity';
import { KeyService } from 'src/key/key.service';
import { InvalidNetworkError } from 'src/deal/error/invalid-network.error';
import { AppConfigService } from 'src/config/app-config.service';

@Injectable()
export class ClientService {
  constructor(
    private readonly configService: AppConfigService,
    private readonly keyService: KeyService,
  ) {}

  getClient(network: Network) {
    switch (network) {
      case Network.MAINNET:
        return Client.forMainnet().setOperator(
          this.configService.hedera.mainnet.id,
          this.configService.hedera.mainnet.key,
        );
      case Network.TESTNET:
        return Client.forTestnet().setOperator(
          this.configService.hedera.testnet.id,
          this.configService.hedera.testnet.key,
        );
      default:
        throw new InvalidNetworkError();
    }
  }

  buildClientAndSigningKeys(
    network: Network,
    escrowKey: string,
    actionAccount: Account, // here the action account is the account which the transcaction will be applied to
    // e.g. actionAccount will have a token associated to it, but the payerAccount may pay
    payerAccount?: Account,
  ) {
    let client: Client;
    let signers: PrivateKey[] = [];
    // Decrypt action account keys
    const decryptedActionAccountKeys = this.keyService.decryptAccountKeys(
      actionAccount.keys,
      escrowKey,
    );
    if (payerAccount) {
      // Decrypt payer account keys
      const decryptedPayerAccountKeys = this.keyService.decryptAccountKeys(
        payerAccount.keys,
        escrowKey,
      );
      // Add payer account keys for signing
      signers = decryptedPayerAccountKeys;
      // Handle logic for payer account
      client = this.buildClient(
        network,
        payerAccount.id,
        decryptedPayerAccountKeys[0],
      );
      signers.push(decryptedActionAccountKeys[0]);
    } else {
      client = this.buildClient(
        network,
        actionAccount.id,
        decryptedActionAccountKeys[0],
      );
    }
    return {
      client,
      signers,
    };
  }

  buildClient(
    network: Network,
    accountId: string | AccountId,
    privateKey: string | PrivateKey,
  ) {
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
