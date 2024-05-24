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
        const { username, password } = req.body;
        const userModel = new UserModel();
        try {
            const user = await userModel.getUser(username);
            if (user) {
                const passwordMatch = await bcrypt.compare(password, user[0].password.S);
                const token = jwt.sign({ userid: user[0].userid.S }, 'qwertyuiopasdfghjklzxcvbnmqwertyuiop', { expiresIn: '1h' });
                if (passwordMatch) {
                    res.status(200).json({role:user[0].role.S,token: token, username:user[0].username.S,message: "Login successful" });
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
    getUser : async (req, res) => {
        const username = req.body; 
        const userModel = new UserModel();
        try {
            const user = await userModel.getUser(username.username);
            if (user) {
              res.json(user[0].username.S);
            } else {
              res.status(404).json({ error: 'User not found' });
            }
          } catch (err) {
            console.error("Error fetching user by ID:", err);
            res.status(500).json({ error: 'Internal server error' });
          }
    }
};

module.exports = userController;

