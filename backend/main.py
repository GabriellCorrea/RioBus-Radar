from fastapi import FastAPI # type: ignore
import requests
import pandas as pd
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import threading
import time
from fastapi.middleware.cors import CORSMiddleware # type: ignore

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# cache
dados_cache = []
linhas_cache = []

def atualizar_dados():

    global dados_cache, linhas_cache

    while True:

        try:

            agora = datetime.now(ZoneInfo("America/Sao_Paulo"))
            limite = agora - timedelta(minutes=5)

            data_final_str = agora.strftime("%Y-%m-%d+%H:%M:%S")
            data_inicial_str = limite.strftime("%Y-%m-%d+%H:%M:%S")

            url = f"https://dados.mobilidade.rio/gps/sppo?dataInicial={data_inicial_str}&dataFinal={data_final_str}"

            response = requests.get(url, timeout=10)

            if response.status_code != 200:
                print("Erro na API da prefeitura")
                time.sleep(30)
                continue

            dados = response.json()
            df = pd.DataFrame(dados)

            if df.empty:
                print("Sem dados")
                time.sleep(30)
                continue

            # converter timestamp
            df["datahora"] = pd.to_datetime(
                df["datahora"].astype("int64"),
                unit="ms",
                utc=True,
                errors="coerce"
            )

            df = df.dropna(subset=["datahora"])

            df["datahora"] = df["datahora"].dt.tz_convert("America/Sao_Paulo")

            # filtrar últimos 5 minutos
            df = df[df["datahora"] >= limite]

            # tratar coordenadas
            df["latitude"] = df["latitude"].str.replace(",", ".", regex=False).astype(float)
            df["longitude"] = df["longitude"].str.replace(",", ".", regex=False).astype(float)

            # velocidade
            df["velocidade"] = pd.to_numeric(df["velocidade"], errors="coerce").fillna(0)

            # ordenar
            df = df.sort_values("datahora")

            # limitar pontos por ônibus
            df = df.groupby("ordem").tail(30)

            # salvar cache
            dados_cache = df[
                ["ordem","linha","latitude","longitude","velocidade","datahora"]
            ].to_dict(orient="records")

            linhas_cache = sorted(df["linha"].astype(str).unique().tolist())

            print(f"Dados atualizados: {len(dados_cache)} ônibus")

        except Exception as e:
            print("Erro:", e)

        time.sleep(30)


@app.on_event("startup")
def iniciar_thread():

    thread = threading.Thread(target=atualizar_dados)
    thread.daemon = True
    thread.start()


@app.get("/")
def home():
    return {"mensagem": "API ônibus Rio funcionando"}


@app.get("/onibus")
def get_onibus():

    agora = datetime.now(ZoneInfo("America/Sao_Paulo"))
    inicio = agora - timedelta(minutes=5)

    return {
        "inicio_coleta": inicio.isoformat(),
        "fim_coleta": agora.isoformat(),
        "dados": dados_cache
    }


@app.get("/linhas")
def get_linhas():
    return linhas_cache