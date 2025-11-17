# 🔧 Troubleshooting - Problemas com Upload

## Problemas Comuns e Soluções

### 1. Erro: "Erro de conexão! Verifique se o servidor backend está rodando"

**Causa**: O servidor backend não está rodando.

**Solução**:
```bash
# Abra um terminal e execute:
cd server
npm run dev

# Você deve ver:
# 🚀 Servidor rodando na porta 5001
# 📡 API disponível em http://localhost:5001
```

### 2. Erro: "Port 5001 already in use" ou "EADDRINUSE"

**Causa**: A porta 5001 já está sendo usada por outro processo.

**Solução**:
```bash
# Opção 1: Encerrar o processo na porta 5001
# No Mac/Linux:
lsof -ti:5001 | xargs kill -9

# No Windows:
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Opção 2: Usar outra porta
# Edite server/.env:
PORT=5002

# E atualize client/src/components/UploadPage.js e Dashboard.js:
# Mude 'http://localhost:5001' para 'http://localhost:5002'
```

**Nota**: A porta padrão foi alterada de 5000 para 5001 porque no macOS a porta 5000 é usada pelo AirPlay Receiver.

### 3. Erro: "Servidor não respondeu"x`x`x`

**Causa**: Backend travado ou timeout.

**Solução**:
1. Pare o servidor backend (Ctrl+C)
2. Reinicie: `cd server && npm run dev`
3. Verifique os logs do terminal
4. Tente novamente o upload

### 4. Erro: "Arquivo muito grande"

**Causa**: Imagem maior que 10MB.

**Solução**:
- Reduza o tamanho da imagem
- Use ferramentas online para comprimir
- Converta para formato mais compacto (JPG em vez de PNG)

### 5. Erro: "Tipo de arquivo inválido"

**Causa**: Arquivo não é uma imagem suportada.

**Solução**:
- Use apenas: JPG, PNG, GIF, WEBP
- Verifique a extensão do arquivo
- Se necessário, converta o arquivo

### 6. Upload trava no "Processando imagem..."

**Causa**: OCR está demorando muito (pode levar 30-60 segundos).

**Solução**:
- Aguarde (pode levar até 2 minutos)
- Verifique o console do backend para ver o progresso
- Imagens muito grandes ou complexas demoram mais
- Se travar completamente, recarregue a página e tente com imagem menor

### 7. Erro de CORS (Cross-Origin)

**Causa**: Configuração de CORS incorreta.

**Solução**: Já configurado no código, mas se persistir:
```javascript
// server/index.js já tem:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### 8. Nenhum erro, mas nada acontece

**Causa**: Arquivo enviado mas não processado corretamente.

**Solução**:
1. Abra o Console do navegador (F12)
2. Verifique mensagens de erro
3. Verifique o terminal do backend
4. Veja os logs de upload

## Verificação Passo a Passo

### ✅ Checklist de Diagnóstico

1. **Backend está rodando?**
   ```bash
   curl http://localhost:5001/api/health
   # Deve retornar: {"status":"OK","message":"Servidor rodando"}
   ```

2. **Frontend está rodando?**
   - Acesse: http://localhost:3000
   - Deve ver a tela de upload

3. **Dependências instaladas?**
   ```bash
   # Backend
   cd server
   npm install
   
   # Frontend
   cd client
   npm install
   ```

4. **Portas livres?**
   - Backend: 5001 (padrão, pode ser alterado no .env)
   - Frontend: 3000

5. **Arquivo válido?**
   - É uma imagem? (JPG, PNG, GIF, WEBP)
   - Tamanho < 10MB?
   - Arquivo não está corrompido?

## Logs para Debug

### No Navegador (F12 → Console)
- Mensagens de erro detalhadas
- Status da requisição
- Informações do arquivo

### No Terminal do Backend
- Logs de requisições recebidas
- Progresso do OCR
- Erros do servidor

## Exemplo de Logs Normais

### Backend (Terminal)
```
2024-01-15T10:30:00.000Z - POST /api/upload
Upload recebido: { filename: '1234567890-boletim.jpg', size: 245678, mimetype: 'image/jpeg' }
Processando OCR...
OCR Progress: 25%
OCR Progress: 50%
OCR Progress: 75%
OCR Progress: 100%
OCR concluído. Texto extraído: BOLETIM ESCOLAR...
```

### Frontend (Console do Navegador)
```
Enviando arquivo: boletim.jpg 245678 bytes
Resposta recebida: {success: true, dados: {...}}
```

## Se Nada Funcionar

1. **Reinicie tudo**:
   ```bash
   # Parar backend e frontend
   # Ctrl+C em ambos os terminais
   
   # Reiniciar
   npm run dev
   ```

2. **Limpe cache**:
   - Navegador: Ctrl+Shift+R (hard refresh)
   - Node: `rm -rf node_modules package-lock.json && npm install`

3. **Verifique versões**:
   ```bash
   node --version  # Deve ser 16+
   npm --version
   ```

4. **Teste com curl** (para verificar backend):
   ```bash
   curl http://localhost:5001/api/health
   ```

## Suporte Adicional

Se o problema persistir:
1. Copie a mensagem de erro exata
2. Copie os logs do terminal do backend
3. Copie os logs do console do navegador (F12)
4. Verifique a versão do Node.js e npm

## Dicas de Performance

- Use imagens menores para upload mais rápido
- JPG comprime melhor que PNG
- OCR funciona melhor com imagens nítidas
- Resolução ideal: 300-600 DPI

---

**Última atualização**: Sistema com logs detalhados e tratamento de erros melhorado.

