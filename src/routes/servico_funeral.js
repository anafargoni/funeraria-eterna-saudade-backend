const express = require("express");
const router = express.Router();
const db = require("../db");

// TABELA SERVICO_FUNERAL
// GET - Listar TODAS as associações
router.get("/", async (req, res, next) => { 
    try {
        const r = await db.query(`SELECT f.id as id_funeral, f.nome_falecido as defunto, s.id as id_servico, s.nome as nome_servico 
            FROM servico_funeral sf 
            JOIN funeral f ON f.id = sf.id_funeral 
            JOIN servico s ON s.id = sf.id_servico 
            ORDER BY f.id, s.id`);

        if (!r.rowCount) {
            return res.status(400).json({ msg: "Não foi encontrado nenhum serviço!", data: r.rows });
        }

        return res.status(200).json({msg: "Associações encontradas", quantidade: r.rowCount, data: r.rows});
    } catch (error) {   
        console.log(error)
        return res.status(500).json({ msg: "Erro interno do servidor!"});
    }
}); // OK

// GET - Quantos e quais SERVIÇOS existem em um FUNERAL
router.get("/funeral/:id_funeral", async (req, res) => {
    try{
        const idFuneral = Number(req.params.id_funeral);

        if (!Number.isInteger(idFuneral) || idFuneral <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        const funeral = await db.query(`SELECT id, nome_falecido FROM funeral WHERE id = $1`,[idFuneral]);

        if (!funeral.rowCount) {
            return res.status(404).json({msg: "Funeral não encontrado!"});
        }

        const servicos = await db.query(
            `SELECT s.id, s.nome, s.descricao, s.valor
            FROM servico_funeral sf

            JOIN servico s ON s.id = sf.id_servico

            WHERE sf.id_funeral = $1 ORDER BY s.id`,[idFuneral]);

        return res.status(200).json({
            msg: "Serviços do funeral encontrados!",
            funeral: funeral.rows[0],
            quantidade_servicos: servicos.rowCount,
            servicos: servicos.rows
        });

    } catch (error) {
        console.error("Erro de servidor");
        return res.status(400).json({msg: error.message});
    }
}); // OK

// GET - Quantos e quais FUNERAIS possuem determinado SERVIÇO
router.get("/servico/:id_servico", async (req, res) => {
    try {
        const idServico = Number(req.params.id_servico);

        if (!Number.isInteger(idServico) || idServico <= 0) {
            throw new Error("Informe um ID de serviço válido!");
        }

        const servico = await db.query(
            `SELECT id, nome, descricao, valor
            FROM servico
            WHERE id = $1`,[idServico]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        const funerais = await db.query(
            `SELECT f.id,  f.nome_falecido

            FROM servico_funeral sf

            JOIN funeral f ON f.id = sf.id_funeral

            WHERE sf.id_servico = $1

            ORDER BY f.id`, [idServico] );

        return res.status(200).json({
            msg: "Funerais associados ao serviço encontrados!",
            servico: servico.rows[0],
            quantidade_funerais: funerais.rowCount,
            funerais: funerais.rows
        });

    } catch (error) {
        console.error("Erro de servidor");
        return res.status(400).json({msg: error.message});
    }
}); // OK

// GET - Caso o usuário não informar o ID do serviço
router.get("/funeral/:id_funeral/servico", async (req, res) => {
    return res.status(400).json({msg: "Informe o ID do serviço!"});
}); // OK

// GET - Buscar UMA associação específica
router.get("/funeral/:id_funeral/servico/:id_servico", async (req, res, next) => {
    try {
        const idFuneral = Number(req.params.id_funeral);
        const idServico = Number(req.params.id_servico);

        if (!Number.isInteger(idFuneral) || idFuneral <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        if (!Number.isInteger(idServico) || idServico <= 0) {
            throw new Error("Informe um ID de serviço válido!");
        }

        const funeral = await db.query( `SELECT * FROM funeral WHERE id = $1`, [idFuneral]);

        if (!funeral.rowCount) {
            return res.status(404).json({msg: "Funeral não encontrado!"});
        }

        const servico = await db.query(`SELECT * FROM servico WHERE id = $1`,[idServico] );

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!" });
        }

        const r = await db.query(`SELECT f.id as id_funeral, f.nome_falecido as defunto, s.id as id_servico, s.nome as nome_servico 
            FROM servico_funeral sf 
            JOIN funeral f ON f.id = sf.id_funeral 
            JOIN servico s ON s.id = sf.id_servico 
            WHERE sf.id_funeral = $1
            AND sf.id_servico = $2`, 
        [idFuneral, idServico]);

        if (!r.rowCount) {
            throw new Error("Esta associação não existe!");
        }

        return res.status(200).json({msg: "Associação encontrada com sucesso!", data: r.rows[0]});

    } catch (error) {
        console.error("Erro de servidor");
        return res.status(400).json({msg: error.message});
    }
}); // OK

// GET - Buscar UMA associação de acordo com o ID da associação

// POST - Associação de Serviço com Funeral
router.post("/funeral/:id_funeral/servico", async (req, res) => {
    try {
        const idFuneral = Number(req.params.id_funeral);
        const idServico = Number(req.body?.id_servico);

        if (!Number.isInteger(idFuneral) || idFuneral <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        if (!Number.isInteger(idServico) || idServico <= 0) {
            throw new Error("Informe um ID de serviço válido!");
        }

        const funeral = await db.query(`SELECT id, nome_falecido AS defunto FROM funeral WHERE id = $1`,[idFuneral]);

        if (!funeral.rowCount) {
            return res.status(404).json({msg: "Funeral não encontrado!"});
        }

        const servico = await db.query(`SELECT id, nome AS nome_servico FROM servico WHERE id = $1`,[idServico]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        const associacao = await db.query(`SELECT * FROM servico_funeral WHERE id_funeral = $1 AND id_servico = $2`, [idFuneral, idServico]);

        if (associacao.rowCount) {
            return res.status(409).json({msg: "Este serviço já está associado a este funeral!"});
        }

        const r = await db.query(`INSERT INTO servico_funeral (id_funeral, id_servico) VALUES ($1, $2) RETURNING *`, [idFuneral, idServico]);

        return res.status(201).json({ msg: "Serviço associado ao funeral com sucesso!",
            data: {
                id_funeral: r.rows[0].id_funeral,
                nome_falecido: funeral.rows[0].defunto,

                id_servico: r.rows[0].id_servico,
                nome_servico: servico.rows[0].nome_servico
            }}
            );

    } catch (error) {
        console.error("Erro de servidor");
        return res.status(400).json({msg: error.message});
    }
}); 

// DELETE - Associação de Serviço com Funeral
router.delete("/funeral/:id_funeral/servico/:id_servico", async (req, res, next) => {
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
        
        const funeral = await db.query(`SELECT id, nome_falecido AS defunto FROM funeral WHERE id = $1`,[idFuneral]);

        if (!funeral.rowCount) {
            return res.status(404).json({msg: "Funeral não encontrado!"});
        }

        const servico = await db.query(`SELECT id, nome AS nome_servico FROM servico WHERE id = $1`,[idServico]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        return res.status(200).json({ 
            msg: "Serviço desassociado do funeral com sucesso!", data: {
            id_funeral: r.rows[0].id_funeral,
            nome_falecido: funeral.rows[0].defunto,

            id_servico: r.rows[0].id_servico,
            nome_servico: servico.rows[0].nome_servico
        }});

    } catch (error) {
        console.log(error);
        return res.status(400).json({ msg: "Erro interno do servidor!" });
    }
}); // aqui precisa aparecer o nome

module.exports = router;