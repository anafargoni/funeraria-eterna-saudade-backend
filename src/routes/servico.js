const express = require("express");
const router = express.Router();
const db = require("../db");

// GET Serviços 
router.get("/", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM servico");
        if (!r.rowCount) {
            return res.status(400).json({ msg : "Não foi encontrado nenhum serviço!" });
        }
        return res.status(200).json(r.rows);
    } catch (error) {
        return res.status(400).json({ msg : error });
    }
});

// GET Serviços pelo ID
router.get("/:id", async (req, res, next) => {
    try{
        const r = await db.query("SELECT * FROM servico WHERE id = $1", [req.params.id]);
        if (!r.rowCount){
            return res.status(400).json({ msg : "Serviço não econtrado!" });
        }
        return res.status(200).json(r.rows[0]);
    } catch (error) {
        return res.status(400).json({ msg : error.message });
    }
});

// 


module.exports = router;