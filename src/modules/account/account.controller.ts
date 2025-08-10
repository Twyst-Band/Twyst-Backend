import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';

@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  async getCurrentAccount() {
    return this.accountService.getCurrentAccount();
  }

  @Patch()
  async updateAccount(@Body() dto: UpdateAccountDto) {
    return this.accountService.updateAccount(dto);
  }
}
