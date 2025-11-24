#!/bin/bash

# Script de Deploy Automatizado
# Este script prepara o projeto para deploy

echo "🚀 Preparando projeto para deploy..."
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script na raiz do projeto"
    exit 1
fi

echo "${GREEN}✅ Diretório correto${NC}"
echo ""

# Verificar Git
if ! command -v git &> /dev/null; then
    echo "❌ Git não está instalado"
    exit 1
fi

echo "${GREEN}✅ Git encontrado${NC}"
echo ""

# Verificar se há mudanças não commitadas
if [ -n "$(git status --porcelain)" ]; then
    echo "${YELLOW}⚠️  Há mudanças não commitadas${NC}"
    echo ""
    echo "Deseja fazer commit agora? (s/n)"
    read -r response
    if [[ "$response" =~ ^[Ss]$ ]]; then
        echo ""
        echo "Digite a mensagem do commit:"
        read -r commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Preparar projeto para deploy"
        fi
        git add .
        git commit -m "$commit_message"
        echo "${GREEN}✅ Commit realizado${NC}"
    fi
else
    echo "${GREEN}✅ Nenhuma mudança pendente${NC}"
fi

echo ""
echo "📋 Checklist de Deploy:"
echo ""
echo "1. ✅ Arquivos de configuração criados"
echo "2. ✅ Código atualizado para produção"
echo ""
echo "📝 Próximos passos:"
echo ""
echo "1. Faça push para GitHub:"
echo "   ${YELLOW}git push origin main${NC}"
echo ""
echo "2. Escolha uma plataforma:"
echo "   - Railway + Vercel (recomendado)"
echo "   - Render (tudo em um lugar)"
echo ""
echo "3. Siga o guia em: ${GREEN}DEPLOY_AUTOMATICO.md${NC}"
echo ""
echo "🎉 Preparação concluída!"

