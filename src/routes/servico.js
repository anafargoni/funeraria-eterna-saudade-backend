const express = require("express");
const router = express.Router();
const db = require("../db");

// GET 
router.get("/", async (req, res, next) => {
    try {
        const r = await db.query("SELECT * FROM servico ORDER BY id");
        if (!r.rowCount) {
            return res.status(400).json({ msg: "Não foi encontrado nenhum serviço!" });
        }
        return res.status(200).json({
            msg: "Serviços encontrados!",
            quantidade: r.rowCount,
            data: r.rows
        });
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
}); // OK

// Operação Exclusiva - Calcular o valor total de um funeral.
router.get("/valor-total/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            throw new Error("Informe um ID de funeral válido!");
        }

        const funeral = await db.query(`
            SELECT f.id, f.nome_falecido,  c.nome_primeiro,  c.nome_sobrenome
            FROM funeral f
            JOIN cliente c ON f.cpf_cliente = c.cpf
            WHERE f.id = $1`, [id]);

        if (!funeral.rowCount) {
            throw new Error("Funeral não encontrado!");
        }

        const servicos = await db.query(
            `SELECT
                s.id,
                s.nome,
                s.valor

             FROM servico_funeral sf

             JOIN servico s
                ON sf.id_servico = s.id

             WHERE sf.id_funeral = $1

             ORDER BY s.id`,
            [id]
        );

        if (!servicos.rowCount) {
            throw new Error("Este funeral não possui serviços associados!");
        }
        const valorTotal = await db.query(
            `SELECT SUM(s.valor) AS valor_total
            FROM servico_funeral sf
            JOIN servico s
                ON sf.id_servico = s.id

            WHERE sf.id_funeral = $1`, [id]);
        
        let total = valorTotal.rows[0].valor_total;

        if (total === null) {
            total = 0;
        }
        return res.status(200).json({
            msg: "Valor total calculado com sucesso!",

            id_funeral: funeral.rows[0].id,

            nome_falecido:
                funeral.rows[0].nome_falecido,

            contratante:
                funeral.rows[0].nome_primeiro + " " + funeral.rows[0].nome_sobrenome,

            quantidade_servicos:
                servicos.rowCount,

            servicos:
                servicos.rows,

            valor_total:
                total
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
}); // OK

// Operação Exclusiva - Buscar clientes - Quando não informar nome
router.get("/cliente", async (req, res) => {
    return res.status(400).json({ msg: "Informe o nome do serviço!"});
}); // OK

// Operação Exclusiva - Buscar clientes que contrataram determinado serviço através do nome do serviço.
router.get("/cliente/:nome", async (req, res, next) => {
    try {
        let nome = req.params.nome;

        if (!nome || !nome.trim() ) {
            throw new Error("Informe o nome do serviço!");
        }

        nome = nome.trim();
        const servico = await db.query("SELECT * FROM servico WHERE LOWER(nome) LIKE LOWER($1)", ["%" + nome + "%"]);
        
        if (!servico.rowCount) {
            throw new Error("Serviço não encontrado!");
        }
        
        const clientes = await db.query(
            `SELECT DISTINCT
                c.cpf,
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

            WHERE LOWER(s.nome) LIKE LOWER($1)

            ORDER BY c.nome_primeiro`,
            ["%" + nome + "%"]
        );

        
        if (!clientes.rowCount) {
            throw new Error("Nenhum cliente foi encontrado para esse serviço!");
        }

        return res.status(200).json({ msg: "Clientes encontrados com sucesso!",
            quantidade_servicos_encontrados: servico.rowCount,
            servicos_encontrados: servico.rows,
            quantidade_clientes: clientes.rowCount,
            clientes: clientes.rows });


    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
}); // OK

// Operação Excluisva - Quantos Funerais tal serviço já "participou"
router.get("/:id_servico/funerais/quantidade", async (req, res) => {
    try {
        const idServico = Number(req.params.id_servico);

        if (!Number.isInteger(idServico) || idServico <= 0) {
            return res.status(400).json({msg: "Informe um ID de serviço válido!"});
        }

        const servico = await db.query(`SELECT id, nome FROM servico WHERE id = $1`,[idServico]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        const funerais = await db.query(
            `SELECT
                f.id,
                f.nome_falecido

             FROM servico_funeral sf

             JOIN funeral f
                ON f.id = sf.id_funeral

             WHERE sf.id_servico = $1

             ORDER BY f.id`,
            [idServico]
        );

        return res.status(200).json({
            msg: "Consulta realizada com sucesso!",

            servico: {
                id: servico.rows[0].id,
                nome: servico.rows[0].nome
            },

            quantidade_funerais:
                funerais.rowCount,

            funerais:
                funerais.rows
        });

    } catch (error) {
        return res.status(500).json({msg: error.message});
    }
}); // OK

// GET pelo ID
router.get("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ msg: "ID inválido!" });
        }

        const r = await db.query("SELECT * FROM servico WHERE id = $1", [id]);
        if (!r.rowCount ) {
            return res.status(404).json({ msg: "Serviço não encontrado!" });
        }
        return res.status(200).json( {msg: "Serviço encontrado!",
            data: r.rows[0]});

    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
}); // OK
 
// POST
router.post("/", async (req, res, next) => {
    try {
        const { nome, valor } = req.body || {};

        let { descricao } = req.body || {};

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({ msg: "Nome do serviço é obrigatório!"});
        }

        const nomeTratado = nome.trim();

        if (nomeTratado.length > 35) {
            return res.status(400).json({msg : "O nome do serviço deve ter no máximo 35 caracteres!"});
        }

        if ( typeof valor !== "number" && typeof valor !== "string") {
            return res.status(400).json({ msg: "Informe um valor válido!"});
        }

        const valorNumerico = Number(valor)
        if (
            isNaN(valorNumerico) ||
            !isFinite(valorNumerico) ||
            valorNumerico <= 0 ||
            valorNumerico > 999999.99
        ) {
            return res.status(400).json({ msg: "Informe um valor válido entre 0,01 e 999999,99!"});
        }

        if (descricao !== undefined && descricao !== null) {

            if (typeof descricao !== "string") {
                return res.status(400).json({ msg: "Informe uma descrição válida!"});
            }

            descricao = descricao.trim();

            if (descricao && descricao.length > 100) {
                throw new Error("A descrição deve ter no máximo 100 caracteres!");
            }

            if (!descricao) {
                descricao = null;
            }

        } else {
            descricao = null;
        }
        const servicoEncontrado = await db.query(`SELECT * FROM servico WHERE LOWER(nome) = LOWER($1)`, [nomeTratado]);

        if (servicoEncontrado.rowCount) {
            return res.status(409).json({ msg: "Nome do serviço já existe!"});
        }

        const r = await db.query("INSERT INTO servico (valor, descricao, nome) VALUES ($1, $2, $3) RETURNING *", [Number(valor), descricao, nomeTratado]);

        if (!r.rowCount) {
            throw new Error("Serviço não foi adicionado");
        }

        return res.status(201).json({ msg: "Serviço adicionado com sucesso!", data: r.rows[0] });

    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
}); // OK

// DELETE 
router.delete("/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({msg: "ID inválido!"});
        }

        const servico = await db.query( "SELECT * FROM servico WHERE id = $1",[id]);

        if (!servico.rowCount) {
            return res.status(404).json({msg: "Serviço não encontrado!"});
        }

        const associacao = await db.query(
            `SELECT * FROM servico_funeral WHERE id_servico = $1`, [id] );

        if (associacao.rowCount === 1) {
            return res.status(400).json({ msg: "Este serviço está associado a um funeral!" });
        }

        if (associacao.rowCount  > 1) {
            return res.status(400).json({ msg: "Este serviço está associado a vários funerais!" });
        }

        const r = await db.query(  `DELETE FROM servico WHERE id = $1 RETURNING *`,[id] );

        return res.status(200).json({
            msg: "Serviço deletado com sucesso!",
            data: r.rows[0]
        });

    } catch (error) {
        console.log(error);

        return res.status(500).json({ msg: "Erro interno do servidor!" });
    }
}); // OK

