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
    fromName = 'BOA-Story',
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

export interface RegistrationConfirmationParams {
    registrationId: string;
    confirmationCode: string;
    user_email: string;
    user_name?: string;
    event: { title: string; date?: string; date_start?: string; location?: string };
}

export async function sendRegistrationConfirmation({
    confirmationCode,
    user_email,
    user_name,
    event,
}: RegistrationConfirmationParams): Promise<boolean> {
    const displayName = user_name || user_email;
    const eventDate = event.date || event.date_start || '';
    const location = event.location || '';

    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F1E; padding: 40px 20px; color: #ffffff;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid rgba(201,168,76,0.3); border-radius: 12px; padding: 40px; text-align: center;">
            <h1 style="font-family: Georgia, serif; font-size: 26px; margin-bottom: 8px;">Registration Confirmed</h1>
            <p style="font-size: 14px; color: rgba(255,255,255,0.5); margin-bottom: 32px;">${event.title}</p>
            <p style="font-size: 16px; color: rgba(255,255,255,0.8); line-height: 1.6; margin-bottom: 24px;">
                Hi ${displayName},<br><br>
                You are successfully registered. Please keep your confirmation code safe — you will need it at check-in.
            </p>
            <div style="background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.4); border-radius: 8px; padding: 20px; margin-bottom: 32px;">
                <p style="margin: 0 0 6px; font-size: 12px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 1px;">Confirmation Code</p>
                <p style="margin: 0; font-size: 24px; font-weight: 700; color: #C9A84C; letter-spacing: 2px;">${confirmationCode}</p>
            </div>
            ${eventDate || location ? `
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 32px; text-align: left;">
                ${eventDate ? `<tr><td style="padding: 8px 0; color: rgba(255,255,255,0.4); font-size: 13px; width: 80px;">Date</td><td style="padding: 8px 0; color: rgba(255,255,255,0.8); font-size: 13px;">${eventDate}</td></tr>` : ''}
                ${location ? `<tr><td style="padding: 8px 0; color: rgba(255,255,255,0.4); font-size: 13px;">Location</td><td style="padding: 8px 0; color: rgba(255,255,255,0.8); font-size: 13px;">${location}</td></tr>` : ''}
            </table>` : ''}
            <p style="margin-top: 40px; font-size: 12px; color: rgba(255,255,255,0.3);">
                Questions? Reply to this email.<br>
                © ${new Date().getFullYear()} BOA-Story
            </p>
        </div>
    </div>`;

    return sendEmail({
        to: user_email,
        toName: user_name,
        subject: `Registration Confirmed: ${event.title} [${confirmationCode}]`,
        html,
    });
}

/**
 * Convenience method to send the standardized Member Welcome Email.
 */
export async function sendWelcomeEmail(email: string, name: string, tier: string): Promise<boolean> {
    const tierDisplay = tier === 'enterprise' ? 'Founding Patron' : tier === 'premium' ? 'Founding Member' : 'Supporter';
    
    const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, \`Segoe UI\`, Roboto, Helvetica, Arial, sans-serif; background-color: #0A0F1E; padding: 40px 20px; color: #ffffff;">
        <div style="max-w-2xl mx-auto flex flex-col items-center bg-[#111827] border border-[rgba(201,168,76,0.3)] border-radius: 12px; padding: 40px; text-align: center; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
            <h1 style="font-family: Georgia, serif; font-size: 28px; margin-bottom: 20px;">Welcome to <span style="color: #C9A84C;">BOA-Story</span></h1>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 30px;">
                Hi ${name},<br><br>
                Thank you for becoming a <strong>${tierDisplay}</strong>. Your support as an early believer helps us surface real, grounded stories about African lives and cities, free from disaster headlines.
            </p>
            <p style="font-size: 16px; color: rgba(255,255,255,0.7); line-height: 1.6; margin-bottom: 40px;">
                Your account is provisioned and ready. Access your dashboard below:
            </p>
            <a href="https://boastory.com/member-access" style="display: inline-block; background-color: #C9A84C; color: #0A0F1E; text-decoration: none; font-weight: 600; padding: 14px 28px; border-radius: 8px;">
                Access Dashboard
            </a>
            <p style="margin-top: 40px; font-size: 12px; color: rgba(255,255,255,0.3);">
                If you have any issues, reply directly to this email.<br>
                © ${new Date().getFullYear()} BOA-Story
            </p>
        </div>
    </div>
    `;

    return sendEmail({
        to: email,
        toName: name,
        subject: 'Your Access to BOA-Story',
        html,
    });
}
