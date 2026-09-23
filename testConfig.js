require('dotenv').config();

async function getAccessToken() {
    const tenantId = process.env.AZURE_TENANT_ID || "halalcert.com.ng";
    const clientId = process.env.AZURE_CLIENT_ID;
    const clientSecret = process.env.AZURE_CLIENT_SECRET;

    console.log("Acquiring Microsoft Graph access token...");
    console.log("Tenant:", "halalcert.com.ng");
    console.log("Client ID:", clientId);

    const tokenUrl = `https://login.microsoftonline.com/halalcert.com.ng/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');

    const res = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(`Token request failed (${res.status}): ${JSON.stringify(data)}`);
    }

    console.log("✅ Successfully acquired Microsoft Graph token!");
    return data.access_token;
}

async function sendMailGraph(toEmail) {
    try {
        const token = await getAccessToken();
        const sender = process.env.EMAIL_USER || "ict@halalcert.com.ng";

        console.log(`Sending email from ${sender} to ${toEmail} via Microsoft Graph API...`);

        const sendMailUrl = `https://graph.microsoft.com/v1.0/users/${sender}/sendMail`;

        const body = {
            message: {
                subject: "Microsoft Graph Test - Halal Certification Authority",
                body: {
                    contentType: "HTML",
                    content: "<h3>Halal Certification Authority</h3><p>Hello,</p><p>This is a live test email sent via <strong>Microsoft Graph API</strong>!</p>"
                },
                toRecipients: [
                    {
                        emailAddress: {
                            address: toEmail
                        }
                    }
                ]
            },
            saveToSentItems: "true"
        };

        const res = await fetch(sendMailUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (res.status === 202 || res.status === 200) {
            console.log("🎉 SUCCESS! Email sent successfully via Microsoft Graph API!");
        } else {
            const errData = await res.text();
            console.error(`❌ Failed to send email via Graph (${res.status}):`, errData);
        }
    } catch (err) {
        console.error("❌ Error in Graph mail test:", err.message);
    }
}

sendMailGraph("awwalsaminu9@gmail.com");
