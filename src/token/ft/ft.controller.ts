import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader } from '@nestjs/swagger';

import { FtService } from './ft.service';
import { CreateFtDto } from './dto/create-ft.dto';
import { AuthGuard } from '../../auth/auth.guard';
import { UserService } from '../../user/user.service';
import { KeyService } from 'src/key/key.service';
import { AccountService } from 'src/account/account.service';
import { FtCreateInput } from './ft.interface';
import { Provider, Wallet } from '@hashgraph/sdk';
import { ClientService } from 'src/client/client.service';

@ApiHeader({
  name: 'Authorization',
  description: 'Authorization header',
})
@Controller('ft')
@UseGuards(AuthGuard) // might be better to use middleware for this
export class FtController {
  constructor(
    private ftService: FtService,
    private userService: UserService,
    private keyService: KeyService,
    private clientService: ClientService,
    private accountService: AccountService,
  ) {}

  @Post('create')
  async create(@Req() request: Request, @Body() createFtDto: CreateFtDto) {
    const authorization = request.headers['authorization'];
    const [type, base64] = authorization.split(' ');
    const [userId, password] = Buffer.from(base64, 'base64')
      .toString('ascii')
      .split(':');

    console.log('create ft dto', createFtDto);

    // get account id from userId
    // return error if no account id?
    const user = await this.userService.findOne(userId);
    // lazy load
    const [accounts, keys] = await Promise.all([user.accounts, user.keys]);
    const mainAccount = accounts[0];
    const mainKeyPair = keys[0];
    const publicKey = mainKeyPair.publicKey;
    // decrypt keys with password
    const escrowKey = this.keyService.decryptString(user.escrowKey, password);
    const privateKey = this.keyService.decryptString(
      mainKeyPair.encryptedPrivateKey,
      escrowKey,
    );

    console.log('privateKey', privateKey);

    const ftCreateInput: FtCreateInput = {
      ...createFtDto, // this may need to be adapted - pipes?
      treasuryAccountId: mainAccount.id,
      //   tokenName: createFtDto.tokenName,
      //   tokenSymbol: createFtDto.tokenSymbol,
      //   treasuryAccountId: createFtDto.treasuryAccountId ?? mainAccount.id,
    };

    // const provider = Provider("testnet")
    // const wallet = new Wallet(mainAccount.id, privateKey, ); HOW DO I SET THE PROVIDER?

    const client = this.clientService.buildClient(
      user.network,
      mainAccount.id,
      privateKey,
    );

    // create ft token
    const token = await this.ftService.createTransactionAndExecute(
      ftCreateInput,
      client,
    );

    console.log('token', token);

    return { token };
  }
}