// PUT 
router.put("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ msg: "ID inválido!" });
        }

        const servicoAtual = await db.query(
            `SELECT *
             FROM servico
             WHERE id = $1`,
            [id]
        );

        if (!servicoAtual.rowCount) {
            return res.status(404).json({
                msg: "Serviço não encontrado!"
            });
        }

        const { nome, valor } = req.body || {};

        let { descricao } = req.body || {};

        if (typeof nome !== "string" || !nome.trim()) {
            return res.status(400).json({ msg: "Nome do serviço é obrigatório!" });
        }

        const nomeTratado = nome.trim();

        if (nomeTratado.length > 35) {
            throw new Error("O nome do serviço deve ter no máximo 35 caracteres!");
        }

        if (
            typeof valor !== "number" &&
            typeof valor !== "string"
        ) {
            return res.status(400).json({msg: "Informe um valor válido!"});
        }

        const valorNumerico = Number(valor);
        if (
            isNaN(valorNumerico) ||
            !isFinite(valorNumerico) ||
            valorNumerico <= 0 ||
            valorNumerico > 999999.99
        ) {
            return res.status(400).json({
                msg: "Informe um valor válido entre 0,01 e 999999,99!"
            });
        }

        if (descricao !== undefined && descricao !== null) {

            if (typeof descricao !== "string") {
                return res.status(400).json({ msg: "Informe uma descrição válida!" });
            }

            descricao = descricao.trim();

            if (descricao && descricao.length > 100) {
                throw new Error("A descrição deve ter no máximo 100 caracteres!");
            }

            if (!descricao) {
                descricao = null;
            }

        } else {
            descricao = null;
        }

        const servicoEncontrado = await db.query(`SELECT * FROM servico WHERE LOWER(nome) = LOWER($1) AND id != $2`, [nomeTratado, id]);

        if (servicoEncontrado.rowCount) {
            return res.status(409).json({ msg: "Nome do serviço já existe!"});
        }

        const r = await db.query("UPDATE servico SET valor = $1, descricao = $2, nome = $3 WHERE id = $4 RETURNING*", [Number(valor), descricao, nomeTratado, id]);

        if (!r.rowCount) {
            throw new Error("Serviço não foi editado!");
        }
        return res.status(200).json({ msg: "Serviço editado com sucesso", data: r.rows[0] });
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
}); // OK

module.exports = router;