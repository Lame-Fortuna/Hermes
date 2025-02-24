const express = require('express');
const fs = require('fs');
const nodemailer = require('nodemailer');
const path = require('path');
const multer = require('multer');

const app = express()

app.use(express.json()); // Middleware to parse JSON
app.use(express.urlencoded({
    extended: true          //To allow nested object (person:{a,b,c}, age:9 ,...)
}));


// Mailer
var transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', 
    port: 587,           
    secure: false,         
    
    auth: {
      user: 'ser.vice.autobott@gmail.com',
      pass: process.env.mailpwd
    }
});

//Mult storage directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'files/'); // Store files in the folder
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname); // Unique filename
    }
});

const upload = multer({ storage: storage });

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'home.html'))
})

app.get('/purge', (req, res)=>{
    const dirPath = path.join(__dirname, '/files')
    fs.readdirSync(dirPath).forEach(item => {
        const itemPath = path.join(dirPath, item);
        
        try {
            fs.rmSync(itemPath, { force: true });
            console.log(`Deleted ${item}`);
        } catch (err) {
            console.log(`Failed to delete ${item}: ${err}`);
        }
    });
    console.log("All files purged")
    res.redirect('/')
})

/*
app.get('/file', (req, res)={
    fs.readdir(dirPath, (err, files) => {})
})*/


app.post('/send', upload.array('file'), async (req, res) => {
    try {
        const { destination, cc, bcc, subject, content } = req.body;

        if (!destination || !content || !subject) {
            return res.status(400).send(`<h2>Must contain destination, subject, and content</h2>
                    <a href="/"><button style = "background-color: #3498db; color: white; padding: 10px 20px;border: none; border-radius: 5px; margin: 5px;">Send Again</button></a>`);
        }
        
        // Attaching the files
        let attach = [];

        if (req.files && req.files.length > 0) {
            req.files.forEach(file => {
                console.log(`File Uploaded: ${file.filename}`);
                attach.push({
                    filename: file.originalname,
                    content: fs.readFileSync(file.path) // Read file as buffer
                });
            });
        }

        // Email Message
        const message = {
            from: "ser.vice.autobott@gmail.com",
            to: destination,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject: subject,
            text: content,
            attachments: attach
        };

        // Send Email
        transporter.sendMail(message, (error, info) => {
            if (error) {
                console.error("Error sending email:", error);
                return res.status(500).send(`<h2>Error: ${error}</h2>
                    <a href="/"><button style = "background-color: #3498db; color: white; padding: 10px 20px;border: none; border-radius: 5px; margin: 5px;">Send Again</button></a>`);
            }
            console.log("Email sent successfully: " + info.response);
            res.status(200).send(`<h2>Email sent successfully!</h2>
                    <a href="/"><button style = "background-color: #3498db; color: white; padding: 10px 20px;border: none; border-radius: 5px; margin: 5px;">Send Again</button></a>`);
        });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).send(`<h2>Error: ${error}</h2>
                    <a href="/"><button style = "background-color: #3498db; color: white; padding: 10px 20px;border: none; border-radius: 5px; margin: 5px;">Send Again</button></a>`);
    }
});


app.listen(9000, () => {
    console.log("Server on localhost:9000");
});

/*
res.send(`
    <h2>With <code>"express"</code> npm package</h2>
    <form action="/api/upload" enctype="multipart/form-data" method="post">
      <div>Text field title: <input type="text" name="title" /></div>
      <div>File: <input type="file" name="someExpressFiles" multiple="multiple" /></div>
      <input type="submit" value="Upload" />
    </form>
  `);
  */