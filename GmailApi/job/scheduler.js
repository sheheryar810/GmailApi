const { google } = require('googleapis');
const dotenv = require('dotenv');
var admin = require("firebase-admin");
var credentials = require("../key.json");
var cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
dotenv.config();

// Constants
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const redirectUrl = process.env.REDIRECT_URL;
const refreshToken = process.env.REFRESH_TOKEN;

// Initialize Firebase
admin.initializeApp({
    credential: admin.credential.cert(credentials),
    storageBucket: `gs://magia-1c8e4.appspot.com`,
  });
  
const db = admin.firestore();
const bucket = admin.storage().bucket();

cron.schedule('*/30 * * * * *', async () => {
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

  });
