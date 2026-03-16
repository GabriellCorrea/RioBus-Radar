# 🚌 RioBus Radar

Aplicação web para **monitoramento de ônibus em tempo real no Rio de Janeiro**, utilizando dados públicos de mobilidade urbana e visualização interativa em mapa.

O sistema coleta dados de GPS dos ônibus, processa essas informações no backend e exibe no mapa o **trajeto recente, velocidade e posição atual dos veículos**.

---

## 🔗 Links do Projeto

**Frontend:**
https://onibus-rio.vercel.app

**API:**
https://riobusradar-api.onrender.com

---

## 📊 Fonte dos dados

Os dados são obtidos da API pública de mobilidade da prefeitura do Rio de Janeiro:

https://dados.mobilidade.rio/gps/sppo

Essas informações incluem:

* linha do ônibus
* coordenadas GPS
* velocidade
* horário da coleta
* identificador do veículo

---

## ⚙️ Arquitetura

O projeto é dividido em duas partes:

### Backend

Responsável por coletar e processar os dados.

Tecnologias:

* Python
* FastAPI
* Pandas
* Requests

Funções principais:

* coleta dados da API da prefeitura
* filtra registros dos **últimos 5 minutos**
* trata coordenadas e velocidade
* mantém os dados em cache
* disponibiliza endpoints para o frontend

Endpoints:

```
GET /onibus
GET /linhas
```

---

### Frontend

Interface para visualização dos ônibus em mapa interativo.

Tecnologias:

* React
* Vite
* Leaflet
* React Leaflet

Funcionalidades:

* visualização dos ônibus em tempo real
* exibição do trajeto recente dos veículos
* busca por linha
* indicadores de velocidade média e quantidade de ônibus
* atualização automática dos dados

---

## 🔄 Atualização de dados

O backend coleta novas informações a cada **30 segundos**, mantendo apenas os registros dos **últimos 5 minutos**.

---

## 🚀 Deploy

Frontend hospedado na **Vercel**
Backend hospedado no **Render**
