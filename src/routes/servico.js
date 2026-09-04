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
        return res.status(500).json({ msg: error.message });
    }
});

// Operação Exclusiva - Calcular o valor total de um funeral.
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
        return res.status(400).json({ msg: error.message });
    }
});

// Operação Exclusiva - Buscar clientes - Quando não informar nome
router.get("/cliente", async (req, res) => {
    return res.status(400).json({ msg: "Informe o nome do serviço!"});
});

// Operação Exclusiva - Buscar clientes que contrataram determinado serviço através do nome do serviço.
router.get("/cliente/:nome", async (req, res, next) => {
    try {
        const nome = req.params.nome;

        if (!nome || !nome.trim() ) {
            throw new Error("Informe o nome do serviço!");
        }

        const servico = await db.query("SELECT * FROM servico WHERE LOWER(nome) = LOWER($1)", [nome]);
        
        if (!servico.rowCount) {
            throw new Error("Serviço não encontrado!");
        }
        
        const clientes = await db.query(
            `SELECT 
                c.nome_primeiro,
                c.nome_sobrenome,
                c.data_nascimento,
                c.contato_email,
                c.contato_telefone

            FROM servico s

            JOIN servico_funeral sf
                ON s.id = sf.id_servico

            JOIN funeral f
                ON sf.id_funeral = f.id

            JOIN cliente c
                ON f.cpf_cliente = c.cpf

            WHERE LOWER(s.nome) = LOWER($1)`, [nome]
        );

        
        if (!clientes.rowCount) {
            throw new Error("Nenhum cliente foi encontrado para essse serviço!");
        }

        return res.status(200).json({ msg : "Clientes encontrados com sucesso!", clientes : clientes.rows});


    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

// Operação Excluisva - Quantos Funerais tal serviço já "participou"
router.get("/:id_servico/funerais/quantidade", async (req, res) => {
    try {
        const idServico = Number(req.params.id_servico);

        if (!Number.isInteger(idServico) || idServico <= 0) {
            return res.status(400).json({msg: "Informe um ID de serviço válido!"});
        }

        const servico = await db.query(`SELECT id FROM servico WHERE id = $1`,[idServico]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        const r = await db.query(`SELECT COUNT(*) AS quantidade_funerais FROM servico_funeral WHERE id_servico = $1`,[idServico]);

        return res.status(200).json({msg: "Quantidade de funerais encontrada!", data: {id_servico: idServico,quantidade_funerais: Number(r.rows[0].quantidade_funerais)}});

    } catch (error) {
        return res.status(500).json({msg: error.message});
    }
});

// GET pelo ID
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ msg: "ID inválido!" });
        }

        const r = await db.query("SELECT * FROM servico WHERE id = $1", [id]);
        if (!r.rowCount ) {
            return res.status(404).json({ msg: "Serviço não econtrado!" });
        }
        return res.status(200).json(r.rows[0]);

    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
});

// POST
router.post("/", async (req, res, next) => {
    try {
        const { nome, valor } = req.body || {};
        let { descricao } = req.body || {};

        if (!nome || !nome.trim() || typeof nome != "string") {
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
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({msg: "ID inválido!"});
        }

        const servico = await db.query("SELECT * FROM servico WHERE id = $1",[id]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        const associacao = await db.query("SELECT f.id, f.nome_falecido FROM servico_funeral sf JOIN funeral f ON f.id = sf.id_funeral WHERE sf.id_servico = $1",[id]);

        console.log("ASSOCIAÇÕES:", associacao.rows);

        if (associacao.rowCount > 0) {
            return res.status(400).json({
                msg: "Não é possível excluir este serviço, pois ele está associado a um funeral!",
                quantidade_funerais : associacao.rowCount,
                funerais: associacao.rows
            });
        }

        const r = await db.query("DELETE FROM servico WHERE id = $1 RETURNING *",[id]);

        return res.status(200).json({ msg: "Serviço deletado com sucesso!", data: r.rows[0]});

    } catch (error) {
        console.log("ERRO NO DELETE:", error);
        return res.status(500).json({msg: "Erro ao excluir serviço!"});
    }
});

// PUT 
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ msg: "ID inválido!" });
        }

        const { nome, valor } = req.body || {};
        let { descricao } = req.body || {};

        if (!nome || !nome.trim()) {
            throw new Error("Nome do serviço é obrigatório!");
        } else {
            const servicoEncontrado = await db.query("SELECT * FROM servico WHERE LOWER(nome) = LOWER($1) AND id != $2", [nome, id]);
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

        const r = await db.query("UPDATE servico SET valor = $1, descricao = $2, nome = $3 WHERE id = $4 RETURNING*", [valor, descricao, nome, id]);

        if (!r.rowCount) {
            throw new Error("Serviço não foi editado!");
        }
        return res.status(200).json({ msg: "Serviço editado", data: r.rows[0] });
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

module.exports = router;