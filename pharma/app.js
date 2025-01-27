const express = require('express');
const app = express();
const http = require('http');
const mysql = require('mysql2');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Verifica se a pasta uploads/ existe
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('Pasta uploads/ criada com sucesso!');
}

// Configuração do banco de dados
const conexao = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Meliodas23!',
    database: 'pharma'
});

// Teste de conexão com o banco de dados
conexao.connect(function (erro) {
    if (erro) throw erro;
    console.log('Conexão com o banco de dados estabelecida!');
});

// Middleware para processar dados JSON e formulários
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração para servir arquivos estáticos da pasta uploads/
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do Multer para upload de imagens
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Diretório onde as imagens serão salvas
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName); // Nome único para evitar conflitos
    }
});
const upload = multer({ storage: storage });

// Endpoint para upload de imagem
app.post('/upload', upload.single('imagem'), (req, res) => {
    const imagemPath = `/uploads/${req.file.filename}`; // Caminho da imagem
    const descricao = req.body.descricao; // Descrição da imagem
    const nome = req.body.nome; // Nome do remédio
    const preco = parseFloat(req.body.preco); // Preço do remédio

    // Validação do preço
    if (isNaN(preco)) {
        return res.status(400).send('Preço inválido');
    }

    // Salva no banco de dados
    const sql = 'INSERT INTO imagens (caminho, descricao, nome, preco) VALUES (?, ?, ?, ?)';
    conexao.query(sql, [imagemPath, descricao, nome, preco], (erro, resultado) => {
        if (erro) {
            console.error('Erro ao salvar no banco de dados:', erro);
            return res.status(500).send('Erro ao salvar no banco de dados.');
        }

        // Redireciona para a página principal
        res.redirect('/');
    });
});

// Endpoint para remover imagem
app.post('/remover', (req, res) => {
    const descricao = req.body.descricao; // Descrição da imagem a ser removida

    // Busca o caminho da imagem no banco
    const sqlBusca = 'SELECT caminho FROM imagens WHERE descricao = ?';
    conexao.query(sqlBusca, [descricao], (erro, resultado) => {
        if (erro || resultado.length === 0) {
            console.error('Erro ao buscar imagem:', erro);
            return res.status(500).send('Erro ao buscar imagem no banco de dados.');
        }

        const caminhoImagem = resultado[0].caminho;

        // Remove o arquivo do sistema de arquivos
        fs.unlink(path.join(__dirname, caminhoImagem), (err) => {
            if (err) console.error('Erro ao excluir arquivo:', err);
        });

        // Remove do banco de dados
        const sqlRemove = 'DELETE FROM imagens WHERE descricao = ?';
        conexao.query(sqlRemove, [descricao], (erro) => {
            if (erro) {
                console.error('Erro ao remover do banco de dados:', erro);
                return res.status(500).send('Erro ao remover do banco de dados.');
            }

            // Redireciona para a página principal
            res.redirect('/');
        });
    });
});

// Endpoint principal para exibir a tela de farmácia
app.get('/', (req, res) => {
    const sql = 'SELECT * FROM imagens'; // Busca todas as imagens no banco

    conexao.query(sql, (erro, resultado) => {
        if (erro) {
            console.error('Erro ao buscar imagens:', erro);
            return res.status(500).send('Erro ao buscar imagens.');
        }

        // Gera o HTML dinâmico com as imagens
        let imagensHTML = resultado.map(imagem => {
            // Garantir que 'preco' seja tratado como número
            let precoFormatado = (typeof imagem.preco === 'number' && !isNaN(imagem.preco)) ? imagem.preco.toFixed(2) : 'Preço não disponível';

            return `<div class="card">
                        <img src="${imagem.caminho}" alt="Imagem" />
                        <p>${imagem.descricao}</p>
                        <p>Nome: ${imagem.nome}</p>
                        <p>Preço: R$ ${precoFormatado}</p>
                        <form action="/remover" method="POST">
                            <input type="hidden" name="descricao" value="${imagem.descricao}">
                            <button type="submit" class="btn-remover">Remover</button>
                        </form>
                    </div>`;
        }).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="pt-br">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Farmácia Profissional</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        background-color: #f8f9fa;
                        color: #333;
                    }
                    .container {
                        max-width: 1100px;
                        margin: 40px auto;
                        padding: 20px;
                        background-color: #fff;
                        border-radius: 8px;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    h1 {
                        text-align: center;
                        font-size: 2.5rem;
                        color: #007bff;
                        margin-bottom: 30px;
                    }
                    .form-container {
                        background-color: #007bff;
                        padding: 20px;
                        border-radius: 8px;
                        margin-bottom: 30px;
                        color: white;
                    }
                    .form-container h2 {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .form-container input,
                    .form-container button {
                        width: 100%;
                        padding: 12px;
                        margin-bottom: 10px;
                        border-radius: 5px;
                        border: 1px solid #ddd;
                        font-size: 1rem;
                    }
                    .form-container input[type="file"] {
                        cursor: pointer;
                    }
                    .form-container button {
                        background-color: #28a745;
                        color: white;
                        border: none;
                        cursor: pointer;
                    }
                    .form-container button:hover {
                        background-color: #218838;
                    }
                    .gallery {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .card {
                        background-color: white;
                        border: 1px solid #ddd;
                        border-radius: 8px;
                        overflow: hidden;
                        text-align: center;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }
                    .card img {
                        width: 100%;
                        height: 200px;
                        object-fit: cover;
                        border-bottom: 1px solid #ddd;
                    }
                    .card p {
                        padding: 10px;
                        font-size: 1rem;
                        color: #333;
                    }
                    .card .btn-remover {
                        background-color: #dc3545;
                        color: white;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 5px;
                        cursor: pointer;
                        margin-top: 10px;
                        width: 100%;
                    }
                    .card .btn-remover:hover {
                        background-color: #c82333;
                    }
                </style>
            </head>
            <body>

                <div class="container">
                    <h1>Farmácia Online</h1>

                    <div class="form-container">
                        <h2>Adicionar Novo Remédio</h2>
                        <form action="/upload" method="POST" enctype="multipart/form-data">
                            <input type="text" name="nome" placeholder="Nome do remédio" required />
                            <input type="text" name="descricao" placeholder="Descrição da imagem" required />
                            <input type="number" name="preco" placeholder="Preço do remédio" step="0.01" required />
                            <input type="file" name="imagem" accept="image/*" required />
                            <button type="submit">Adicionar Imagem</button>
                        </form>
                    </div>

                    <div class="gallery">
                        ${imagensHTML}
                    </div>
                </div>

            </body>
            </html>
        `);
    });
});

// Configuração do servidor HTTP
const PORT = 3000;
const server = http.createServer(app);
server.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
