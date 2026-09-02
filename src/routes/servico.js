const express = require("express");
const router = express.Router();
const db = require("../db");

// GET 
router.get("/", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM servico");
        if (!r.rowCount) {
            return res.status(400).json({ msg: "Não foi encontrado nenhum serviço!" });
        }
        return res.status(200).json(r.rows);
    } catch (error) {
        return res.status(400).json({ msg: error });
    }
});

// Operação Exclusiva - Calcular o valor total de um funeral
router.get("/valor-total/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        const funeral = await db.query("SELECT * FROM funeral WHERE id = $1", [id]);

        if (!funeral.rowCount) {
            throw new Error("Funeral não encontrado!");
        }

        const dadosFuneral = await db.query(
            `SELECT
                f.nome_falecido,
                c.nome_primeiro,
                c.nome_sobrenome,
                s.nome AS nome_servico,
                s.valor

            FROM funeral f

            JOIN cliente c
                ON f.cpf_cliente = c.cpf

            JOIN servico_funeral sf
                ON f.id = sf.id_funeral

            JOIN servico s
                ON sf.id_servico = s.id

            WHERE f.id = $1`, [id]
        );

        if (!dadosFuneral.rowCount) {
            throw new Error("Este funeral não possui serviços associados!");
        }
        const valorTotal = await db.query(
            `SELECT SUM(s.valor) AS valor_total
            FROM servico_funeral sf
            JOIN servico s
                ON sf.id_servico = s.id

            WHERE sf.id_funeral = $1`, [id]);

        return res.status(200).json({
            msg: "Valor total calculado com sucesso!",

            nome_falecido: dadosFuneral.rows[0].nome_falecido,

            contratante:
                dadosFuneral.rows[0].nome_primeiro +
                " " +
                dadosFuneral.rows[0].nome_sobrenome,

            servicos: dadosFuneral.rows.map(servico => ({
                nome: servico.nome_servico,
                valor: servico.valor
            })),

            valor_total: valorTotal.rows[0].valor_total
        });

    } catch (error) {
        return res.status(200).json({ msg: error.message });
    }
});

// GET pelo ID
router.get("/:id", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM servico WHERE id = $1", [req.params.id]);
        if (!r.rowCount) {
            return res.status(400).json({ msg: "Serviço não econtrado!" });
        }
        return res.status(200).json(r.rows[0]);
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// POST
router.post("/", async (req, res, next) => {
    try {
        const { nome, valor } = req.body || {};
        let { descricao } = req.body || {};

        if (!nome) {
            throw new Error("Nome do serviço é obrigatório!");
        } else {
            const servicoEncontrado = await db.query("SELECT * FROM servico WHERE LOWER(nome) = LOWER($1)", [nome]);
            if (servicoEncontrado.rowCount) {
                throw new Error("Nome do serviço já existe");
            }
        }

        if (!valor) {
            throw new Error("Valor não encontrado");
        } else if (isNaN(Number(valor)) || Number(valor) <= 0) {
            throw new Error("Informe um valor válido maior que 0!");
        }

        if (!descricao) {
            descricao = null;
        }

        const r = await db.query("INSERT INTO servico (valor, descricao, nome) VALUES ($1, $2, $3) RETURNING *", [valor, descricao, nome]);

        if (!r.rowCount) {
            throw new Error("Serviço não foi adicionado");
        }

        return res.status(201).json({ msg: "Serviço adicionado", data: r.rows[0] });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// DELETE 
router.delete("/:id", async (req, res, next) => {
    try {
        const r = await db.query("DELETE FROM servico WHERE id = $1", [req.params.id]);
        if (!r.rowCount) {
            return res.status(400).json({ msg: "Serviço não econtrado!" });
        }

        return res.status(200).json({ msg: "Serviço deletado", data: r.rows[0] });
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// PUT 
router.put("/:id", async (req, res, next) => {
    try {
        const { nome, valor } = req.body || {};
        let { descricao } = req.body || {};

        if (!nome) {
            throw new Error("Nome do serviço é obrigatório!");
        } else {
            const servicoEncontrado = await db.query("SELECT * FROM servico WHERE LOWER(nome) = LOWER($1) AND id != $2", [nome, req.params.id]);
            if (servicoEncontrado.rowCount) {
                throw new Error("Nome do serviço já existe");
            }
        }

        if (!valor) {
            throw new Error("Valor não encontrado");
        } else if (isNaN(Number(valor)) || Number(valor) <= 0) {
            throw new Error("Informe um valor válido maior que 0!");
        }

        if (!descricao) {
            descricao = null;
        }

        const r = await db.query("UPDATE servico SET valor = $1, descricao = $2, nome = $3 WHERE id = $4 RETURNING*", [valor, descricao, nome, req.params.id]);

        if (!r.rowCount) {
            throw new Error("Serviço não foi editado!");
        }
        return res.status(201).json({ msg: "Serviço editado", data: r.rows[0] });
    } catch (error) {
        return res.status(200).json({ msg: error.message });
    }
})


module.exports = router;