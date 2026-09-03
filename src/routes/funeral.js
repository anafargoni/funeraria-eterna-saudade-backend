const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /funeral - Buscar todos os funerais 
router.get("/funerais", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM funeral");
        // Verifica se não foi encontrado nenhum funeral
        if (r.rows.length === 0) {
            return res.status(400).json({
                msg: "Não foi encontrado nenhum funeral!"
            });
        }
        return res.status(200).json(r.rows);

    } catch (error) {
        return res.status(400).json({
            msg: error.message
        });
    }
});

// GET /funeral/:id - Buscar funeral por id
router.get("/funeral/:id", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM funeral WHERE id = $1",[req.params.id]);
        if (r.rows.length === 0) {
            return res.status(400).json({
                msg: "Funeral não encontrado!"
            });
        }
        return res.status(200).json(r.rows[0]);

    } catch (error) {
        return res.status(400).json({
            msg: error.message
        });
    }
});

module.exports = router;