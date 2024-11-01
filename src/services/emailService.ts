import emailjs from 'emailjs-com';

interface EmailData {
  subject: string;
  body: string;
}

// Initialize EmailJS with your public key
emailjs.init("YOUR_PUBLIC_KEY");

export const emailService = {
  async sendEmail(data: EmailData): Promise<boolean> {
    try {
      const response = await emailjs.send(
        "service_b53c3ts", // Service ID
        "template_7k335rj", // Template ID
        {
          to_email: 'richyhunter.rh@gmail.com',
          subject: data.subject,
          message: data.body,
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to send email');
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  },
};