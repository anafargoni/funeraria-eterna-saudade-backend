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

// Operação Exclusiva - Buscar os serviços mais utilizados
router.get("/servicos/mais-utilizados", async (req, res, next) => {
    try {
        const r = await db.query(
            `SELECT
                s.id,
                s.nome,
                s.descricao,
                s.valor,
                COUNT(sf.id_servico) AS quantidade_utilizada

            FROM servico s

            JOIN servico_funeral sf
                ON s.id = sf.id_servico

            GROUP BY
                s.id,
                s.nome,
                s.descricao,
                s.valor

            ORDER BY quantidade_utilizada DESC`);

            if (!r.rowCount) {
                throw new Error("Nenhum serviço utilizado foi encontrado!");
            }
    
            return res.status(200).json({
                msg: "Serviços mais utilizados encontrados com sucesso!",
                data: r.rows
            });
    
        } catch (error) {
            return res.status(400).json({
                msg: error.message
            });
        }
});

// Operação Exclusiva - Buscar funerais em determinado periodo 
router.get("/periodo", async(req, res, next) => {
    try {
        const { inicio, fim } = req.query;

        if (inicio > fim) {
            throw new Error("A data inicial não pode ser maior que a data final!");
        }
        if(!inicio) {
            throw new Error("Informe a data inicial!");
        }
        if(!fim) {
            throw new Error("Informe a data final!");
        }

        const r = await db.query(
            `SELECT
                f.id,
                f.nome_falecido,
                f.data_evento,
                f.local,
                f.pagamento,

                c.nome_primeiro,
                c.nome_sobrenome

            FROM funeral f

            JOIN cliente c
                ON f.cpf_cliente = c.cpf

            WHERE f.data_evento BETWEEN $1 AND $2`,

            [inicio, fim]
        );

        if (!r.rowCount) {
            throw new Error("Nenhum funeral foi encontrado nesse período!")
        }

        return res.status(200).json({
            msg: "Funerais encontrados com sucesso!",
            data: r.rows
        });
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

// POST /cadastro - Cadastra um novo funeral e associa o cliente
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

        if (!Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
            throw new Error("Informe uma duração válida!");
        }

        if (!data_evento) {
            throw new Error("A data do evento é obrigatória!");
        }

        if (typeof local !== "string" || !local.trim()) {
            throw new Error("O local é obrigatório e deve ser informado como texto!");
        }

        if (typeof nome_falecido !== "string" || !nome_falecido.trim()) {
            throw new Error("O nome do falecido é obrigatório e deve ser informado como texto!");
        }

        const localTratado = local.trim();
        const nomeFalecidoTratado = nome_falecido.trim();

        if (localTratado.length > 60) {
            throw new Error("O local deve ter no máximo 60 caracteres!");
        }

        if (nomeFalecidoTratado.length > 30) {
            throw new Error("O nome do falecido deve ter no máximo 30 caracteres!");
        }

        if (!data_nascimento_falecido) {
            throw new Error("A data de nascimento do falecido é obrigatória!");
        }

        if (!data_morte_falecido) {
            throw new Error("A data da morte do falecido é obrigatória!");
        }

        // Valida a ordem das datas
        if (data_nascimento_falecido > data_morte_falecido) {
            throw new Error(
                "A data de nascimento não pode ser posterior à data da morte!"
            );
        }

        if (data_morte_falecido > data_evento) {
            throw new Error(
                "A data da morte não pode ser posterior à data do funeral!"
            );
        }

        if (!cpf_falecido) {
            throw new Error("O CPF do falecido é obrigatório!");
        }

        if (!cpf_cliente) {
            throw new Error("O CPF do cliente é obrigatório!");
        }

        const cpfFalecidoTratado = tratarCpf(cpf_falecido);
        const cpfClienteTratado = tratarCpf(cpf_cliente);

        const cliente = await db.query(
            "SELECT cpf FROM cliente WHERE cpf = $1",
            [cpfClienteTratado]
        );

        if (!cliente.rowCount) {
            throw new Error("Cliente não encontrado!");
        }

        if (typeof pagamento !== "boolean") {
            throw new Error("O pagamento deve ser verdadeiro ou falso!");
        }

        const r = await db.query(
            `INSERT INTO funeral
            ( duracao, data_evento, local, nome_falecido, data_nascimento_falecido, data_morte_falecido, cpf_falecido, cpf_cliente, pagamento)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING*`,
            [   Number(duracao),
                data_evento,
                localTratado,
                nomeFalecidoTratado,
                data_nascimento_falecido,
                data_morte_falecido,
                cpfFalecidoTratado,
                cpfClienteTratado,
                pagamento 
            ]
        );

        if(!r.rowCount) {
            throw new Error("Funeral não adicionado!");
        } return res.status(201).json({ msg: "Funeral adicionado com sucesso!", data: r.rows[0]});
        

    } catch (error) {
        return res.status(400).json({ msg: error.message})
    }

});

