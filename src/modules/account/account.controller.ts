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
    // Log the DTO schema on controller initialization
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
    console.log('\n=== Paginated Query Instructions ===');
    console.log('Filters:', queryInstructions.filters);
    console.log('Sorting:', queryInstructions.sorting);
    console.log('Pagination Type:', queryInstructions.paginationType);
    console.log('Limit:', queryInstructions.limit);
    console.log('Page:', queryInstructions.page);
    console.log('Cursor:', queryInstructions.cursor);
    console.log('====================================\n');

    const result = await this.accountService.searchAccounts(queryInstructions);

    console.log('\n=== Paginated Response ===');
    console.log('Data count:', result.data.length);
    if ('page' in result) {
      console.log('Page:', result.page);
      console.log('Limit:', result.limit);
    }
    if ('nextCursor' in result) {
      console.log('Next Cursor:', result.nextCursor);
    }
    console.log('==========================\n');

    return result;
  }

  @Patch()
  async updateAccount(@Body() updateAccountDto: UpdateAccountDto) {
    return this.accountService.updateAccount(updateAccountDto);
  }
}
