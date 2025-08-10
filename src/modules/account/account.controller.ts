import { Body, Controller, Get, Patch } from '@nestjs/common';
import { AccountService } from './account.service';
import { UpdateAccountDto } from './dto/update-account.dto';
import { UpdateCustomizationDto } from './dto/update-customization.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('account')
@Controller('account')
export class AccountController {
  constructor(private readonly accountService: AccountService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user account details' })
  @ApiOkResponse({ description: 'Returns the current user profile', schema: { example: { id: 1, email: 'me@example.com', firstName: 'John', lastName: 'Doe', userName: 'john_doe', emailVerified: true, followersCount: 10, followsCount: 5, customization: { bodyShape: 'athletic', bodyTone: 'tan' } } } })
  async getCurrentAccount() {
    return this.accountService.getCurrentAccount();
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile fields (except email)' })
  @ApiOkResponse({ description: 'Returns updated profile', schema: { example: { id: 1, email: 'me@example.com', firstName: 'Johnny', lastName: 'Doe', userName: 'johnny', emailVerified: true } } })
  async updateAccount(@Body() dto: UpdateAccountDto) {
    return this.accountService.updateAccount(dto);
  }

  @Patch('customization')
  @ApiOperation({ summary: 'Update avatar customization' })
  @ApiOkResponse({ description: 'Returns updated customization json', schema: { example: { customization: { bodyShape: 'athletic', bodyTone: 'tan', eyeColor: '#4a8ef0', expression: 'smile', hairColor: 'black', hairstyle: 'short', glassesStyle: 'round', glassesColor: '#000000', facialHairColor: '#8b4513', facialHair: 'mustache', headwearColor: '#ffcc00', headwear: 'cap', clothingColor: '#dddddd', backgroundColor: '#ffffff' } } } })
  async updateCustomization(@Body() dto: UpdateCustomizationDto) {
    return this.accountService.updateCustomization(dto);
  }
}
