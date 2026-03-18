const express = require('express')
const cloudinary = require('cloudinary').v2
const multer = require('multer')
const auth_middleware = require('../middileware/auth_middleware')
const { PrismaPg } = require('@prisma/adapter-pg')
const { PrismaClient } = require('../prisma/generated/prisma')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const router = express.Router()

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Store file in memory
const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post('/api/upload/avatar', auth_middleware, upload.single('avatar'), async (req, res) => {
    console.log('Upload route hit')
    console.log('file:', req.file)
    console.log('user:', req.user)
  const userId = req.user.id

  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'collabcode/avatars', transformation: [{ width: 200, height: 200, crop: 'fill' }] },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(req.file.buffer)
    })

    // Save URL to user
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: result.secure_url }
    })

    return res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatarUrl: result.secure_url
    })
  } 
 catch (error) {
    console.log('Upload error:', error.message)
    return res.status(500).json({ message: error.message })
}
  
})

module.exports = router