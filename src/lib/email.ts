export interface EmailParams {
    to: string;
    toName?: string;
    subject: string;
    html: string;
    fromEmail?: string;
    fromName?: string;
}

/**
 * Sends an email using Cloudflare's native MailChannels integration.
 * Requires TXT _mailchannels DNS record on the sending domain.
 */
export async function sendEmail({
    to,
    toName,
    subject,
    html,
    fromEmail = 'members@bestofafrica.com',
    fromName = 'Best of Africa',
}: EmailParams): Promise<boolean> {
    try {
        const payload = {
            personalizations: [
                {
                    to: [{ email: to, name: toName || to }],
                },
            ],
            from: { email: fromEmail, name: fromName },
            subject: subject,
            content: [
                {
                    type: 'text/html',
                    value: html,
                },
            ],
        };

        const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error('[MailChannels Error]', response.status, errorBody);
            return false;
        }

        return true;
    } catch (err) {
        console.error('[MailChannels Exception]', err);
        return false;
    }
}

/**
 * Convenience method to send the standardized Member Welcome Email.
 */
export async function sendWelcomeEmail(email: string, name: string, tier: string): Promise<boolean> {
    const tierDisplay = tier === 'enterprise' ? 'Founding Patron' : tier === 'premium' ? 'Founding Member' : 'Supporter';
    
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, \`Segoe UI\`, Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F1E; padding: 40px 20px; color: #ffffff;">
        <div style="max-w-2xl mx-auto flex flex-col items-center bg-[#111827] border border-[rgba(201,168,76,0.3)] border-radius: 12px; padding: 40px; text-align: center; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <h1 style="font-family: Georgia, serif; font-size: 28px; margin-bottom: 20px;">Welcome to Best of <span style="color: #C9A84C;">Africa</span></h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 30px;">
                Hi ${name},<br><br>
                Thank you for becoming a <strong>${tierDisplay}</strong>. Your support ensures that deep-dive journalism and premium market intelligence covering the continent continues to thrive.
            </p>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 40px;">
                Your account is provisioned and ready. Access your dashboard below:
            </p>
            <a href="https://bestofafrica.com/member-access" style="display: inline-block; background-color: #C9A84C; color: #0A0F1E; text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 8px;">
                Access Dashboard
            </a>
            <p style="margin-top: 40px; font-size: 12px; color: rgba(255,255,255,0.3);">
                If you have any issues, reply directly to this email.<br>
                © ${new Date().getFullYear()} Best of Africa
            </p>
        </div>
    </div>
    `;

    return sendEmail({
        to: email,
        toName: name,
        subject: 'Your Access to Best of Africa',
        html,
    });
}
