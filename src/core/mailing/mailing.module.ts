import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import * as path from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import envConfig from '../../../env.config';
import { MailingService } from './mailing.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: envConfig.MAIL_HOST,
        port: envConfig.MAIL_PORT,
        secure: envConfig.MAIL_SECURE,
        auth: {
          user: envConfig.MAIL_USER,
          pass: envConfig.MAIL_PASSWORD
        }
      },
      template: {
        dir: path.join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true
        }
      }
    })
  ],
  providers: [MailingService],
  exports: [MailingService]
})
export class MailingModule {}
