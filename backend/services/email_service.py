import smtplib
import os
from pathlib import Path
from email.message import EmailMessage
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from string import Template
from dotenv import load_dotenv

# Load environment variables - explicitly set path to backend/.env
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
print(f"🔍 [email_service] Loading .env from: {env_path}")
print(f"🔍 [email_service] .env file exists: {env_path.exists()}")

if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
    print("✅ [email_service] .env file loaded successfully")
else:
    print(f"⚠️  [email_service] .env file not found at {env_path}, trying current directory")
    load_dotenv(override=True)
    
# Debug: Show all loaded email-related env vars (TO_EMAIL comes from form, not .env)
print(f"🔍 [email_service] Environment variables after loading:")
for key in ["FROM_EMAIL", "EMAIL_PASSWORD", "SMTP_SERVER", "SMTP_PORT"]:
    value = os.getenv(key)
    if value:
        if "PASSWORD" in key:
            masked = "***" + value[-4:] if len(value) > 4 else "***"
            print(f"   {key} = {masked}")
        else:
            print(f"   {key} = {value[:30]}..." if len(value) > 30 else f"   {key} = {value}")
    else:
        print(f"   {key} = ❌ NOT FOUND")
print(f"   Note: TO_EMAIL will come from form input (requester's email)")


def send_mail(
    to_emails,
    subject,
    message,
    password,
    from_email,
    html_content=None,
    smtp_server=None,
    smtp_port=None
):
    """
    Send email using SMTP
    
    Args:
        to_emails: Email address(es) to send to (str or list)
        subject: Email subject
        message: Plain text message
        password: SMTP password
        from_email: Sender email address
        html_content: Optional HTML content
        smtp_server: SMTP server address (defaults to env var or smtp.gmail.com)
        smtp_port: SMTP server port (defaults to env var or 587)
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Get SMTP settings from environment if not provided
    if smtp_server is None:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    if smtp_port is None:
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
    
    # Ensure to_emails is a list
    if isinstance(to_emails, str):
        to_emails = [to_emails]

    try:
        # Create email message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = ', '.join(to_emails)  # Use the to_emails parameter (user's email for OTP, fixed email for demo requests)

        # Add plain text version
        text_part = MIMEText(message, 'plain')
        msg.attach(text_part)

        # Add HTML version if provided
        if html_content:
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

        # Connect to SMTP server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Secure the connection
        server.login(from_email, password)
        server.send_message(msg)
        server.quit()

        print('✅ Successfully sent the email.')
        return True
    except smtplib.SMTPException as e:
        print(f"❌ Error sending email: {e}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error sending email: {e}")
        return False


def get_email_template():
    """
    Get the HTML email template for demo requests
    """
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PRISM Demo Request</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f5f5f5;
            color: #111827;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 650px;
            margin: 30px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(90deg, #0b63d6, #5aa0ff);
            color: #ffffff;
            padding: 18px 28px;
            font-size: 20px;
            font-weight: 700;
        }
        .content {
            padding: 24px 28px;
        }
        .content p {
            margin: 0 0 14px;
            font-size: 14px;
            line-height: 1.6;
            color: #111827;
        }
        .details-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin: 20px 0;
            overflow: hidden;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        tr {
            border-bottom: 1px solid #e5e7eb;
        }
        tr:last-child {
            border-bottom: none;
        }
        tr {
            background-color: #ffffff;
        }
        td {
            padding: 12px 16px;
            vertical-align: top;
            font-size: 14px;
        }
        td.label {
            font-weight: 700;
            color: #111827;
            width: 200px;
        }
        td.value {
            color: #374151;
        }
        a {
            color: #0b63d6;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .footer {
            margin-top: 20px;
            padding: 16px 28px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            background-color: #f9fafb;
        }
        strong {
            font-weight: 700;
            color: #111827;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">PRISM — Demo Request</div>
        <div class="content">
            <p>Hi Team,</p>
            <p>We've received a new demo request for the <strong>Prism Platform</strong>. Please review the requester details below and prepare the demo accordingly.</p>
            
            <div class="details-box">
                <table>
                    <tr>
                        <td class="label">Name</td>
                        <td class="value">${name}</td>
                    </tr>
                    <tr>
                        <td class="label">Email</td>
                        <td class="value"><a href="mailto:${email}">${email}</a></td>
                    </tr>
                    <tr>
                        <td class="label">Phone</td>
                        <td class="value">${phone}</td>
                    </tr>
                    <tr>
                        <td class="label">Company / Organization</td>
                        <td class="value">${companyName}</td>
                    </tr>
                    <tr>
                        <td class="label">Position</td>
                        <td class="value">${position}</td>
                    </tr>
                    <tr>
                        <td class="label">Preferred Date & Time</td>
                        <td class="value">${date}, ${time}</td>
                    </tr>
                    <tr>
                        <td class="label">Additional Notes</td>
                        <td class="value">${comments}</td>
                    </tr>
                </table>
            </div>
            <p>Kindly evaluate the request and prepare the demo. Please confirm scheduling in reply to this thread and advise if any additional information is required.</p>
            
            <p>Best regards,<br>
            <strong>PRISM</strong><br>
            APEXNEURAL</p>
        </div>
        
        <div class="footer">
            This message was sent to the PRISM team. If you need help, contact <a href="mailto:support@apexneural.cloud">support@apexneural.cloud</a>.
        </div>
    </div>
</body>
</html>"""


