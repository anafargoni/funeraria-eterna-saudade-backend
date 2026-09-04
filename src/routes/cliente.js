const express = require("express");
const router = express.Router();
const db = require("../db");

// Função para tratar CPF
function tratarCpf(cpf) {
    if (!cpf || typeof cpf !== "string") {
        throw new Error("CPF é obrigatório e deve ser informado como texto!");
    }

    const cpfTratado = cpf
        .replaceAll(".", "")
        .replaceAll("-", "");

    if (cpfTratado.length != 11 || isNaN(cpfTratado)) {
        throw new Error("Informe um CPF válido!");
    }

    return cpfTratado;
}

// Função para tratar telefone
function tratarTelefone(telefone) {
    if (!telefone || typeof telefone !== "string") {
        throw new Error("Telefone é obrigatório e deve ser informado como texto!");
    }

    const telefoneTratado = telefone
        .replaceAll("(", "")
        .replaceAll(")", "")
        .replaceAll("-", "")
        .replaceAll(" ", "");

    if (
        (telefoneTratado.length != 10 && telefoneTratado.length != 11) ||
        isNaN(telefoneTratado)
    ) {
        throw new Error("Informe um telefone válido!");
    }

    return telefoneTratado;
}

// Função para tratar CEP
function tratarCep(cep) {
    if (!cep) {
        return null;
    }
    
    if (typeof cep !== "string") {
        throw new Error("Informe um CEP válido!");
    }
    
    const cepTratado = cep.replaceAll("-", "").trim();

    if (cepTratado.length != 8 || isNaN(cepTratado)) {
        throw new Error("Informe um CEP válido!");
    }

    return cepTratado;
}

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
        const cpf = tratarCpf(req.params.cpf);

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

// Associação Cliente → Funeral
// A associação acontece ao criar um funeral, pois o funeral possui o campo cpf_cliente.
// A associação também pode ser alterada ao editar o funeral, trocando o cpf_cliente.

// Desassociação Cliente → Funeral
// Não é permitida a existência de um funeral sem cliente associado.
// Portanto, não existe uma rota específica para desassociação.
// Caso o cliente seja removido, os funerais associados também devem ser removidos conforme a regra definida no banco.

