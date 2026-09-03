const express = require("express");
const router = express.Router();
const db = require("../db");

// TABELA SERVICO_FUNERAL
// GET - Associação de Serviço com Funeral
router.get("/servico", async (req, res, next) => { 
    try {
        const r = await db.query("SELECT * FROM servico_funeral");
        if (!r.rowCount) {
            return res.status(400).json({ msg: "Não foi encontrado nenhum serviço!" });
        }
        return res.status(200).json({msg: "Lista de Funerais com seus Serviços!", data: r.rows});
    } catch (error) {   
        return res.status(400).json({ msg: error.message });
    }
});

router.get("/:id_funeral/servico/:id_servico", async (req, res, next) => {
    try {
        const idFuneral = Number(req.params.id_funeral);
        const idServico = Number(req.params.id_servico);

        if (!Number.isInteger(idFuneral) || idFuneral <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        if (!Number.isInteger(idServico) || idServico <= 0) {
            throw new Error("Informe um ID de serviço válido!");
        }

        const r = await db.query(`SELECT f.id as id_funeral, f.nome_falecido as defunto, s.id as id_servico, s.nome as nome_servico FROM servico_funeral sf JOIN servico s ON s.id = sf.id_servico JOIN funeral f ON f.id = sf.id_funeral WHERE sf.id_funeral = $1
    AND sf.id_servico = $2`, [idFuneral, idServico]);

        if (!r.rowCount) {
            throw new Error("Esta associação não existe!");
        }

        return res.status(200).json({msg: "Associação encontrada com sucesso!", data: r.rows[0]});

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// DELETE - Associação de Serviço com Funeral
router.delete("/:id_funeral/servico/:id_servico", async (req, res, next) => {
    try{
        const idFuneral = Number(req.params.id_funeral);
        const idServico = Number(req.params.id_servico);

        if (!Number.isInteger(idFuneral) || idFuneral <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        if (!Number.isInteger(idServico) || idServico <= 0) {
            throw new Error("Informe um ID de serviço válido!");
        }

        const r = await db.query(
            `DELETE FROM servico_funeral
             WHERE id_funeral = $1
             AND id_servico = $2
             RETURNING *`, [idFuneral, idServico]);


        if (!r.rowCount) {
            throw new Error("Esta associação não existe!");
        }

        return res.status(200).json({ msg: "Serviço desassociado do funeral com sucesso!", data: r.rows[0]});

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// POST - Associação de Serviço com Funeral
router.post("/servico", async (req, res, next) => {
    try{
        const {id_funeral} = req.body || {};
        const {id_servico} = req.body || {};

        if (!Number.isInteger(id_funeral) || id_funeral <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        if (!Number.isInteger(id_servico) || id_servico <= 0) {
            throw new Error("Informe um ID de serviço válido!");
        }

        const funeral = await db.query("SELECT * FROM funeral WHERE id = $1", [id_funeral]);

        if (!funeral.rowCount) {
            throw new Error("Funeral não encontrado!");
        }

        const servico = await db.query("SELECT * FROM servico WHERE id = $1",[id_servico]);

        if (!servico.rowCount) {
            throw new Error("Serviço não encontrado!");
        }

        const associacao = await db.query(`SELECT * FROM servico_funeral WHERE id_funeral = $1 AND id_servico = $2`,[id_funeral, id_servico]);

        if (associacao.rowCount) {
            throw new Error("Este serviço já está cadastrado a este funeral!");
        }

        const r = await db.query(`INSERT INTO servico_funeral (id_funeral, id_servico) VALUES ($1, $2) RETURNING *`, [id_funeral, id_servico]);

        return res.status(201).json({ msg: "O cadastro de Serviço ao funeral foi efetuado com sucesso!", data: r.rows[0]});

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// GET /funeral - Buscar todos os funerais 
router.get("/", async (req, res, next) => {
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
        return res.status(400).json({ msg: error.message });
    }
});

// GET /funeral/:id - Buscar funeral por id
router.get("/:id", async (req, res, next) => {

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
            falecido: funeral.rows[0].nome_falecido,
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