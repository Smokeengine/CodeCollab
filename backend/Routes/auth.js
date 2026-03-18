const bcrypt = require("bcrypt");
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../prisma/generated/prisma');
const auth_middleware = require('../middileware/auth_middleware')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

router.post("/api/register", async (req, res) => {
  const { firstname, lastname, email, password, avatarUrl } = req.body;

  try {
    if (!firstname || !lastname || !email || !password) {
      return res.json({
        message: "All feilds are required!",
      });
    }
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.json({
        message: "The user already exists!",
      });
    }
    const hasedPassword = await bcrypt.hash(password, 12);
    const response = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password: hasedPassword,
        avatarUrl,
      },
    });
    const token = jwt.sign({ id: response.id }, process.env.secretKey, {
      expiresIn: "1h",
    });

    if (response) {
      return res.status(200).json({
        token,
        user: {
          id: response.id,
          name: response.firstname,
          email: response.email
        },
        message: "user succesfully created!",
      });
    }
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return res.status(400).json({
        message: "user not found!",
      });
    }
    const response = await bcrypt.compare(password, user.password);
    const token = jwt.sign({ id: user.id }, process.env.secretKey, {
      expiresIn: "1h",
    });
    if(!response) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }
    res.status(200).json({
        message: "login succesfull",
        token: token,
        user:{
            id: user.id,
            name: user.firstname,
            email: user.email
        }
      });
    
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

router.get('/api/me', auth_middleware, async (req, res) => {
  const userId = req.user.id
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    return res.status(200).json({
      id: user.id,
      name: user.firstname,
      email: user.email,
      avatarUrl: user.avatarUrl
    })
  } catch (error) {
    return res.status(500).json({ message: error.message })
  }
})



module.exports = router;