def send_demo_request_email(
    name: str,
    email: str,
    phone: str,
    company_name: str,
    position: str,
    date: str,
    time: str,
    comments: str = ""
):
    """
    Send demo request email notification
    
    Args:
        name: Requester's name
        email: Requester's email
        phone: Requester's phone number
        company_name: Company/Organization name
        position: Requester's position
        date: Preferred date
        time: Preferred time
        comments: Additional comments/notes
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    # Get email credentials from environment variables (FROM_EMAIL and EMAIL_PASSWORD only)
    # TO_EMAIL comes from the form input (requester's email)
    print(f"\n🔍 [send_demo_request_email] Starting email send process...")
    print(f"🔍 [send_demo_request_email] Current working directory: {os.getcwd()}")
    
    # Try both standard uppercase and the user's mixed case variant
    from_email = os.getenv("FROM_EMAIL") or os.getenv("FROM_email")
    password = os.getenv("EMAIL_PASSWORD")
    # Demo request emails go to fixed recipient (akshaay.kg@apexneural.com)
    # The requester's email is included in the email body, not as recipient
    to_email = os.getenv("TO_EMAIL", "akshaay.kg@apexneural.com")  # Fixed recipient for demo requests
    
    # Detailed debug logging
    print(f"\n🔍 [send_demo_request_email] Checking credentials:")
    print(f"   FROM_EMAIL (from .env): {repr(from_email)}")
    print(f"   EMAIL_PASSWORD (from .env): {'✅ Found (length: ' + str(len(password)) + ')' if password else '❌ MISSING (None or empty)'}")
    print(f"   TO_EMAIL (fixed recipient for demo requests): {repr(to_email)}")
    print(f"   Requester's email (included in body): {repr(email)}")
    
    # Show all environment variables
    print(f"\n🔍 [send_demo_request_email] All environment variables:")
    print(f"   Total env vars: {len(os.environ)}")
    email_related = {k: v for k, v in os.environ.items() if 'EMAIL' in k.upper() or 'FROM' in k.upper() or 'SMTP' in k.upper()}
    if email_related:
        print(f"   Found {len(email_related)} email-related variables:")
        for key, value in sorted(email_related.items()):
            if "PASSWORD" in key:
                masked = "***" + value[-4:] if len(value) > 4 else "***"
                print(f"      {key} = {masked} (length: {len(value)})")
            else:
                print(f"      {key} = {value}")
    else:
        print("   ❌ No email-related environment variables found!")
        print("   Showing first 10 env vars for debugging:")
        for i, (key, value) in enumerate(list(os.environ.items())[:10]):
            print(f"      {key} = {value[:50]}...")
    
    if not from_email or not password:
        print(f"\n❌ [send_demo_request_email] Email credentials from .env not found!")
        print(f"   FROM_EMAIL is missing: {not from_email} (value: {repr(from_email)})")
        print(f"   EMAIL_PASSWORD is missing: {not password} (value: {repr(password)})")
        return False
    
    if not to_email:
        print(f"\n❌ [send_demo_request_email] TO_EMAIL (recipient email) is missing!")
        return False
    
    print(f"✅ [send_demo_request_email] All credentials found, proceeding to send email...")
    
    # Get email template
    html_template = get_email_template()
    
    # Replace placeholders in template using Template to avoid CSS brace conflicts
    html_content = Template(html_template).substitute(
        name=name,
        email=email,
        phone=phone,
        companyName=company_name,
        position=position,
        date=date,
        time=time,
        comments=comments if comments else "N/A"
    )
    
    # Create plain text version
    plain_text = f"""
