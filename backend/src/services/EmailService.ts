/**
 * Simulator for transactional email dispatching.
 */
export class EmailService {
  public async sendEmail(to: string, subject: string, body: string): Promise<boolean> {
    // Simulate network delay for mail servers (e.g. SMTP/Mailgun handshake)
    await new Promise((resolve) => setTimeout(resolve, 5));
    console.log(`[Email Simulator] To: ${to} | Subject: ${subject} | Body snippet: "${body.substring(0, 40)}..."`);
    return true;
  }
}

export const emailService = new EmailService();