//PUT /funerais/:id
router.put("/:id", async(req, res, next) => {
    try{
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0 ) {
            throw new Error("Informe um ID válido!");
        }

        const {
            duracao,
            data_evento,
            local,
            nome_falecido,
            data_nascimento_falecido,
            data_morte_falecido,
            cpf_falecido,
            cpf_cliente,
            pagamento} = req.body || {};

            if (!Number.isInteger(Number(duracao)) || Number(duracao) <= 0) {
                throw new Error("Informe uma duração válida!");
            }
            
            if (!data_evento) {
                throw new Error("A data do evento é obrigatória!");
            }
            
            if (typeof local !== "string" || !local.trim()) {
                throw new Error("O local é obrigatório e deve ser informado como texto!");
            }

            if (typeof nome_falecido !== "string" || !nome_falecido.trim()) {
                throw new Error("O nome do falecido é obrigatório e deve ser informado como texto!");
            }

            const localTratado = local.trim();
            const nomeFalecidoTratado = nome_falecido.trim();

            if (localTratado.length > 60) {
                throw new Error("O local deve ter no máximo 60 caracteres!");
            }

            if (nomeFalecidoTratado.length > 30) {
                throw new Error("O nome do falecido deve ter no máximo 30 caracteres!");
            }
            
            if (!data_nascimento_falecido) {
                throw new Error("A data de nascimento do falecido é obrigatória!");
            }
            
            if (!data_morte_falecido) {
                throw new Error("A data de morte do falecido é obrigatória!");
            }
            
            // Valida a ordem das datas
            if (data_nascimento_falecido > data_morte_falecido) {
                throw new Error(
                    "A data de nascimento não pode ser posterior à data da morte!"
                );
            }

            if (data_morte_falecido > data_evento) {
                throw new Error(
                    "A data da morte não pode ser posterior à data do funeral!"
                );
            }

            if (!cpf_falecido) {
                throw new Error("O CPF do falecido é obrigatório!");
            }
            
            if (!cpf_cliente) {
                throw new Error("O CPF do cliente é obrigatório!");
            }
            
            const cpfFalecidoTratado = tratarCpf(cpf_falecido);
            const cpfClienteTratado = tratarCpf(cpf_cliente);

            const cliente = await db.query(
                "SELECT cpf FROM cliente WHERE cpf = $1",
                [cpfClienteTratado]
            );

            if (!cliente.rowCount) {
                throw new Error("Cliente não encontrado!");
            }

            if (typeof pagamento !== "boolean") {
                throw new Error("O pagamento deve ser verdadeiro ou falso!");
            }

            const r = await db.query(
                `UPDATE funeral
                SET
                    duracao = $1,
                    data_evento = $2,
                    local = $3,
                    nome_falecido = $4,
                    data_nascimento_falecido = $5,
                    data_morte_falecido = $6,
                    cpf_falecido = $7,
                    cpf_cliente = $8,
                    pagamento = $9
            
                WHERE id = $10
                RETURNING *`,
                [
                    Number(duracao),
                    data_evento,
                    localTratado,
                    nomeFalecidoTratado,
                    data_nascimento_falecido,
                    data_morte_falecido,
                    cpfFalecidoTratado,
                    cpfClienteTratado,
                    pagamento,
                    id
                ]
            );

            if (!r.rowCount) {
                throw new Error("Funeral não encontrado!");
            } return res.status(200).json({
                msg: "Funeral editado com sucesso!",
                data: r.rows[0]
            });
            
        } catch (error) {
            return res.status(400).json({
                msg: error.message
            });
        }
});

// DELETE /funerais/ :id 
router.delete("/:id", async (req, res, next) => {
    try {
        const id = Number(req.params.id)

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ msg : "ID inválido!"})
        }
        const r = await db.query("DELETE FROM Funeral WHERE id = $1 RETURNING*", [id]);
        
        if (!r.rowCount) {
            return res.status(404).json({ msg: "Funeral não encontrado!" });
        }

        return res.status(200).json({ msg: "Funeral deletado com sucesso!", data: r.rows[0] });
    } catch (error) {
        return res.status(400).json({ msg: error.message });
    }
});

module.exports = router;