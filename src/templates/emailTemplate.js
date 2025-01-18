const EmailTemplate = (otp, purpose = "Xác nhận tài khoản") => {
    const purposeMessage = {
        "register": "Cảm ơn bạn đã đăng ký tài khoản. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã OTP dưới đây:",
        "resetPassword": "Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã OTP dưới đây để tiếp tục:",
        "verifyEmail": "Bạn cần xác nhận địa chỉ email này. Vui lòng sử dụng mã OTP dưới đây:",
    };

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${purpose}</title>
        <style>
            body {
                background-color: #f6f6f6;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #f0f0f0;
            }
            .logo-text {
                font-size: 32px;
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
            }
            .logo-text span {
                color: #ff6b6b; /* Màu chữ cho "Hub" */
            }
            .content {
                padding: 30px 20px;
                text-align: center;
            }
            .otp-container {
                background-color: #f8f9fa;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
            }
            .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #007bff;
                letter-spacing: 5px;
                margin: 10px 0;
            }
            .message {
                color: #666666;
                line-height: 1.6;
                margin-bottom: 20px;
            }
            .note {
                font-size: 14px;
                color: #999999;
                margin-top: 20px;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 2px solid #f0f0f0;
                color: #999999;
                font-size: 12px;
            }
            .social-links {
                margin: 20px 0;
            }
            .social-links a {
                margin: 0 10px;
                text-decoration: none;
            }
            .button {
                background-color: #007bff;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                display: inline-block;
                margin: 20px 0;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo-text">
                    Sugoi<span>Hub</span>
                </div>
                <h1 style="color: #333;">${purpose}</h1>
            </div>
            
            <div class="content">
                <h2 style="color: #444;">Xin chào!</h2>
                <p class="message">
                    ${purposeMessage[purpose] || purposeMessage["register"]}
                </p>
                
                <div class="otp-container">
                    <p>Mã OTP của bạn là:</p>
                    <div class="otp-code">${otp}</div>
                    <p style="color: #dc3545;">Mã này sẽ hết hạn sau 5 phút</p>
                </div>

                <p class="message">
                    Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.
                </p>

                <p class="note">
                    Email này được gửi tự động, vui lòng không trả lời email này.
                </p>
            </div>

            <div class="footer">
                <p>© 2024 SugoiHub. All rights reserved.</p>
                <p>Địa chỉ công ty của bạn</p>
                <p>
                    <a href="#" style="color: #666;">Privacy Policy</a> | 
                    <a href="#" style="color: #666;">Terms of Service</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
};

export default EmailTemplate;