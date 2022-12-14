import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SendEmailInterface } from '../../sendgrid/interfaces/send-email.interface';
import { SendgridService } from '../../sendgrid/service/sendgrid.service';
import { MailStatusEnum } from '../enum/mail-status.enum';
import { MailService } from '../mail.service';

@Injectable()
export class MailCron {
  private logger = new Logger(MailCron.name);
  constructor(private readonly mailService: MailService, private sendGridService: SendgridService) {}
  @Cron(CronExpression.EVERY_10_SECONDS)
  async handler() {
    const mailList = await this.mailService.findAll({
      dueDateLte: new Date().toISOString(),
      status: MailStatusEnum.WAITING,
    });

    for (const mail of mailList) {
      const data: SendEmailInterface = {
        personalizations: [
          {
            to: [
              {
                name: mail.destinationName,
                email: mail.destinationAddress,
              },
            ],
          },
        ],
        from: {
          name: 'Gilmar',
          email: 'gilmar.oliveira96@gmail.com',
        },
        reply_to: {
          name: 'Gilmar',
          email: 'gilmar.oliveira96@gmail.com',
        },
        subject: mail.subject,
        content: [
          {
            type: 'text/html',
            value: mail.body,
          },
        ],
      };
      await this.sendGridService.sendEmail(data);
      await this.mailService.updateStatus(mail.id, MailStatusEnum.SENT);
      this.logger.log('E-mail enviado com sucesso');
    }
  }
}
