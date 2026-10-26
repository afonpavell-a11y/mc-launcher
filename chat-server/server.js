const { WebSocketServer } = require('ws');
const http = require('http');

// Render сам задаёт порт через переменную окружения PORT
const PORT = process.env.PORT || 8080;

// Создаём HTTP-сервер (Render требует, чтобы приложение слушало порт)
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Chat server is running\n');
});

// Привязываем WebSocket к этому HTTP-серверу
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Клиент подключился');

  ws.on('message', (data) => {
    // Рассылаем сообщение всем подключённым клиентам
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 = OPEN
        client.send(data.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Клиент отключился');
  });
});

// Важно: слушаем на 0.0.0.0, чтобы Render мог достучаться
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Чат-сервер запущен на порту ${PORT}`);
});