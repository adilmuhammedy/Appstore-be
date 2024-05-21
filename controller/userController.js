// userController.js
const UserModel = require("../model/userModel");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const userController = {
    createUser: async (req, res) => {
        const { username, password, role } = req.body;
        const userid = uuidv4();
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = { userid, username, password: hashedPassword, role }; // Add more fields if needed
        const userModel = new UserModel();

        try {
            const success = await userModel.createUser(user);
            if (success) {
                res.status(201).json({ message: "User created successfully" });
            } else {
                res.status(500).json({ message: "Failed to create user" });
            }
        } catch (err) {
            console.error("Error creating user:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    login: async (req, res) => {
        // console.log(`req body`,req.body);
        const { username, password } = req.body;
        const userModel = new UserModel();
        try {
            const user = await userModel.getUser(username);
            // console.log(`user`,user[0].role.S);
            if (user) {
                const passwordMatch = await bcrypt.compare(password, user[0].password.S);
                const token = jwt.sign({ user: user[0].username, role: user[0].role }, 'qwertyuiopasdfghjklzxcvbnmqwertyuiop', { expiresIn: '1h' });
                if (passwordMatch) {
                    res.status(200).json({role:user[0].role.S,token: token, message: "Login successful" });
                } else {
                    res.status(401).json({ message: "Invalid username or password" });
                }
            } else {
                res.status(404).json({ message: "User not found" });
            }
        } catch (err) {
            console.error("Error during login:", err);
            res.status(500).json({ message: "Internal server error" });
        }
    },

    // Implement other controller methods as needed
};

module.exports = userController;









































// const express = require('express');
// const session = require('express-session');
// const cookieParser = require('cookie-parser');
// const jwt = require('jsonwebtoken');
// const User = require('../model/userModel'); // Import the User model

// const app = express();
// app.use(cookieParser());

// const BLACKLIST = new Set();

// const registerUser = async (req, res) => {
//     const { username, password,role } = req.body;

//     // Check if the username already exists
//     const existingUser = await User.findOne({ where: { username } });
//     if (existingUser) {
//       return res.status(400).json({ error: 'Username already exists' });
//     }

//     try {
//       // Create a new user
//       const newUser = await User.create({
//         username,
//         password, // Note: Make sure to hash the password before saving it to the database
//         role,
//       });

//       // You can also generate a JWT token here and send it to the client for authentication
//       res.status(201).json({ message: 'User registered successfully', user: newUser });
//       // console.log("User reg success");
//     } catch (error) {
//       console.error('Error during registration:', error);
//       res.status(500).json({ error: 'Internal Server Error' });
//     }
// };



  
// // Function to get user by username from the database
// const getUserByUsername = async (username) => {
//   try {
//     return await User.findOne({
//       where: { username },
//     });
//   } catch (error) {
//     console.error('Error fetching user by username:', error);
//     throw error;
//   }
// };

// // Login controller
// const login = async (req, res) => {
//   const { username, password } = req.body;
//   try {
//     const user = await getUserByUsername(username);
//     // console.log(`user details`,user);

//     if(!user){
//         return res.status(401).json({error: 'User not exists'});
//     }
//     else if (user.password !== password) {
//       return res.status(401).json({ error: 'Invalid username or password' });
//     }

//     const { role } = user;
//     const token = jwt.sign({ user: user.username, role, createdAt: user.createdAt }, 'qwertyuiopasdfghjklzxcvbnmqwertyuiop', { expiresIn: '1h' });
    
//     // Send the token and role in the response body
//     res.json({ token, role });
//     // console.log("Token sent to frontend:", token);
//   } catch (error) {
//     console.error('Error during login:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// // Middleware to check token and user authentication
// const isAuthenticated = async (req, res, next) => {
//   const token = req.token;

//   if (token && !BLACKLIST.has(token)) {
//     jwt.verify(token, 'qwertyuiopasdfghjklzxcvbnmqwertyuiop', (err, decoded) => {
//       if (err) {
//         return res.status(401).json({ error: 'Invalid token' });
//       }
//       // Token is valid
//       req.user = decoded.user; // Attach user to request object
//       next();
//     });
//   } else {
//     // Token is missing or blacklisted
//     res.status(401).json({ error: 'Unauthorized' });
//   }
// };

// const userProfile = async(req,res) => {

//   try {
//     // Extract user ID from the request's authorization token
//     const token = req.body.token;
//     // console.log(`token recieved at the backend`,token);
//     const user = jwt.decode(token);
//     // console.log(user);
//     if (!user) {
//       return res.status(404).json({ error: 'User not found' });
//     }

//     // If the user is found, return the user data
//     res.json(user);
//   } catch (error) {
//     console.error('Error fetching user data:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// };

// module.exports = { login, registerUser, userProfile };
