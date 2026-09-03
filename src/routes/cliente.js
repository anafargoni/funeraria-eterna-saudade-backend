const express = require("express");
const router = express.Router();
const db = require("../db");

// GET
router.get("/", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM cliente");

        if (!r.rowCount) {
            return res.status(400).json({ msg: "Não foi encontrado nenhum cliente!" });
        }

        return res.status(200).json(r.rows);

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// Operação Exclusiva - Buscar todos os funerais de um cliente
router.get("/funerais/:cpf", async (req, res, next) => {
    try {
        const cpf = req.params.cpf;

        const cliente = await db.query(
            "SELECT * FROM cliente WHERE cpf = $1",
            [cpf]
        );

        if (!cliente.rowCount) {
            throw new Error("Cliente não encontrado!");
        }

        const funerais = await db.query(
            `SELECT
                f.id,
                f.nome_falecido,
                f.data_evento,
                f.local,
                f.duracao,
                f.pagamento

            FROM cliente c

            JOIN funeral f
                ON c.cpf = f.cpf_cliente

            WHERE c.cpf = $1`,
            [cpf]
        );

        if (!funerais.rowCount) {
            throw new Error("Este cliente não possui funerais associados!");
        }

        return res.status(200).json({
            msg: "Funerais encontrados com sucesso!",
            cliente:
                cliente.rows[0].nome_primeiro +
                " " +
                cliente.rows[0].nome_sobrenome,

            funerais: funerais.rows
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
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

// GET pelo CPF
router.get("/:cpf", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM cliente WHERE cpf = $1", [req.params.cpf]);

        if (!r.rowCount) {
            return res.status(400).json({ msg: "Cliente não encontrado!" });
        }

        return res.status(200).json(r.rows[0]);

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// POST
router.post("/", async (req, res, next) => {
    try {
        const {
            cpf,
            nome_primeiro,
            nome_sobrenome,
            endereco_CEP,
            endereco_rua,
            endereco_cidade,
            endereco_bairro,
            endereco_numero,
            contato_email,
            contato_telefone,
            data_nascimento
        } = req.body || {};

        if (!cpf) {
            throw new Error("CPF é obrigatório!");
        } else {
            const clienteEncontrado = await db.query(
                "SELECT * FROM cliente WHERE cpf = $1",
                [cpf]
            );

            if (clienteEncontrado.rowCount) {
                throw new Error("CPF já cadastrado!");
            }
        }

        if (!nome_primeiro) {
            throw new Error("Nome é obrigatório!");
        }

        if (!nome_sobrenome) {
            throw new Error("Sobrenome é obrigatório!");
        }

        if (!contato_email) {
            throw new Error("Email é obrigatório!");
        }

        if (!contato_telefone) {
            throw new Error("Telefone é obrigatório!");
        }

        const r = await db.query(
            `INSERT INTO cliente 
            (cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                cpf,
                nome_primeiro,
                nome_sobrenome,
                endereco_CEP,
                endereco_rua,
                endereco_cidade,
                endereco_bairro,
                endereco_numero,
                contato_email,
                contato_telefone,
                data_nascimento
            ]
        );

        if (!r.rowCount) {
            throw new Error("Cliente não foi adicionado!");
        }

        return res.status(201).json({
            msg: "Cliente adicionado",
            data: r.rows[0]
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// DELETE
router.delete("/:cpf", async (req, res, next) => {
    try {
        const r = await db.query(
            "DELETE FROM cliente WHERE cpf = $1 RETURNING *",
            [req.params.cpf]
        );

        if (!r.rowCount) {
            return res.status(400).json({ msg: "Cliente não encontrado!" });
        }

        return res.status(200).json({
            msg: "Cliente deletado",
            data: r.rows[0]
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// PUT
router.put("/:cpf", async (req, res, next) => {
    try {
        const {
            nome_primeiro,
            nome_sobrenome,
            endereco_CEP,
            endereco_rua,
            endereco_cidade,
            endereco_bairro,
            endereco_numero,
            contato_email,
            contato_telefone,
            data_nascimento
        } = req.body || {};

        if (!nome_primeiro) {
            throw new Error("Nome é obrigatório!");
        }

        if (!nome_sobrenome) {
            throw new Error("Sobrenome é obrigatório!");
        }

        if (!contato_email) {
            throw new Error("Email é obrigatório!");
        }

        if (!contato_telefone) {
            throw new Error("Telefone é obrigatório!");
        }

        const r = await db.query(
            `UPDATE cliente SET 
                nome_primeiro = $1,
                nome_sobrenome = $2,
                endereco_CEP = $3,
                endereco_rua = $4,
                endereco_cidade = $5,
                endereco_bairro = $6,
                endereco_numero = $7,
                contato_email = $8,
                contato_telefone = $9,
                data_nascimento = $10

            WHERE cpf = $11 RETURNING *`,
            [
                nome_primeiro,
                nome_sobrenome,
                endereco_CEP,
                endereco_rua,
                endereco_cidade,
                endereco_bairro,
                endereco_numero,
                contato_email,
                contato_telefone,
                data_nascimento,
                req.params.cpf
            ]
        );

        if (!r.rowCount) {
            throw new Error("Cliente não foi editado!");
        }

        return res.status(201).json({
            msg: "Cliente editado",
            data: r.rows[0]
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

module.exports = router;