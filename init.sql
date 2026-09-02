CREATE TABLE IF NOT EXISTS cliente(
    cpf VARCHAR(14) PRIMARY KEY,

    nome_primeiro VARCHAR(20) NOT NULL,
    nome_sobrenome VARCHAR(30) NOT NULL,

    endereco_CEP CHAR(10),
    endereco_rua VARCHAR(40),
    endereco_cidade VARCHAR(30),
    endereco_bairro VARCHAR(30),
    endereco_numero INTEGER,

    contato_email VARCHAR(40) NOT NULL,
    contato_telefone VARCHAR(14) NOT NULL,
    
    data_nascimento DATE,

    CONSTRAINT chk_cliente_cpf
        CHECK (cpf ~ '^[0-9]{11}$'),

    CONSTRAINT chk_cliente_contato_telefone
        CHECK ( contato_telefone IS NULL OR contato_telefone ~ '^[0-9]{10,11}$' ),

    CONSTRAINT chk_cliente_data_nascimento
        CHECK (data_nascimento >= DATE '1900-01-01')
);

CREATE TABLE IF NOT EXISTS funeral(
    id SERIAL PRIMARY KEY,
    duracao INTEGER,
    data_evento DATE NOT NULL,
    local VARCHAR(60) NOT NULL,

    nome_falecido VARCHAR(30) NOT NULL, 
    data_nascimento_falecido DATE NOT NULL,
    data_morte_falecido DATE NOT NULL,
    cpf_falecido VARCHAR(14) NOT NULL,

    cpf_cliente VARCHAR(14) NOT NULL,
    pagamento DECIMAL(8,2) NOT NULL,

    CONSTRAINT cpf_cliente_fk FOREIGN KEY (cpf_cliente)
        REFERENCES cliente (cpf),

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
    nome VARCHAR(35) NOT NULL
);
    

CREATE TABLE IF NOT EXISTS servico_funeral (
    id_funeral INTEGER,
    id_servico INTEGER,

    CONSTRAINT pk_id_funeral_servico PRIMARY KEY (id_funeral, id_servico),

    CONSTRAINT fk_id_funeral FOREIGN KEY (id_funeral)
        REFERENCES funeral(id),

    CONSTRAINT fk_id_servico FOREIGN KEY (id_servico)
        REFERENCES servico(id)
);