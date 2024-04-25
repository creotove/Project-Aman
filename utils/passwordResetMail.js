import nodemailer from 'nodemailer';

// Create a transporter using SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // Use `true` for port 465, `false` for all other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

// Function to generate a random OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000); // Generate a 6-digit OTP
}

// Function to send OTP email
function sendOTPEmail(email, otp) {
  // Email content
  const mailOptions = {
    from: process.env.SMTP_USER, // Your email address
    to: email, // Recipient's email address
    subject: 'OTP for Password Reset', // Subject line
    html: `
      <p>Your OTP (One-Time Password) for resetting your password is: <strong>${otp}</strong></p>
      <p>Please use this OTP to reset your password.</p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
    `
  };

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error occurred while sending email:', error);
      return false
    } else {
      console.log('Email sent:', info.response);
      return true
    }
  });
}


export { generateOTP, sendOTPEmail}