CREATE TABLE IF NOT EXISTS cliente(
    cpf VARCHAR(14) PRIMARY KEY,

    nome_primeiro VARCHAR(20) NOT NULL,
    nome_sobrenome VARCHAR(30) NOT NULL,

    endereco_CEP CHAR(10),
    endereco_rua VARCHAR(40),
    endereco_cidade VARCHAR(30),
    endereco_bairro VARCHAR(30),
    endereco_numero INTEGER,

    contato_email VARCHAR(40) NOT NULL UNIQUE,
    contato_telefone VARCHAR(14) NOT NULL,
    
    data_nascimento DATE,

    CONSTRAINT chk_cliente_cpf
        CHECK (cpf ~ '^[0-9]{11}$'),

    CONSTRAINT chk_cliente_contato_telefone
        CHECK ( contato_telefone IS NULL OR contato_telefone ~ '^[0-9]{10,11}$' ),

    CONSTRAINT chk_cliente_data_nascimento
        CHECK (data_nascimento >= DATE '1900-01-01'),

    CONSTRAINT chk_endereco_numero
        CHECK (endereco_numero IS NULL OR endereco_numero > 0)
);

CREATE TABLE IF NOT EXISTS funeral(
    id SERIAL PRIMARY KEY,
    duracao INTEGER NOT NULL,
    data_evento DATE NOT NULL,
    local VARCHAR(60) NOT NULL,

    nome_falecido VARCHAR(30) NOT NULL, 
    data_nascimento_falecido DATE NOT NULL,
    data_morte_falecido DATE NOT NULL,
    cpf_falecido VARCHAR(14) NOT NULL UNIQUE,

    cpf_cliente VARCHAR(14) NOT NULL,
    pagamento BOOLEAN NOT NULL,

    CONSTRAINT cpf_cliente_fk FOREIGN KEY (cpf_cliente)
        REFERENCES cliente (cpf)
        ON DELETE CASCADE,

    CONSTRAINT chk_duracao
        CHECK (duracao > 0),

    CONSTRAINT chk_cliente_cpf
        CHECK (cpf_cliente ~ '^[0-9]{11}$'),
    
    CONSTRAINT chk_falecido_cpf
        CHECK (cpf_falecido ~ '^[0-9]{11}$'),

    CONSTRAINT chk_data_evento
        CHECK (data_evento >= DATE '1900-01-01'),

    CONSTRAINT chk_data_nascimento_falecido
        CHECK (data_nascimento_falecido >= DATE '1900-01-01'),

    CONSTRAINT chk_data_morte_falecido
        CHECK (data_morte_falecido >= DATE '1900-01-01')
);

CREATE TABLE IF NOT EXISTS servico (
    id SERIAL PRIMARY KEY,
    valor DECIMAL(8,2) NOT NULL,
    descricao VARCHAR(100),
    nome VARCHAR(35) NOT NULL,

    CONSTRAINT chk_valor_servico CHECK (valor > 0)
);
    

CREATE TABLE IF NOT EXISTS servico_funeral (
    id_funeral INTEGER,
    id_servico INTEGER,

    CONSTRAINT pk_id_funeral_servico PRIMARY KEY (id_funeral, id_servico),

    CONSTRAINT fk_id_funeral FOREIGN KEY (id_funeral)
        REFERENCES funeral(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_id_servico FOREIGN KEY (id_servico)
        REFERENCES servico(id)
        ON DELETE CASCADE
);

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('12345678901', 'João', 'Silva', '13560000', 'Rua das Flores', 'São Carlos', 'Centro', 120, 'joao.silva@email.com', '16999990001', '1985-03-15');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento)  
VALUES ('23456789012', 'Maria', 'Oliveira', '13561000', 'Rua São Paulo', 'São Carlos', 'Vila Prado', 45, 'maria.oliveira@email.com', '16999990002', '1990-07-22');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('34567890123', 'Carlos', 'Santos', '13565000', 'Avenida Brasil', 'São Carlos', 'Jardim Paulista', 230, 'carlos.santos@email.com', '16999990003', '1978-11-08');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('45678901234', 'Ana', 'Souza', '13566000', 'Rua XV de Novembro', 'São Carlos', 'Centro', 78, 'ana.souza@email.com', '16999990004', '1995-01-30');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('56789012345', 'Pedro', 'Costa', '13567000', 'Rua das Palmeiras', 'São Carlos', 'Santa Felícia', 310, 'pedro.costa@email.com', '16999990005', '1982-06-12');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('67890123456', 'Juliana', 'Ferreira', '13568000', 'Avenida Getúlio Vargas', 'São Carlos', 'Vila Nery', 150, 'juliana.ferreira@email.com', '16999990006', '1988-09-25');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('78901234567', 'Lucas', 'Rodrigues', '13569000', 'Rua Major José Inácio', 'São Carlos', 'Centro', 95, 'lucas.rodrigues@email.com', '16999990007', '1998-04-18');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('89012345678', 'Fernanda', 'Almeida', '13570000', 'Rua Dona Alexandrina', 'São Carlos', 'Jardim São Paulo', 210, 'fernanda.almeida@email.com', '16999990008', '1986-12-03');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('90123456789', 'Ricardo', 'Gomes', '13571000', 'Avenida Trabalhador São-Carlense', 'São Carlos', 'Vila Costa do Sol', 65, 'ricardo.gomes@email.com', '16999990009', '1975-08-17');

