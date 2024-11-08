const express = require('express');
const router = express.Router();
const { sql, poolPromise } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

/**
 * @swagger
 * /api/vendas:
 *   get:
 *     summary: Retorna todas as vendas
 *     responses:
 *       200:
 *         description: Lista de vendas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   vendaId:
 *                     type: string
 *                   nomeCliente:
 *                     type: string
 *                   dataHora:
 *                     type: string
 *                     format: date-time
 *                   descricaoProduto:
 *                     type: string
 *                   valor:
 *                     type: number
 *                   tipoProduto:
 *                     type: string
 */
router.get('/', async (req, res) => {
    const { nomeCliente, dataVenda, tipoProduto } = req.query; // Inclui tipoProduto

    let query = 'SELECT * FROM Vendas';
    const conditions = [];

    // Adiciona filtros com validação apropriada
    if (nomeCliente) {
        conditions.push(`nomeCliente LIKE '%' + @nomeCliente + '%'`);
    }
    if (dataVenda) {
        const date = new Date(dataVenda).toISOString().split('T')[0]; // Formata para YYYY-MM-DD
        conditions.push(`CONVERT(date, dataHora) = @dataVenda`);
    }
    if (tipoProduto && tipoProduto !== '') { // Certifica-se de que tipoProduto não é vazio ou undefined
        conditions.push(`tipoProduto = @tipoProduto`);
    }

    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }

    try {
        const pool = await poolPromise;
        const request = pool.request();

        // Adiciona os parâmetros somente se eles existirem para evitar erros de SQL Injection
        if (nomeCliente) {
            request.input('nomeCliente', sql.NVarChar, nomeCliente);
        }
        if (dataVenda) {
            const date = new Date(dataVenda).toISOString().split('T')[0];
            request.input('dataVenda', sql.Date, date);
        }
        if (tipoProduto) {
            request.input('tipoProduto', sql.NVarChar, tipoProduto);
        }

        const result = await request.query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error('Erro ao buscar dados:', err.message);
        res.status(500).send({ message: err.message });
    }
});

/**
 * @swagger
 * /api/vendas:
 *   post:
 *     summary: Cria uma nova venda
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nomeCliente:
 *                 type: string
 *               dataHora:
 *                 type: string
 *                 format: date-time
 *               descricaoProduto:
 *                 type: string
 *               valor:
 *                 type: number
 *               tipoProduto:
 *                 type: string
 *     responses:
 *       201:
 *         description: Venda criada com sucesso
 *       500:
 *         description: Erro no servidor
 */
router.post('/', async (req, res) => {
    const { nomeCliente, dataHora, descricaoProduto, valor, tipoProduto, metodoPagamento } = req.body; // Inclui metodoPagamento
    const vendaId = uuidv4(); // Cria um GUID para o pedido de venda

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('vendaId', sql.UniqueIdentifier, vendaId)
            .input('nomeCliente', sql.NVarChar, nomeCliente)
            .input('dataHora', sql.DateTime, dataHora)
            .input('descricaoProduto', sql.NVarChar, descricaoProduto)
            .input('valor', sql.Decimal(10, 2), valor)
            .input('tipoProduto', sql.NVarChar, tipoProduto) // Adiciona tipoProduto
            .input('metodoPagamento', sql.NVarChar, metodoPagamento) // Adiciona metodoPagamento
            .query(`
                INSERT INTO Vendas (vendaId, nomeCliente, dataHora, descricaoProduto, valor, tipoProduto, metodoPagamento)
                VALUES (@vendaId, @nomeCliente, @dataHora, @descricaoProduto, @valor, @tipoProduto, @metodoPagamento)
            `);

        res.status(201).send({ message: 'Venda inserida com sucesso', vendaId });
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

/**
 * @swagger
 * /api/vendas/{vendaId}:
 *   delete:
 *     summary: Deleta uma venda pelo ID
 *     parameters:
 *       - in: path
 *         name: vendaId
 *         required: true
 *         description: ID da venda a ser deletada
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Venda deletada com sucesso
 *       404:
 *         description: Venda não encontrada
 *       500:
 *         description: Erro no servidor
 */
router.delete('/:vendaId', async (req, res) => {
    const { vendaId } = req.params;

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('vendaId', sql.UniqueIdentifier, vendaId)
            .query('DELETE FROM Vendas WHERE vendaId = @vendaId');

        if (result.rowsAffected[0] === 0) {
            res.status(404).send({ message: 'Venda não encontrada' });
        } else {
            res.status(200).send({ message: 'Venda deletada com sucesso' });
        }
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});

router.get('/estatisticas', async (req, res) => {
    const { dataInicio, dataFim } = req.query;

    if (!dataInicio || !dataFim) {
        return res.status(400).send({ message: 'Parâmetros dataInicio e dataFim são obrigatórios' });
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('dataInicio', sql.DateTime, new Date(dataInicio))
            .input('dataFim', sql.DateTime, new Date(dataFim))
            .query(`
                SELECT 
                    COUNT(*) AS totalVendas,
                    SUM(valor) AS totalFaturamento,
                    SUM(CASE WHEN tipoProduto = 'Roupas' THEN 1 ELSE 0 END) AS totalRoupas,
                    SUM(CASE WHEN tipoProduto = 'Outros' THEN 1 ELSE 0 END) AS totalOutros
                FROM Vendas
                WHERE dataHora BETWEEN @dataInicio AND @dataFim
            `);

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).send({ message: err.message });
    }
});


module.exports = router;
