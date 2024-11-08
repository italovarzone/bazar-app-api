CREATE TABLE Vendas (
    vendaId UNIQUEIDENTIFIER PRIMARY KEY,
    nomeCliente NVARCHAR(255) NOT NULL,
    dataHora DATETIME NOT NULL,
    descricaoProduto NVARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    tipoProduto NVARCHAR(50) NOT NULL,
    metodoPagamento NVARCHAR(50) NOT NULL -- Adiciona metodoPagamento
);
