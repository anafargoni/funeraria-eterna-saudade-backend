const express = require("express");
const router = express.Router();
const db = require("../db");

// TABELA FUNERAL
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
            return res.status(400).json({ msg: "Funeral não encontrado!" });
        }
        return res.status(200).json(r.rows[0]);
    } catch (error) {
        return res.status(500).json({ msg: error.message })
    }
});

// POST /funerais - Cadastra um novo funeral e associa o cliente
router.post("/", async (req, res, next) => {
    try {
        const { duracao,
            data_evento,
            local,
            nome_falecido,
            data_nascimento_falecido,
            data_morte_falecido,
            cpf_falecido,
            cpf_cliente,
            pagamento 
        } = req.body || {};

        if (!duracao) {
            throw new Error("A duração é obrigatória!");
        }
        if (!data_evento) {
            throw new Error("A data do evento é obrigatória!");
        }
        if (!local) {
            throw new Error("O local é obrigatória!");
        }
        if (!nome_falecido) {
            throw new Error("O nome do falecido é obrigatória!");
        }
        if (!data_nascimento_falecido) {
            throw new Error("A data de nascimento do falecido é obrigatória!");
        }
        if (!data_morte_falecido) {
            throw new Error("A data da morte do falecido é obrigatória!");
        }
        if (!cpf_falecido) {
            throw new Error("O CPF do falecido é obrigatória!");
        }
        if (!cpf_cliente) {
            throw new Error("O CPF do cliente é obrigatória!");
        }
        if(pagamento === undefined) {
            throw new Error("O pagamento é obrigatório!")
        }

        const r = await db.query(
            `INSERT INTO funeral 
            ( duracao, data_evento, local, nome_falecido, data_nascimento_falecido, data_morte_falecido, cpf_falecido, cpf_cliente, pagamento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING*`,
            [   duraçao,
                data_evento,
                local,
                nome_falecido,
                data_nascimento_falecido,
                data_morte_falecido,
                cpf_falecido,
                cpf_cliente,
                pagamento 
            ]
        );

        if(!r.rowCount) {
            throw new Error("Funeral não adicionado!");
        } return res.status(201).json({ msg: "Funeral adicionado!", data: r.rows[0]});
        

    } catch (error) {
        return res.status(400).json({ msg: error.message})
    }

});


module.exports = router;