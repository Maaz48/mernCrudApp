const express = require('express');
const app = express();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const multer = require('multer');
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const cors = require('cors');



app.use(cors());
// Connect to MongoDB Atlas
const uri = "mongodb+srv://app:maaz@cluster0.n7e5erg.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const PostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        required: true
    }
});
/////////////// SIGNUP SCHEMA //////////////
const UserSchema = new mongoose.Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },

    isVerified: {
        type: Boolean,
        default: false
    },
    accountType: {
        type: String,
    }
});

const User = mongoose.model("User", UserSchema);

const Posts = mongoose.model('posts', PostSchema);

// Use body-parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up storage for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage });

// Create post////////
app.post('/addPost', upload.single('file'), (req, res) => {
    const newItem = new Posts({
        title: req.body.title,
        description: req.body.description,
        image: req.file.path,
        userId: req.body.id
    });

    console.log(req.body)
    newItem.save()
        .then(item => res.json({ item, message: "post has been created" }))
        .catch(err => res.status(400).json({ err, message: "Unable to create post" }));
});


// Read All POST
app.get('/posts', (req, res) => {
    Posts.find()
        .then(items => res.json({ items: "asdasdasd" }))
        .catch(err => res.status(400).json(err));
});


//  verifyEmail
app.post('/verifyEmail', (req, res) => {
    User.findByIdAndUpdate({ _id: req.body.id }, { $set: { isVerified: true } })
        .then(items => res.json({ items, isFullfill: true }))
        .catch(err => res.status(400).json({ err, isFullfill: false }));
});





////////////// SIGN UP AND EMAIL VERIFY /////////////
app.post('/signup', (req, res) => {
    User.findOne({ email: req.body.email })
        .then(user => {
            if (user) {
                return res.status(400).json({ message: 'Email already exists' });
            } else {
                bcrypt.hash(req.body.password, 10, (err, hash) => {
                    if (err) {
                        return res.status(500).json({ bcryptError: "checking ERROR...........", message: err });
                    } else {
                        // Create new user
                        const newUser = new User({
                            name: req.body.name,
                            email: req.body.email,
                            password: hash,
                            accountType: req.body.accountType
                        });

                        newUser.save()
                            .then(async (user) => {
                                let transporter = nodemailer.createTransport({
                                    service: "gmail",
                                    auth: {
                                        user: PROCESS_APP_EMAIL,
                                        pass: process.env.PROCESS_APP_PASSWORD
                                    },
                                });
                                let info = await transporter.sendMail({
                                    from: PROCESS_APP_EMAIL,
                                    to: user.email,
                                    subject: "Hello ✔",
                                    text: "Hello world?",
                                    html: `
                                    <h2>Welcome to our website</h2>
                                    <p>Please click the following link to verify your email address:</p>
                                    <a href="http://localhost:3000/verify/${user._id}">Verify email</a>
                                    `
                                });

                                res.status(201).json({ info: info, message: "please verify your email" })


                            }).catch((error) => {
                                res.json({ Error: error, message: "something went wrong" })
                            })
                    }
                })
            }
        })
});




app.listen("5000", () => {
    console.log("listning")
})