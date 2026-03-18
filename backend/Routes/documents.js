const express = require("express");
const auth_middleware = require("../middileware/auth_middleware");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("../prisma/generated/prisma");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const router = express.Router();

/* Creating the documents */

router.post("/api/document", auth_middleware, async (req, res) => {
  const { title, type, language } = req.body;
  const { id } = req.user;

  try {
    if (!title || !type) {
      return res.status(401).json({
        message: "All feilds are required!",
      });
    }
    const response = await prisma.document.create({
      data: {
        title,
        type,
        language,
        ownerId: id,
      },
    });
    if (response) {
      return res.status(200).json({
        message: "Document succesfully created!",
        response,
      });
    }
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

/* Getting all the documents */

router.get("/api/documents", auth_middleware, async (req, res) => {
  const { id } = req.user;
  try {
    const response = await prisma.user.findUnique({
      where: { id },
      include: {
        documents: true,
      },
    });
    if (!response) {
      return res.status(404).json({
        message: "no documents found!",
      });
    }
    return res.status(200).json({
      message: "succesfully fetched all the documents",
      documents: response.documents,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

/* Getting a specific documents */

router.get("/api/documents/:id", auth_middleware, async (req, res) => {
  const { id } = req.params;
  const userID = req.user.id;
  try {
    // Find document without restricting to owner
    const response = await prisma.document.findUnique({
      where: { id },
    });
    if (!response) {
      return res.status(404).json({
        message: "Document not found!",
      });
    }

    // Determine role
    let role = null;
    if (response.ownerId === userID) {
      role = "OWNER";
    } else {
      const collaborator = await prisma.documentCollaborator.findFirst({
        where: { documentId: id, userId: userID },
      });
      role = collaborator?.role || null;
    }

    // If no role at all — unauthorized
    if (!role) {
      return res.status(403).json({
        message: "You do not have access to this document",
      });
    }
    console.log("userID:", userID);
    console.log("ownerId:", response.ownerId);
    console.log("match:", response.ownerId === userID);
    console.log('returning role', role)
    return res.status(200).json({
      message: "Document fetched successfully",
      documents: response,
      role,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

/* Deleting a specific documents */

router.delete("/api/documents/:id", auth_middleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  try {
    const response = await prisma.document.findUnique({
      where: {
        id,
      },
    });
    if (!response) {
      return res.status(404).json({
        message: "Document not found",
      });
    }
    if (response.ownerId === userId) {
      await prisma.document.delete({
        where: { id },
      });
    } else {
      return res.status(403).json({
        message: " You are not authorized to delete this document!",
      });
    }
    return res.status(200).json({
      message: "Document succesfully deleted!",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

/* updating a specific documents */

router.patch("/api/documents/:id", auth_middleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const { title, content } = req.body;
  console.log("PATCH body:", req.body);
  console.log("content received:", req.body.content);
  try {
    const response = await prisma.document.findUnique({
      where: { id },
    });
    if (!response) {
      return res.status(404).json({
        message: "Document not found!",
      });
    }
    await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(content !== undefined && { content }),
      },
    });
    return res.status(200).json({
      message: "Document updated successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
