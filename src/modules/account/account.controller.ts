import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { FindAccountsDto } from './dto/find-accounts.dto';
import {
  IntrospectionService,
  PaginatedQuery,
  PaginatedQueryResult
} from '@common/pagination';
import { Public } from '@common/decorators/public.decorator';

@Controller('account')
export class AccountController {
  private readonly introspectionService = new IntrospectionService();

  constructor(private readonly accountService: AccountService) {
    console.log('\n🔎 FindAccountsDto Schema:');
    this.introspectionService.printSummary(FindAccountsDto);
  }

  @Get()
  async getCurrentAccount() {
    return this.accountService.getCurrentAccount();
  }

  @Get('search')
  @Public()
  async searchAccounts(
    @PaginatedQuery(FindAccountsDto) queryInstructions: PaginatedQueryResult
  ) {
    return this.accountService.searchAccounts(queryInstructions);
  }

  @Patch()
  async updateAccount(@Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.updateAccount(updateAccountDto);
  }
}
