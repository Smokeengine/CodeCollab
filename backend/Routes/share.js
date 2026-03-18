const express = require("express");
const jwt = require("jsonwebtoken");
const auth_middleware = require("../middileware/auth_middleware");
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../prisma/generated/prisma');

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const router = express.Router();

router.post('/api/documents/:id/share', auth_middleware, async (req,res) => {
    const {id} = req.params;
    const userId = req.user.id;
    const {role} = req.body;

    try {
        
        const token = jwt.sign({
            docID: id,
            userId,
            role
        }, process.env.secretKey, 
        {expiresIn: '7d'})

        return res.status(200).json({
            message: 'Link created successfully',
            token,
        })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message: error.message})
    }
})

router.get('/api/join/:token', auth_middleware, async (req,res) => {
    const userId = req.user.id;
    const {token} = req.params;
    try {
   
        const {docID, role} = jwt.verify(token, process.env.secretKey);
        const result = await prisma.documentCollaborator.create({
            data: {
                documentId: docID,
                userId,
                role
            }
        })
        if(result){
            return res.status(200).json({
                message: "Joined successfully",
                docID
            })
        }
    } catch (error) {
   
            return res.status(400).json({ message: 'Invalid or expired link' })
        
    }
})

module.exports = router;