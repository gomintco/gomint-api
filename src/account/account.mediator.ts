import { Injectable, Logger } from '@nestjs/common';
import { AccountService } from './account.service';
import { Account } from './account.entity';

@Injectable()
export class AccountMediator {
  private readonly logger = new Logger(AccountMediator.name);

  constructor(private readonly accountService: AccountService) {}

  /**
   * Updates user account and returns old account
   */
  async update(
    userId: string,
    id: string,
    updates: { alias: string },
  ): Promise<Account> {
    const oldAccount = await this.accountService.getUserAccountById(userId, id);
    await this.accountService.update(userId, id, updates);
    return oldAccount;
  }

  async findUserAccounts(userId: string): Promise<Account[]> {
    return await this.accountService.findUserAccounts(userId);
  }
}
