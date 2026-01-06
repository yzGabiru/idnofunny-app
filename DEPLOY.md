# 🚀 Deploy do IDNOFunny na Vercel

## 📋 Pré-requisitos

1. Conta na [Vercel](https://vercel.com)
2. Backend da API já em produção
3. Repositório Git (GitHub, GitLab ou Bitbucket)

## 🔧 Configuração Local

### 1. Criar arquivo `.env.local`

Copie o arquivo `.env.example` e crie um `.env.local`:

```bash
cp .env.example .env.local
```

Edite o `.env.local` e configure a URL da sua API:

```env
VITE_API_BASE_URL=https://sua-api-backend.com
```

### 2. Testar localmente

```bash
npm install
npm run dev
```

Abra http://localhost:5173 e verifique se está conectando com a API.

## 🌐 Deploy na Vercel

### Opção 1: Via Dashboard (Recomendado)

1. **Acesse**: https://vercel.com/new
2. **Importe seu repositório** Git
3. **Configure o projeto**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **⚠️ IMPORTANTE: Configure a variável de ambiente**
   - Vá em: **Settings → Environment Variables**
   - Adicione:
     - **Name**: `VITE_API_BASE_URL`
     - **Value**: `https://sua-api-backend.com` (URL do seu backend em produção)
     - **Environment**: Selecione `Production`, `Preview` e `Development`
   - Clique em **Save**

5. **Deploy**:
   - Clique em **Deploy**
   - Aguarde o build finalizar (2-5 minutos)

### Opção 2: Via CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel

# Configurar variável de ambiente
vercel env add VITE_API_BASE_URL production
# Digite: https://sua-api-backend.com

# Fazer deploy de produção
vercel --prod
```

## 🔄 Redeploy após atualizar variáveis

Sempre que alterar variáveis de ambiente na Vercel, faça um novo deploy:

1. Vá em **Deployments**
2. Clique nos 3 pontos do último deploy
3. Clique em **Redeploy**

## ✅ Verificação Pós-Deploy

Após o deploy, teste:

1. **Página inicial carrega** ✓
2. **Login funciona** ✓
3. **Imagens aparecem** ✓
4. **Comentários funcionam** ✓
5. **Upload de memes funciona** ✓

## 🔍 Debug de Problemas

### Problema: "Failed to fetch" ou erros de CORS

**Solução**: Configure CORS no backend para aceitar a URL da Vercel:

```python
# No backend FastAPI
origins = [
    "http://localhost:5173",
    "https://seu-app.vercel.app",  # Adicione sua URL da Vercel
]
```

### Problema: Rotas retornam 404

**Solução**: O arquivo `vercel.json` já está configurado para redirecionar todas as rotas para `index.html`.

### Problema: Variáveis de ambiente não funcionam

**Verifique**:
1. Nome correto: `VITE_API_BASE_URL` (com prefixo `VITE_`)
2. Sem barra no final da URL
3. Fez redeploy após adicionar a variável

### Problema: Imagens não carregam

**Verifique**:
1. URL da API está correta
2. Backend está retornando URLs completas ou relativas
3. CORS está configurado no backend

## 📝 Checklist de Deploy

- [ ] Backend em produção funcionando
- [ ] `.env.example` criado
- [ ] `vercel.json` configurado
- [ ] Repositório Git atualizado
- [ ] Projeto importado na Vercel
- [ ] Variável `VITE_API_BASE_URL` configurada
- [ ] CORS configurado no backend
- [ ] Primeiro deploy realizado
- [ ] Testado login e funcionalidades
- [ ] URL customizada configurada (opcional)

## 🎯 URLs Importantes

- **Dashboard Vercel**: https://vercel.com/dashboard
- **Documentação Vercel**: https://vercel.com/docs
- **Variáveis de Ambiente**: https://vercel.com/docs/concepts/projects/environment-variables

## 📞 Suporte

Se precisar de ajuda:
- Documentação Vercel: https://vercel.com/docs
- Discord Vercel: https://vercel.com/discord
- Stack Overflow: https://stackoverflow.com/questions/tagged/vercel

---

**🎉 Bom deploy!**
