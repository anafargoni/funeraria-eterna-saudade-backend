 const express = require("express");
 const router = express.Router();
 const db = require("../db");

 router.get("/", async (req, res) => {
    try {
        const r = await db.queru("SELECT * FROM cliente");
        return res.status(200).json
    }
 })