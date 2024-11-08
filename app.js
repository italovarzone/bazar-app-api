const express = require('express');
const vendasRoutes = require('./routes/vendas');
const utilsRoutes = require('./routes/utils'); // Importa as rotas utilitárias
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
require('dotenv').config();
const axios = require('axios'); // Biblioteca para fazer requisições HTTP

const app = express();
const PORT = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());

// Middleware para interpretar JSON
app.use(express.json());

// Configuração do Swagger
const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Bazar App API',
            version: '1.0.0',
            description: 'API para gerenciar vendas do Bazar App',
        },
        servers: [
            {
                url: `https://bazar-api-3ljg.onrender.com:${PORT}`,
            },
        ],
    },
    apis: ['./routes/*.js'], // Caminho para os arquivos que contém as rotas com comentários Swagger
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Rotas para o módulo de vendas
app.use('/api/vendas', vendasRoutes);
// Rotas utilitárias
app.use('/api', utilsRoutes);

// Configuração para realizar uma requisição GET ao endpoint a cada 5 minutos
setInterval(async () => {
    try {
        const response = await axios.get(`https://bazar-api-3ljg.onrender.com/api/status`);
        console.log('Status da API:', response.data.status);
    } catch (error) {
        console.error('Erro ao verificar status da API:', error.message);
    }
}, 5 * 60 * 1000); // 5 minutos em milissegundos

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
