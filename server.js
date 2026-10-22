const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require("path");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer"); 
const User = require('./models/User'); 
const Item = require('./models/Items');
const connectDB = require('./config/mongo');
const { isloggedIn } = require("./middleware/middleware.js");
const bcrypt = require('bcrypt');
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN || "mysecretkey"; 
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser()); 
app.set('view engine', 'ejs');

const setToken = (user) => {
    return jwt.sign({ username: user.username, gmail: user.gmail }, JWT_SECRET_TOKEN, { expiresIn: '1d' });
};

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.PASSWORD 
    }
});

app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET_TOKEN);
      res.locals.user = decoded; 
    } catch (err) {
      res.locals.user = null;
    }
  } else {
    res.locals.user = null;
  }
  next();
});
app.get("/", async (req, res) => {
  try {
   
    const items = await Item.find({}).limit(5);

    res.render("index.ejs", { items });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});







app.get("/products", async (req, res) => {
  try {
    const { lastId } = req.query;
    let query = {};


    if (lastId) {
      query = { _id: { $lt: lastId } }; 
    }

    const items = await Item.find(query)
      .limit(5);

    return res.status(200).json({
      success: true,
      items
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});







app.get("/login", (req, res) => {
  res.render("login.ejs", { data: "entered" });
});

app.get("/cart", async (req, res) => {
  try {
   
    const items = await Item.find({});

    res.render("cart.ejs", { items });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});



app.get("/reset", (req, res) => {
  res.render("reset.ejs", { data: "entered" });
});

app.get("/forgot", (req, res) => {
  res.render("forgot.ejs", { data: "entered" });
});

app.get("/signup", (req, res) => {
  res.render("signup.ejs", { data: "entered" });
});

app.get("/profile", isloggedIn, (req, res) => {
  res.render("profile.ejs", { data: "entered" });
});


app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password.",
      });
    }


    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password.",
      });
    }

    const token = setToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 24 * 1000 * 60 * 60,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful!",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


app.post("/forgot", async (req, res) => {
  try {
    const { username } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Please provide username or email.",
      });
    }

    const user = await User.findOne({ $or: [{ gmail: username }, { username: username }] });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found.",
      });
    }
    
    const resetLink = `http://localhost:${port}/reset`;
    const token = setToken(user); 

    
    res.cookie("token", token, {
      httpOnly: true,
      maxAge: 15 * 60 * 1000, 
    });

    await transporter.sendMail({
      from: process.env.USER,
      to: user.gmail,
      subject: "Password Reset Link",
      html: `
        <p>You requested a password reset.</p>
        <a href="${resetLink}">Click here to reset your password</a>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset link sent to your email!",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.post("/signup", async (req, res) => {
  try {
    const { username, gmail, password } = req.body;
    
    if (!username || !gmail || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide all details.",
      });
    }


    const existingUser = await User.findOne({ $or: [{ username }, { gmail }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already present.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

  
    const verificationToken = jwt.sign(
      { username, gmail, password: hashedPassword },
      JWT_SECRET_TOKEN,
      { expiresIn: '15m' }
    );

    const verifyLink = `http://localhost:${port}/verify?token=${verificationToken}`;

    
    await transporter.sendMail({
      from: process.env.USER,
      to: gmail,
      subject: "Verify Your Email - E-commerce",
      html: `
        <h2>Welcome to our store!</h2>
        <p>Please click the link below to verify your email and complete your signup:</p>
        <a href="${verifyLink}" style="padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link expires in 15 minutes.</p>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Verification email sent! Please check your inbox.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/reset", async (req, res) => {
  try {
    const { newPassword } = req.body;
    const token = req.cookies.token; 

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Session expired or invalid request. Please try forgot password again.",
      });
    }

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide a new password.",
      });
    }

    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET_TOKEN);
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: "Token expired or invalid.",
      });
    }


    const hashedPassword = await bcrypt.hash(newPassword, 10);

  
    const updatedUser = await User.findOneAndUpdate(
      { gmail: decoded.gmail },
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found in database.",
      });
    }

   
    res.clearCookie("token");

    return res.status(200).json({
      success: true,
      message: "Password updated successfully! You can now login.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
app.get("/verify", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send("Invalid verification link.");
    }

   
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET_TOKEN);
    } catch (err) {
      return res.status(400).send("Verification link expired or invalid.");
    }

    const { username, gmail, password } = decoded;

    
    const existingUser = await User.findOne({ $or: [{ username }, { gmail }] });
    if (existingUser) {
      return res.send("User already verified and registered! You can login.");
    }

 
    const newUser = await User.create({
      username,
      gmail,
      password
    });

   
    const authToken = setToken(newUser);
    console.log(authToken);
    res.cookie("token", authToken, {
      httpOnly: true,
      maxAge: 24 * 1000 * 60 * 60,
    });

  const items = await Item.find({}); 
  return  res.render("index.ejs", { items }); 

  } catch (error) {
    console.error(error);
    res.status(500).send("Server error during verification.");
  }
});

app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("token");
    const items = await Item.find({}); 
    res.render("index.ejs", { items });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.listen(port, () => {
    console.log("Server is live on port : ", port);
});