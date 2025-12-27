import sgMail from '@sendgrid/mail';

interface SendEmailParams {
  to: string;
  templateId: string;
  dynamicData: Record<string, any>;
  subject?: string; // Optional override
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export class SendGridEmailClient {
  private config: SendGridConfig;

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM_ADDRESS;
    const fromName = process.env.EMAIL_FROM_NAME;

    if (!apiKey || !fromEmail || !fromName) {
      throw new Error('SendGrid configuration missing. Check environment variables.');
    }

    this.config = {
      apiKey,
      fromEmail,
      fromName,
    };

    sgMail.setApiKey(apiKey);
  }

  async sendEmail(params: SendEmailParams): Promise<boolean> {
    try {
      console.log('[SendGrid] Sending email:', {
        to: params.to,
        templateId: params.templateId,
      });

      const msg = {
        to: params.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName,
        },
        templateId: params.templateId,
        dynamicTemplateData: params.dynamicData,
      };

      if (params.subject) {
        // Subject override (optional)
        Object.assign(msg, { subject: params.subject });
      }

      await sgMail.send(msg);

      console.log('[SendGrid] Email sent successfully to:', params.to);
      return true;
    } catch (error: any) {
      console.error('[SendGrid] Email send failed:', {
        error: error.message,
        response: error.response?.body,
      });
      return false;
    }
  }

  async sendTestEmail(to: string, templateId: string, dynamicData: Record<string, any>): Promise<boolean> {
    console.log('[SendGrid] Sending test email to:', to);
    return this.sendEmail({ to, templateId, dynamicData });
  }
}

// Export singleton instance
export const sendGridClient = new SendGridEmailClient();