INSERT INTO cliente ( cpf, nome_primeiro, nome_sobrenome, endereco_CEP, endereco_rua, endereco_cidade, endereco_bairro, endereco_numero, contato_email, contato_telefone, data_nascimento) 
VALUES ('01234567890', 'Camila', 'Martins', '13572000', 'Rua Episcopal', 'São Carlos', 'Centro', 180, 'camila.martins@email.com', '16999990010', '1992-02-28');

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    4, '2026-09-10', 'Cemitério Nossa Senhora do Carmo',
    'José Otavio', '1950-05-12', '2026-09-08',
    '11122233344', '12345678901', TRUE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    3, '2026-09-12', 'Cemitério Municipal',
    'Antônio Oliveira', '1948-11-20', '2026-09-10',
    '22233344455', '23456789012', FALSE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    5, '2026-09-15', 'Cemitério Santo Antônio',
    'Maria dos Santos', '1960-03-08', '2026-09-13',
    '33344455566', '34567890123', TRUE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    4, '2026-09-18', 'Cemitério Municipal',
    'Francisco Souza', '1955-07-25', '2026-09-16',
    '44455566677', '45678901234', FALSE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    3, '2026-09-20', 'Cemitério Parque da Paz',
    'Helena Costa', '1945-02-14', '2026-09-18',
    '55566677788', '56789012345', TRUE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    6, '2026-09-22', 'Cemitério Municipal',
    'Roberto Ferreira', '1952-09-30', '2026-09-20',
    '66677788899', '67890123456', FALSE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    4, '2026-09-25', 'Cemitério Jardim da Saudade',
    'Beatriz Rodrigues', '1965-04-18', '2026-09-23',
    '77788899900', '78901234567', TRUE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    5, '2026-09-27', 'Cemitério Municipal',
    'Paulo Almeida', '1958-12-10', '2026-09-25',
    '88899900011', '89012345678', FALSE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    3, '2026-09-29', 'Cemitério Parque das Acácias',
    'Lúcia Gomes', '1962-06-22', '2026-09-27',
    '99900011122', '90123456789', TRUE
);

INSERT INTO funeral (
    duracao, data_evento, local, nome_falecido,
    data_nascimento_falecido, data_morte_falecido,
    cpf_falecido, cpf_cliente, pagamento
)
VALUES (
    4, '2026-10-01', 'Cemitério Municipal',
    'Carlos Martins', '1957-08-05', '2026-09-29',
    '00011122233', '01234567890', FALSE
);

INSERT INTO servico (valor, descricao, nome) VALUES
(500.00, 'Preparação e conservação do corpo para o velório.', 'Tanatopraxia');

INSERT INTO servico (valor, descricao, nome) VALUES
(300.00, 'Preparação estética e cuidados com a aparência do falecido.', 'Tanatoestética');

INSERT INTO servico (valor, descricao, nome) VALUES
(800.00, 'Serviço de cremação do falecido.', 'Cremação');

INSERT INTO servico (valor, descricao, nome) VALUES
(1500.00, 'Fornecimento de urna funerária para o sepultamento.', 'Urna funerária');

INSERT INTO servico (valor, descricao, nome) VALUES
(400.00, 'Decoração e ornamentação do ambiente do velório.', 'Ornamentação');

INSERT INTO servico (valor, descricao, nome) VALUES
(250.00, 'Transporte do falecido até o local do velório ou sepultamento.', 'Transporte funerário');

INSERT INTO servico (valor, descricao, nome) VALUES
(350.00, 'Locação da sala para realização do velório.', 'Sala de velório');

INSERT INTO servico (valor, descricao, nome) VALUES
(200.00, 'Preparação e organização de flores para a cerimônia.', 'Coroa de flores');

INSERT INTO servico (valor, descricao, nome) VALUES
(450.00, 'Serviço de apoio e organização da cerimônia de despedida.', 'Cerimônia de despedida');

INSERT INTO servico (valor, descricao, nome) VALUES
(600.00, 'Serviço de traslado para transporte em longa distância.', 'Traslado');

INSERT INTO servico_funeral (id_funeral, id_servico) VALUES
(1, 1),
(1, 4),
(1, 5),
(1, 7),

(2, 1),
(2, 4),
(2, 6),

(3, 2),
(3, 4),
(3, 8),

(4, 1),
(4, 5),
(4, 7),

(5, 2),
(5, 6),
(5, 9),

(6, 1),
(6, 4),
(6, 6),
(6, 10),

(7, 2),
(7, 5),
(7, 8),

(8, 1),
(8, 4),
(8, 7),

(9, 2),
(9, 6),
(9, 9),

(10, 1),
(10, 4),
(10, 5),
(10, 7);