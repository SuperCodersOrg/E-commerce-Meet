const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const path = require("path");
const multer = require('multer');
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("./models/User");
const CartItemUser = require("./models/CartItems");
const Address = require("./models/Address");
const Item = require("./models/Items");
const connectDB = require("./config/mongo");
const { isloggedIn } = require("./middleware/middleware.js");
const bcrypt = require("bcrypt");
const CartItems = require("./models/CartItems");
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET_TOKEN = process.env.JWT_SECRET_TOKEN || "mysecretkey";
connectDB();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.set("view engine", "ejs");

const setToken = (user) => {
  return jwt.sign(
    { username: user.username, gmail: user.gmail },
    JWT_SECRET_TOKEN,
    { expiresIn: "1d" },
  );
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.USER,
    pass: process.env.PASSWORD,
  },
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
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,     
  key_secret: process.env.RAZORPAY_KEY_SECRET 
});
app.get("/", async (req, res) => {
  try {
    const items = await Item.find({}).limit(5);
    let mainId = JSON.stringify(items[4]._id);
    console.log(mainId);
    res.render("index.ejs", { items });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});


app.post("/create-order", async (req, res) => {
  try {
    const { amount } = req.body; 

    const options = {
      amount: amount * 100, 
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: "Could not create order" });
  }
});


app.post("/verify-payment", (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");


    if (expectedSignature === razorpay_signature) {

      console.log("Payment Verified Successfully for Order:", razorpay_order_id);
      
      return res.json({ success: true, message: "Payment verified successfully!" });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature verification" });
    }} catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
});
app.get("/products", async (req, res) => {
  try {
    console.log(req.query);
    const { lastId } = req.query;
let mainid = JSON.stringify(lastId);
console.log(mainid);
    let query = {};

    if (lastId) {
      query = { _id: { $gt: lastId } };
    }

    const items = await Item.find(query).limit(5);

    return res.status(200).json({
      success: true,
      items,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.get("/item/:id", async (req, res) => {
  try {
    const itemId = req.params.id;
    
   
    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).send("Product not found");
    }

   
    res.render("item.ejs", { item }); 
  } catch (err) {
    console.log("Error fetching product:", err);
    res.status(500).send("Server Error");
  }
});

app.get("/login", (req, res) => {
  res.render("login.ejs", { data: "entered" });
});



 
app.get("/cart", (req, res) => {
    res.render("cart.ejs", { user: res.locals.user || null });
});


app.post("/cart-items", async (req, res) => {
    try {
        const { itemIds } = req.body;
        
        if (!itemIds || itemIds.length === 0) {
            return res.json({ success: true, products: [] });
        }

    
        const products = await Item.find({ _id: { $in: itemIds } });
        res.json({ success: true, products });

    } catch (err) {
        console.log("Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

app.get("/reset", (req, res) => {
  res.render("reset.ejs", { data: "entered" });
});

app.get("/placeOrder", (req, res) => {
  res.render("order.ejs", { data: "entered" });
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
console.log(user._id);
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

    const user = await User.findOne({
      $or: [{ gmail: username }, { username: username }],
    });

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
    console.log("forgot",token);

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
      { expiresIn: "15m" },
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
        message:
          "Session expired or invalid request. Please try forgot password again.",
      });
    }
    console.log("verify",token);

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
      { new: true },
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

app.get("/Addmore",(req,res)=>{
    res.render("Addmore.ejs", { data: "entered" });
})
app.post("/Addmore", async (req,res)=>{
   const { name, description, price, category, stock ,image} = req.body;
   console.log(req.body);
   const dummyItems = req.body;
       await Item.insertMany(dummyItems);
    

       res.redirect("/");
})
app.post("/address", async (req, res) => {
  try {
    const { shipPhone,shipName ,shipAddress,shipCity,shipPincode } = req.body;
   console.log(req.body);

   
   



    

  }catch(err)
{

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
      password,
    });
const user = await User.findOne({ username });
// const arr = [];
//  const uId = user._id;
// await CartItems.create({
//      uId,
//      arr,
//     });
    const authToken = setToken(newUser);
    console.log(authToken);
    res.cookie("token", authToken, {
      httpOnly: true,
      maxAge: 24 * 1000 * 60 * 60,
    });

    const items = await Item.find({});
    return res.render("index.ejs", { items });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error during verification.");
  }
});

app.get("/logout", async (req, res) => {
  try {
    res.clearCookie("token");
    console.log(res.cookie)
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
