const { onRequest } = require("firebase-functions");
// const {logger} = require("firebase-functions/lib/logger");

const functions = require("firebase-functions");
const { google } = require("googleapis");
const admin = require("firebase-admin");
const { Storage } = require("@google-cloud/storage");
const cron = require('node-cron');
var credentials = {
  "type": "service_account",
  "project_id": "magia-1c8e4",
  "private_key_id": "bb1f0388414c519d535894a09e04680cbd55a151",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzdCccTvmMY3Ms\n3GsJDXcybeXuXSEex13nHDIgKcytLc5ktJTGo91dnvyYagcxAnY0rkB5Quy+AMBk\nKTJfcpoc1YTyhBTpyAA7KdPT6Nm8r5p5/0a2b0L+3k1tOuO9xqtHrkPiSVOv7JQV\ncABDyjj+skURy3pWJ8gl6hCLSI87Ugc10jE9GO1ePBIOveRGD/YKPtpQ9xVMUsK8\n0nZQUO3ptOJsUH4+XvZcgfNhDDXryX1+EbBHDvc4Xm9peGbQmj+tXUHLSuyQnshY\n+p9jjjBNVTlKbf8o8BtQGZiK0IVuqTnTBuVOoPiwnMp8Ykao/TgFL1sNZtzYS4N0\nAwz5r5mPAgMBAAECggEABvcPfDd1029vYqKyJil3TTtwvN4GfBBW4l0jdkDJE0D/\njW8ThduJqv7nD5oF6hljXHYVmzSaxbZ3wSt21gziUxOCfnsxPfBST07h9uFHGjNi\noTDkSLkWy5eglQhqcHeL4aivin04GfrqYHlMDqrZqCEOhztI5fEoq+K4KP/Jog64\njCFqsXmoX4sOj2Uiqh7Or9Z4Sly2LXDp0qIBcAcVu30Kf6rEKt82NHGuc+zF5Qar\n1JNx0DDpAsSxAAl3NEcdn1fq4xsBgWMgE9Bwta4COjXo+up7AV5O83wEeZKro4wD\nTWxVXvny4FbOOsdmreFKjV7rqBbCnD0qdu9y+nE2EQKBgQDz0Ec3XXLq1kJ/pTce\n9XW4ZPi8yVPGC7H0FPegIvS/QJ6rMc1dn17IUOeHyoysaBUI7OTCX6HF9BuYDFtn\nnZcFlkP7UaDazY5dQfkC+BZinRlgzfq4DCmWGfcyHJy49eEm3GTfjBqOKu0Td2x0\n3XCvTkuVh47gH8YWo4a/tNzVeQKBgQC8bFtKGKTIrN4E5b/cxbPSxA36SdfstV0m\nMWH97W7tBIazjQuukBnekpv5TE1eU1+PtzDIGWgKFQXXhna+0GsQ6jmgE/WfqU2p\noNV6H09r+fUCCQjXAyWyFcxBKsHq6TNF6Vnqlr9CmvzIeOdQgkA8w31QrScfRlCe\nJwNOHlNNRwKBgQDDMZgSZyo9gFO0xZyfmHwqqAvLeJMtFufdNXwaJGI1S5K8FB8K\nOTE0xjDWsf51eM5+Wsm6I73sMUZ2ME5tYekqe+bpKazR/4deehbVnbCuOn+61K1I\n89PHa/pPkECYg6FB72iC4DPSZeNvlkiqNy6j6tbwW5qzLDz2muyiRjYWYQKBgEI3\nNhGg/W/ESDWiY717AMnFuj/F6Yq25ahBXHV3Fi9XEttQatWKsHymOwfuB5ZpaEDC\nGPOI8iXw41+tUleWOLn2BhA6U2wrfC5rZfoHvMpuSerQL/oXkgy2WlRgaUtbbnhY\nHBAzr70BaGovCuMhEuAHtyc94my8MiKSBThTseSLAoGAZoj8kj/YtOO4Ft3pYdly\ncQoJynLSpZaiYLoyrVkQwBy5XY8wEZyBo79TPIJo+PMKj0MMuiJckkfQK1tVC2nv\nUEfw3GTYfC0GJXBX2mYIz1ke0sfUbCaQOfI/o0LQ5LKVZLyxnB2HOoyqpFQAP2U0\nGOsLN8c/qjptTm8EZD15h/k=\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-fe1mr@magia-1c8e4.iam.gserviceaccount.com",
  "client_id": "109467575512360022174",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fe1mr%40magia-1c8e4.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
}

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(credentials),
  storageBucket: "gs://magia-1c8e4.appspot.com",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

// Constants
const clientId = functions.config().client.id;
const clientSecret = functions.config().client.secret;
const redirectUrl = functions.config().redirect.url;
const refreshToken = functions.config().redirect.token;

const fetchAndProcessEmails = async () => {
  const authClient = new google.auth.OAuth2(clientId, clientSecret, redirectUrl);
    authClient.setCredentials({ refresh_token: refreshToken });
  
    const gmail = google.gmail({ version: 'v1', auth: authClient });
  
    try {
      const res = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 10,
        q: 'is:unread', // Fetch only unread messages. Modify the query as per your requirements.
      });
  
      const messages = res.data.messages;
  
      if (messages && messages.length > 0) {
        const message = messages[0];
        const messageData = await gmail.users.messages.get({ userId: 'me', id: message.id });
        const email = messageData.data;
        const headers = email.payload.headers;
        const senderHeader = headers.find(header => header.name === 'From');
        
  
        // Get Sender's Email and Body 
        const body = email.snippet;
        const senderEmail = senderHeader.value.match(/<([^>]+)>/)[1]; 
        const subject = headers.find(header => header.name === 'Subject').value;
  
         // start uploading attachment
         const attachments = email.payload.parts.filter(part => part.mimeType === 'application/pdf');
         const attachmentUrls = [];
         for (const attachment of attachments) {
          
           const attachmentData = await gmail.users.messages.attachments.get({
             userId: 'me',
             messageId: email.id,
             id: attachment.body.attachmentId,
           });
   
           const data = attachmentData.data.data;
           const decodedData = Buffer.from(data, 'base64');
   
           const fileName =   `pdfs/${Date.now() + 7 * 24 * 60 * 60 * 1000}-${attachment.filename}`;
   
           // Upload the PDF to Firebase Storage
           const file = bucket.file(fileName);
           await file.save(decodedData, { contentType: 'application/pdf'});

          attachmentUrls.push(fileName);
   
         }

          // save data into firestore
          const obj = {
            email: senderEmail,
            body: body,
            attachments: attachmentUrls,
            subject: subject
          }
      
          // Save data in firestore database
          const response = db.collection("email_contents").doc().set(obj); 
  
         // Mark the email as read
         await gmail.users.messages.modify({
          userId: 'me',
          id: message.id,
          requestBody: {
            removeLabelIds: ['UNREAD'],
          },
        });
  
      } else {
        console.log('No unread messages found.');
      }
    } catch (error) {
      console.error('Error fetching emails:', error);
    }
}

cron.schedule('*/30 * * * * *', () => {
  fetchAndProcessEmails();
});

exports.scheduler = functions.https.onRequest((request, response) => {
  response.send('Scheduler is running.');
});