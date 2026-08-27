const express = require("express");
const router = express.Router();
const db = require("../db");

// Get Serviços 
router.get("/", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM servico");
        return res.status(200).json(r.rows);
    } catch (error) {
        return res.status(400).json({ msg : error });
    }
})

