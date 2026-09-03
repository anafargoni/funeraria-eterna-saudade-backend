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

// Operação Exclusiva - Buscar os serviços de um funeral
router.get("/servicos/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        const funeral = await db.query(
            "SELECT * FROM funeral WHERE id = $1",
            [id]
        );

        if (!funeral.rowCount) {
            throw new Error("Funeral não encontrado!");
        }

        const servicos = await db.query(
            `SELECT
                s.id,
                s.nome,
                s.descricao,
                s.valor

            FROM funeral f

            JOIN servico_funeral sf
                ON f.id = sf.id_funeral

            JOIN servico s
                ON sf.id_servico = s.id

            WHERE f.id = $1`,
            [id]
        );

        if (!servicos.rowCount) {
            throw new Error("Este funeral não possui serviços associados!");
        }

        return res.status(200).json({
            msg: "Serviços encontrados com sucesso!",
            funeral: funeral.rows[0].nome_falecido,
            servicos: servicos.rows
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});


// GET /funeral/:id - Buscar funeral por id
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if(!Number.isInteger(id) || id <= 0 ) {
            return res.status(400).json({msg: "ID não encontrado!" });
        }
        const r = await db.query("SELECT * FROM funeral WHERE id = $1", [id]);
        if(!r.rowCount) {
            return res.status(400).json({ msg: "Funeral não encntrado!" });
        }
        return res.status(200).json(r.row[0]);
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
});

// POST /funerais - Cadastra um novo funeral e associa o cliente
router.post("/", async (req, res, next) => {
    try {
        const { duraçao } = req.body || {};
    } catch (error) {
        
    }

});


module.exports = router;