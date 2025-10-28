/**
 * Email sender using Resend
 * Simple interface for sending plain text emails
 */

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailMessage {
  to: string
  subject: string
  body: string
}

/**
 * Sends a plain text email via Resend
 * Returns true if successful, throws error if failed
 */
export async function sendEmail(message: EmailMessage): Promise<boolean> {
  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: message.to,
      subject: message.subject,
      text: message.body
    })
    
    if (result.error) {
      throw new Error(`Resend error: ${result.error.message}`)
    }
    
    return true
  } catch (error) {
    console.error('Email send failed:', error)
    throw error
  }
}

/**
 * Sends a test email to verify configuration
 * Useful for debugging email setup
 */
export async function sendTestEmail(to: string): Promise<boolean> {
  const message: EmailMessage = {
    to,
    subject: 'Skimbox Test Email',
    body: 'This is a test email from Skimbox. If you receive this, your email configuration is working correctly.'
  }
  
  return sendEmail(message)
}