PRISM — Demo Request

Hi Team,

We've received a new demo request for the Prism Platform. Please review the requester details below and prepare the demo accordingly.

Name: {name}
Email: {email}
Phone: {phone}
Company / Organization: {company_name}
Position: {position}
Preferred Date & Time: {date}, {time}
Additional Notes: {comments if comments else "N/A"}

Kindly evaluate the request and prepare the demo. Please confirm scheduling in reply to this thread and advise if any additional information is required.

Best regards,
PRISM
APEXNEURAL
"""
    
    # Send email
    subject = "Request for Prism Platform Demo"
    
    return send_mail(
        to_emails=to_email,
        subject=subject,
        message=plain_text,
        password=password,
        from_email=from_email,
        html_content=html_content
    )



async def send_otp_email(email: str, otp: str, purpose: str = "signup"):
    """
    Send OTP email for authentication
    
    Args:
        email: Recipient email address
        otp: 6-digit OTP code
        purpose: Either "signup" or "reset" for password reset
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    print(f"\n🔍 [send_otp_email] Starting OTP email send...")
    print(f"🔍 [send_otp_email] Recipient email (from form): {repr(email)}")
    print(f"🔍 [send_otp_email] Purpose: {purpose}")
    
    # Get credentials from environment
    from_email = os.getenv("FROM_EMAIL")
    password = os.getenv("EMAIL_PASSWORD")
    
    print(f"🔍 [send_otp_email] FROM_EMAIL: {from_email}")
    print(f"🔍 [send_otp_email] PASSWORD: {'SET' if password else 'NOT SET'}")
    
    if not from_email or not password:
        print(f"❌ [send_otp_email] Email credentials not found!")
        return False
    
    # Verify recipient email is provided (from user's form input)
    if not email:
        print(f"❌ [send_otp_email] Recipient email is missing!")
        return False
    
    print(f"✅ [send_otp_email] Sending OTP to user's email: {email}")
    
    subject = "Verify Your Email - PRISM" if purpose == "signup" else "Reset Your Password - PRISM"
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{{{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background-color: #f5f5f5;
            margin: 0;
            padding: 20px;
        }}}}
        .container {{{{
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }}}}
        .header {{{{
            background: linear-gradient(90deg, #0b63d6, #5aa0ff);
            color: #ffffff;
            padding: 20px;
            text-align: center;
        }}}}
        .content {{{{
            padding: 30px;
        }}}}
        .otp-box {{{{
            background-color: #f0f7ff;
            border: 2px dashed #0b63d6;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }}}}
        .otp-code {{{{
            font-size: 32px;
            font-weight: bold;
            color: #0b63d6;
            letter-spacing: 8px;
            margin: 10px 0;
        }}}}
        .footer {{{{
            background-color: #f9fafb;
            padding: 15px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }}}}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PRISM Authentication</h1>
        </div>
        <div class="content">
            <h2>Your OTP Code</h2>
            <p>Hello,</p>
            <p>You requested to {{'verify your email' if purpose == 'signup' else 'reset your password'}}. Please use the following OTP code:</p>
            
            <div class="otp-box">
                <p style="margin: 0; color: #374151;">Your OTP Code</p>
                <div class="otp-code">{otp}</div>
                <p style="margin: 0; color: #6b7280; font-size: 14px;">Valid for 10 minutes</p>
            </div>
            
            <p>If you didn't request this code, please ignore this email.</p>
            <p style="color: #dc2626; font-size: 14px;">⚠️ Never share this code with anyone.</p>
        </div>
        <div class="footer">
            © 2024 PRISM - APEXNEURAL
        </div>
    </div>
</body>
</html>
"""
    
    plain_text = f"""
PRISM Authentication

Your OTP Code: {otp}

This code is valid for 10 minutes.

If you didn't request this code, please ignore this email.
"""
    
    # OTP emails go to the user's email address from the form (user_data.email)
    # This is different from demo requests which go to a fixed recipient
    print(f"✅ [send_otp_email] Final confirmation - Sending to user's email: {email}")
    
    return send_mail(
        to_emails=email,  # User's email from form (user_data.email or email from forgot-password form)
        subject=subject,
        message=plain_text,
        password=password,
        from_email=from_email,
        html_content=html_content
    )


def send_email_with_attachment(to_email: str, subject: str, html_content: str, attachment_path: str = None, attachment_name: str = None):
    """Send email with single attachment"""
    from email.mime.base import MIMEBase
    from email import encoders
    
    from_email = os.getenv("FROM_EMAIL") or os.getenv("FROM_email")
    password = os.getenv("EMAIL_PASSWORD")
    
    if not from_email or not password:
        print(f"❌ Email credentials not found")
        return False
    
    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    
    msg.attach(MIMEText(html_content, "html"))
    
    if attachment_path and os.path.exists(attachment_path):
        with open(attachment_path, "rb") as attachment:
            part = MIMEBase("application", "octet-stream")
            part.set_payload(attachment.read())
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f"attachment; filename= {attachment_name or os.path.basename(attachment_path)}"
            )
            msg.attach(part)
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(from_email, password)
            server.sendmail(from_email, to_email, msg.as_string())
        print(f"✅ Email with attachment sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email with attachment: {e}")
        return False


def send_email_with_attachments(to_email: str, subject: str, html_content: str, attachments: list):
    """Send email with multiple attachments"""
    from email.mime.base import MIMEBase
    from email import encoders
    
    from_email = os.getenv("FROM_EMAIL") or os.getenv("FROM_email")
    password = os.getenv("EMAIL_PASSWORD")
    
    if not from_email or not password:
        print(f"❌ Email credentials not found")
        return False
    
    msg = MIMEMultipart()
    msg["From"] = from_email
    msg["To"] = to_email
    msg["Subject"] = subject
    
    msg.attach(MIMEText(html_content, "html"))
    
    for attachment_path, attachment_name in attachments:
        if attachment_path and os.path.exists(attachment_path):
            with open(attachment_path, "rb") as attachment:
                part = MIMEBase("application", "octet-stream")
                part.set_payload(attachment.read())
                encoders.encode_base64(part)
                part.add_header(
                    "Content-Disposition",
                    f"attachment; filename= {attachment_name}"
                )
                msg.attach(part)
    
    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.starttls()
            server.login(from_email, password)
            server.sendmail(from_email, to_email, msg.as_string())
        print(f"✅ Email with attachments sent to {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error sending email with attachments: {e}")
        return False


async def send_interview_confirmation_emails(
    applicant_email: str,
    applicant_name: str,
    interviewer_emails: list,
    interview_date: str,
    interview_time: str,
    meeting_link: str,
    round_name: str,
    org_name: str,
    job_id: str,
    location_type: str = "online",
    location: str = None,
    feedback_form_link: str = None,
    jd_file_path: str = None,
    resume_file_path: str = None
) -> bool:
    """
    Send interview confirmation emails to applicant and interviewers
    """
    try:
        # Build conditional HTML parts
        meeting_link_html = ""
        location_html = ""
        join_button_html = ""
        instruction_text = "arrive at the location"
        
        if location_type == "online":
            meeting_link_html = f'<p><strong>Location:</strong> Online</p><p><strong>Meeting Link:</strong> <a href="{meeting_link}">{meeting_link}</a></p>'
            join_button_html = f'<div style="text-align: center;"><a href="{meeting_link}" class="button">Join Meeting</a></div>'
            instruction_text = "join the meeting"
        elif location_type == "offline":
            location_html = f'<p><strong>Location:</strong> Offline</p>'
            if location:
                location_html += f'<p><strong>Interview Address:</strong> {location}</p>'
            # For offline interviews, still include meeting link and feedback form
            if meeting_link:
                meeting_link_html = f'<p><strong>Meeting Link (Backup/Virtual Option):</strong> <a href="{meeting_link}">{meeting_link}</a></p>'
                join_button_html = f'<div style="text-align: center;"><a href="{meeting_link}" class="button">Join Meeting (Backup)</a></div>'
            instruction_text = "arrive at the location"
        
        # Send email to applicant
        applicant_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(90deg, #0b63d6, #5aa0ff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #0b63d6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Interview Scheduled</h2>
                </div>
                <div class="content">
                    <p>Dear {applicant_name},</p>
                    <p>Your interview for <strong>{round_name}</strong> at <strong>{org_name}</strong> has been scheduled.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Date:</strong> {interview_date}</p>
                        <p><strong>Time:</strong> {interview_time}</p>
                        {location_html}
                        {meeting_link_html}
                    </div>
                    {join_button_html}
                    <p>Please {instruction_text} on time. The job description is attached for your reference.</p>
                    <p>Best regards,<br><strong>{org_name} Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        send_email_with_attachment(
            to_email=applicant_email,
            subject=f"Interview Scheduled - {round_name} at {org_name}",
            html_content=applicant_html,
            attachment_path=jd_file_path,
            attachment_name="Job_Description.pdf"
        )
        
        # Build conditional HTML for interviewer email
        interviewer_meeting_link_html = ""
        interviewer_location_html = ""
        feedback_form_section = ""
        
        if location_type == "online" and meeting_link:
            interviewer_meeting_link_html = f'<p><strong>Location:</strong> Online</p><p><strong>Meeting Link:</strong> <a href="{meeting_link}">{meeting_link}</a></p>'
        elif location_type == "offline":
            interviewer_location_html = f'<p><strong>Location:</strong> Offline</p>'
            if location:
                interviewer_location_html += f'<p><strong>Interview Address:</strong> {location}</p>'
            # For offline interviews, still include meeting link
            if meeting_link:
                interviewer_meeting_link_html = f'<p><strong>Meeting Link (Backup/Virtual Option):</strong> <a href="{meeting_link}">{meeting_link}</a></p>'
        
        if feedback_form_link:
            feedback_form_section = f"""
                    <div style="background: #e0f2fe; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #0b63d6;">
                        <p style="margin: 0 0 10px 0;"><strong>📝 Interview Feedback Required</strong></p>
                        <p style="margin: 5px 0;">After conducting the interview, please fill out the feedback form:</p>
                        <div style="text-align: center; margin: 15px 0;">
                            <a href="{feedback_form_link}" style="display: inline-block; padding: 12px 30px; background: #0b63d6; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Fill Feedback Form</a>
                        </div>
                        <p style="margin: 5px 0; font-size: 12px; color: #666;">Note: This form can only be submitted once. Please ensure all information is accurate before submitting.</p>
                    </div>
            """
        
        # Send email to interviewers
        interviewer_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(90deg, #0b63d6, #5aa0ff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Interview Scheduled</h2>
                </div>
                <div class="content">
                    <p>Hello,</p>
                    <p>An interview has been scheduled for your review.</p>
                    <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Candidate:</strong> {applicant_name}</p>
                        <p><strong>Round:</strong> {round_name}</p>
                        <p><strong>Date:</strong> {interview_date}</p>
                        <p><strong>Time:</strong> {interview_time}</p>
                        {interviewer_location_html}
                        {interviewer_meeting_link_html}
                    </div>
                    {feedback_form_section}
                    <p>The candidate's resume and job description are attached for your review.</p>
                    <p>Best regards,<br><strong>{org_name} Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Send to each interviewer
        attachments = []
        if jd_file_path:
            attachments.append((jd_file_path, "Job_Description.pdf"))
        if resume_file_path:
            attachments.append((resume_file_path, f"{applicant_name}_Resume.pdf"))
        
        for interviewer_email in interviewer_emails:
            send_email_with_attachments(
                to_email=interviewer_email,
                subject=f"Interview Scheduled - {applicant_name} - {round_name}",
                html_content=interviewer_html,
                attachments=attachments
            )
        
        return True
        
    except Exception as e:
        print(f"❌ Error sending interview confirmation emails: {e}")
        import traceback
        traceback.print_exc()
        return False


async def send_no_slots_notification_email(
    org_email: str,
    org_name: str,
    team_name: str
) -> bool:
    """
    Send email to organization when no interview slots are available
    """
    try:
        from_email = os.getenv("FROM_EMAIL") or os.getenv("FROM_email")
        password = os.getenv("EMAIL_PASSWORD")
        
        if not from_email or not password:
            print(f"❌ Email credentials not found")
            return False
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(90deg, #dc2626, #ef4444); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .alert-box {{ background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>⚠️ No Interview Slots Available</h2>
                </div>
                <div class="content">
                    <p>Dear {org_name} Team,</p>
                    <div class="alert-box">
                        <p><strong>Alert:</strong> All team members in <strong>{team_name}</strong> are currently busy for the next 5 working days.</p>
                        <p>No interview slots are available for scheduling.</p>
                    </div>
                    <p><strong>Recommendation:</strong></p>
                    <ul>
                        <li>Add more team members to {team_name} to increase availability</li>
                        <li>Or wait for some time and try scheduling again</li>
                        <li>Or manually coordinate with applicants for alternative arrangements</li>
                    </ul>
                    <p>This notification is sent automatically when the system detects no available slots.</p>
                    <p>Best regards,<br><strong>PRISM System</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text = f"""
No Interview Slots Available

Dear {org_name} Team,

Alert: All team members in {team_name} are currently busy for the next 5 working days.
No interview slots are available for scheduling.

Recommendation:
- Add more team members to {team_name} to increase availability
- Or wait for some time and try scheduling again
- Or manually coordinate with applicants for alternative arrangements

This notification is sent automatically when the system detects no available slots.

Best regards,
PRISM System
"""
        
        subject = f"⚠️ No Interview Slots Available - {team_name}"
        
        return send_mail(
            to_emails=org_email,
            subject=subject,
            message=plain_text,
            password=password,
            from_email=from_email,
            html_content=html_body
        )
        
    except Exception as e:
        print(f"❌ Error sending no slots notification email: {e}")
        return False


async def send_interview_form_email(
    applicant_email: str,
    applicant_name: str,
    form_link: str,
    round_name: str,
    org_name: str
) -> bool:
    """
    Send interview scheduling form email to applicant
    
    Args:
        applicant_email: Applicant's email address
        applicant_name: Applicant's name
        form_link: Link to the scheduling form
        round_name: Name of the interview round
        org_name: Organization name
        
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        from_email = os.getenv("FROM_EMAIL") or os.getenv("FROM_email")
        password = os.getenv("EMAIL_PASSWORD")
        
        if not from_email or not password:
            print(f"❌ Email credentials not found")
            return False
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(90deg, #0b63d6, #5aa0ff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #0b63d6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Interview Scheduling</h2>
                </div>
                <div class="content">
                    <p>Dear {applicant_name},</p>
                    <p>Congratulations! You have been selected for the <strong>{round_name}</strong> at <strong>{org_name}</strong>.</p>
                    <p>Please click the button below to schedule your interview by selecting a convenient date and time slot:</p>
                    <div style="text-align: center;">
                        <a href="{form_link}" class="button">Schedule Interview</a>
                    </div>
                    <p>If the button doesn't work, copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #0b63d6;">{form_link}</p>
                    <p>Best regards,<br><strong>{org_name} Team</strong></p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text = f"""
Interview Scheduling

Dear {applicant_name},

Congratulations! You have been selected for the {round_name} at {org_name}.

Please click the link below to schedule your interview by selecting a convenient date and time slot:

{form_link}

Best regards,
{org_name} Team
"""
        
        subject = f"Schedule Your {round_name} Interview - {org_name}"
        
        return send_mail(
            to_emails=applicant_email,
            subject=subject,
            message=plain_text,
            password=password,
            from_email=from_email,
            html_content=html_body
        )
        
    except Exception as e:
        print(f"❌ Error sending interview form email: {e}")
        return False


async def send_interview_feedback_form_email(
    interviewer_email: str,
    interviewer_name: str,
    applicant_name: str,
    applicant_email: str,
    round_name: str,
    interview_date: str,
    interview_time: str,
    feedback_form_link: str,
    job_id: str,
    location_type: str = "online",
    location: str = None,
    meeting_link: str = None,
    resume_file_path: str = None,
    jd_file_path: str = None
) -> bool:
    """
    Send interview feedback form link to interviewer with resume and JD
    """
    try:
        # Build conditional HTML parts for feedback email
        feedback_meeting_link_html = ""
        feedback_location_html = ""
        
        if location_type == "online" and meeting_link:
            feedback_meeting_link_html = f'<p style="margin: 5px 0;">Meeting Link: <a href="{meeting_link}">{meeting_link}</a></p>'
        elif location_type == "offline" and location:
            feedback_location_html = f'<p style="margin: 5px 0;">Interview Location: {location}</p>'
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(90deg, #0b63d6, #5aa0ff); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }}
                .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
                .button {{ display: inline-block; padding: 12px 30px; background: #0b63d6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .details-box {{ background: white; padding: 15px; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Interview Feedback Required</h2>
                </div>
                <div class="content">
                    <p>Dear {interviewer_name},</p>
                    <p>You recently conducted an interview with <strong>{applicant_name}</strong> ({applicant_email}) for the <strong>{round_name}</strong>.</p>
                    <div class="details-box">
                        <p style="margin: 5px 0;"><strong>Interview Details:</strong></p>
                        <p style="margin: 5px 0;">Date: {interview_date}</p>
                        <p style="margin: 5px 0;">Time: {interview_time}</p>
                        <p style="margin: 5px 0;">Round: {round_name}</p>
                        <p style="margin: 5px 0;">Location Type: {location_type.capitalize()}</p>
                        {feedback_meeting_link_html}
                        {feedback_location_html}
                    </div>
                    <p>Please fill out the feedback form to complete the interview process:</p>
                    <div style="text-align: center;">
                        <a href="{feedback_form_link}" class="button">Fill Feedback Form</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Note: This form can only be submitted once. Please ensure all information is accurate before submitting.</p>
                    <p>The candidate's resume and job description are attached for your reference.</p>
                    <p>Best regards,<br><strong>PRISM System</strong></p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_text = f"""
Interview Feedback Required

Dear {interviewer_name},

You recently conducted an interview with {applicant_name} ({applicant_email}) for the {round_name}.

Interview Details:
Date: {interview_date}
Time: {interview_time}
Round: {round_name}

Please fill out the feedback form to complete the interview process:
{feedback_form_link}

Note: This form can only be submitted once. Please ensure all information is accurate before submitting.

The candidate's resume and job description are attached for your reference.

Best regards,
PRISM System
"""
        
        subject = f"Interview Feedback Form - {round_name} - {applicant_name}"
        
        # Prepare attachments
        attachments = []
        if jd_file_path and os.path.exists(jd_file_path):
            attachments.append((jd_file_path, f"Job_Description_{job_id}.pdf"))
        if resume_file_path and os.path.exists(resume_file_path):
            attachments.append((resume_file_path, f"Resume_{applicant_name.replace(' ', '_')}.pdf"))
        
        if attachments:
            send_email_with_attachments(
                to_email=interviewer_email,
                subject=subject,
                html_content=html_body,
                attachments=attachments
            )
        else:
            send_email_with_attachment(
                to_email=interviewer_email,
                subject=subject,
                html_content=html_body,
                attachment_path=None,
                attachment_name=None
            )
        
        print(f"✅ Feedback form email sent to {interviewer_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending feedback form email: {e}")
        import traceback
        traceback.print_exc()
        return False