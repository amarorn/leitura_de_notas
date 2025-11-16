#!/bin/bash
# Script para rodar o servidor Python

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "❌ Ambiente virtual não encontrado."
    echo "📦 Execute: ./setup.sh ou npm run setup:python"
    exit 1
fi

source venv/bin/activate
python main.py