// GET pelo CPF
router.get("/:cpf", async (req, res, next) => {
    try {
        const cpf = tratarCpf(req.params.cpf);
        const r = await db.query("SELECT * FROM cliente WHERE cpf = $1", [cpf]);

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

        const cpfTratado = tratarCpf(cpf);
        
        const clienteEncontrado = await db.query(
            "SELECT * FROM cliente WHERE cpf = $1", [cpfTratado]
        );
        
        if (clienteEncontrado.rowCount) {
            throw new Error("CPF já cadastrado!");
        }

        if (!nome_primeiro || !nome_primeiro.trim()) {
            throw new Error("Nome é obrigatório!");
        }
        
        if (!nome_sobrenome || !nome_sobrenome.trim()) {
            throw new Error("Sobrenome é obrigatório!");
        }
        
        if (!contato_email || !contato_email.trim()) {
            throw new Error("Email é obrigatório!");
        }
        
        const nomeTratado = nome_primeiro.trim();
        if (nomeTratado.length > 20) {
            throw new Error("Nome deve ter no máximo 20 caracteres!");
        }

        const sobrenomeTratado = nome_sobrenome.trim();
        if (sobrenomeTratado.length > 30) {
            throw new Error("Sobrenome deve ter no máximo 30 caracteres!");
        }

        const emailTratado = contato_email.trim();
        
        if (
            !emailTratado.includes("@") ||
            !emailTratado.includes(".") ||
            emailTratado.startsWith("@") ||
            emailTratado.endsWith("@")
        ) {
            throw new Error("Informe um email válido!");
        }
        
        if (emailTratado.length > 40) {
            throw new Error("Email deve ter no máximo 40 caracteres!");
        }
        
        const telefoneTratado = tratarTelefone(contato_telefone);

        if (data_nascimento && data_nascimento < "1900-01-01") {
            throw new Error("Informe uma data de nascimento válida!");
        }
        
        const hoje = new Date().toISOString().split("T")[0];
        
        if (data_nascimento && data_nascimento > hoje) {
            throw new Error("A data de nascimento não pode estar no futuro!");
        }

        const cepTratado = tratarCep(endereco_CEP);

        const ruaTratada = endereco_rua ? endereco_rua.trim() : null;
        if (ruaTratada && ruaTratada.length > 40) {
            throw new Error("Rua deve ter no máximo 40 caracteres!");
        }
        
        const cidadeTratada = endereco_cidade ? endereco_cidade.trim() : null;
        if (cidadeTratada && cidadeTratada.length > 30) {
            throw new Error("Cidade deve ter no máximo 30 caracteres!");
        }
        
        const bairroTratado = endereco_bairro ? endereco_bairro.trim() : null;
        if (bairroTratado && bairroTratado.length > 30) {
            throw new Error("Bairro deve ter no máximo 30 caracteres!");
        }
        
        if (endereco_numero !== undefined && endereco_numero !== null && endereco_numero !== "") {
            if (isNaN(endereco_numero) || !Number.isInteger(Number(endereco_numero)) || Number(endereco_numero) <= 0) {
                throw new Error("Informe um número de endereço válido!");
            }
        }

        const r = await db.query(
            `INSERT INTO cliente 
            (cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
            [
                cpfTratado,
                nomeTratado,
                sobrenomeTratado,
                cepTratado,
                ruaTratada,
                cidadeTratada,
                bairroTratado,
                endereco_numero,
                emailTratado,
                telefoneTratado,
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
        const cpf = tratarCpf(req.params.cpf);

        const r = await db.query(
            "DELETE FROM cliente WHERE cpf = $1 RETURNING *", [cpf]
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
        const cpf = tratarCpf(req.params.cpf);

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

        if (!nome_primeiro || !nome_primeiro.trim()) {
            throw new Error("Nome é obrigatório!");
        }
        
        if (!nome_sobrenome || !nome_sobrenome.trim()) {
            throw new Error("Sobrenome é obrigatório!");
        }
        
        if (!contato_email || !contato_email.trim()) {
            throw new Error("Email é obrigatório!");
        }
        
        const nomeTratado = nome_primeiro.trim();
        if (nomeTratado.length > 20) {
            throw new Error("Nome deve ter no máximo 20 caracteres!");
        }

        const sobrenomeTratado = nome_sobrenome.trim();
        if (sobrenomeTratado.length > 30) {
            throw new Error("Sobrenome deve ter no máximo 30 caracteres!");
        }

        const emailTratado = contato_email.trim();

        if (
            !emailTratado.includes("@") ||
            !emailTratado.includes(".") ||
            emailTratado.startsWith("@") ||
            emailTratado.endsWith("@")
        ) {
            throw new Error("Informe um email válido!");
        }
        if (emailTratado.length > 40) {
            throw new Error("Email deve ter no máximo 40 caracteres!");
        }

        const telefoneTratado = tratarTelefone(contato_telefone);

        if (data_nascimento && data_nascimento < "1900-01-01") {
            throw new Error("Informe uma data de nascimento válida!");
        }
        
        const hoje = new Date().toISOString().split("T")[0];
        
        if (data_nascimento && data_nascimento > hoje) {
            throw new Error("A data de nascimento não pode estar no futuro!");
        }

        const cepTratado = tratarCep(endereco_CEP);

        const ruaTratada = endereco_rua ? endereco_rua.trim() : null;
        if (ruaTratada && ruaTratada.length > 40) {
            throw new Error("Rua deve ter no máximo 40 caracteres!");
        }
        
        const cidadeTratada = endereco_cidade ? endereco_cidade.trim() : null;
        if (cidadeTratada && cidadeTratada.length > 30) {
            throw new Error("Cidade deve ter no máximo 30 caracteres!");
        }
        
        const bairroTratado = endereco_bairro ? endereco_bairro.trim() : null;
        if (bairroTratado && bairroTratado.length > 30) {
            throw new Error("Bairro deve ter no máximo 30 caracteres!");
        }

        if (endereco_numero !== undefined && endereco_numero !== null && endereco_numero !== "") {
            if (isNaN(endereco_numero) || !Number.isInteger(Number(endereco_numero)) || Number(endereco_numero) <= 0) {
                throw new Error("Informe um número de endereço válido!");
            }
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
                nomeTratado,
                sobrenomeTratado,
                cepTratado,
                ruaTratada,
                cidadeTratada,
                bairroTratado,
                endereco_numero,
                emailTratado,
                telefoneTratado,
                data_nascimento,
                cpf
            ]
        );

        if (!r.rowCount) {
            throw new Error("Cliente não encontrado!");
        }

        return res.status(200).json({
            msg: "Cliente editado",
            data: r.rows[0]
        });

    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

module.exports = router;