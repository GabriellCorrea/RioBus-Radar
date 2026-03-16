import { useEffect, useState, useRef } from "react"
import { MapContainer, TileLayer, Polyline, CircleMarker, useMap, Tooltip, Marker } from "react-leaflet"
import L from "leaflet"
import { Bus, Gauge, Clock, ClockArrowUp, Search } from "lucide-react"
import "leaflet/dist/leaflet.css"
import "./App.css"

function criarIconeBus(cor){

return L.divIcon({
html: `
<div style="
width:24px;
height:24px;
background:white;
border-radius:50%;
display:flex;
align-items:center;
justify-content:center;
border:2px solid ${cor};
">

<svg width="14" height="14" viewBox="0 0 24 24" fill="${cor}">
<path d="M4 16c0 .88.39 1.67 1 2.22V20a1 1 0 0 0 2 0v-1h10v1a1 1 0 0 0 2 0v-1.78c.61-.55 1-1.34 1-2.22V6c0-5-5-5-8-5s-8 0-8 5v10z"/>
</svg>

</div>
`,
className:"",
iconSize:[24,24],
iconAnchor:[12,12]
})

}

function FitBounds({ pontos, trigger }) {

  const map = useMap()
  const ultimoTrigger = useRef(trigger)

  useEffect(() => {

    if (trigger !== ultimoTrigger.current && pontos.length > 0) {

      map.fitBounds(pontos)

      ultimoTrigger.current = trigger

    }

  }, [pontos, trigger, map])

  return null
}

function App() {

  const [inputLinha, setInputLinha] = useState("")
  const [linhaSelecionada, setLinhaSelecionada] = useState("")
  const [linhas, setLinhas] = useState([])
  const [dados, setDados] = useState([])
  const [dadosFiltrados, setDadosFiltrados] = useState([])
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState("")
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [fitTrigger, setFitTrigger] = useState(0)
  const coresRef = useRef({})
  const [onibusCarregados, setOnibusCarregados] = useState(false)

  async function carregarLinhas() {

    const res = await fetch("https://riobusradar-api.onrender.com/linhas")
    const json = await res.json()

    setLinhas(json)

  }

  async function carregarOnibus() {

    const res = await fetch("https://riobusradar-api.onrender.com/onibus")
    const json = await res.json()

    setDados(json.dados)

    setInicio(json.inicio_coleta)
    setFim(json.fim_coleta)

    setUltimaAtualizacao(new Date().toLocaleTimeString())

    if (linhaSelecionada !== "") {

      const filtrados = json.dados.filter(
        b => String(b.linha) === linhaSelecionada
      )

      setDadosFiltrados(filtrados)

    }

    setOnibusCarregados(true)

  }

  function buscarLinha(linhaBotao){

    const linhaFinal = linhaBotao ?? inputLinha

    if(!linhaFinal) return

    setLinhaSelecionada(String(linhaFinal))
    setInputLinha(String(linhaFinal))

  }

  function cor(ordem){

  if(!coresRef.current[ordem]){

    const hue = Math.floor(Math.random()*360)

    coresRef.current[ordem] = `hsl(${hue},70%,50%)`

  }

  return coresRef.current[ordem]

  }

  useEffect(() => {

    carregarLinhas()
    carregarOnibus()

    const intervalo = setInterval(carregarOnibus, 30000)

    return () => clearInterval(intervalo)

  }, [linhaSelecionada])

  useEffect(() => {

  if (linhaSelecionada !== "") {

    const filtrados = dados.filter(
      b => String(b.linha) === linhaSelecionada
    )

    setDadosFiltrados(filtrados)

  }

  }, [dados, linhaSelecionada])

  useEffect(() => {

  if (linhaSelecionada !== "") {
    
    coresRef.current = {}
    setFitTrigger(prev => prev + 1)

  }

  }, [linhaSelecionada])

  const quantidade = new Set(
    dadosFiltrados.map(b => b.ordem)
  ).size

  let velMedia = 0
  let tempoInicialLinha = null
  let tempoFinalLinha = null

  if (dadosFiltrados.length > 0) {

    const ultimos = {}

    dadosFiltrados.forEach(b => {

      const data = new Date(b.datahora)

      // descobrir primeiro e último horário da linha
      if (!tempoInicialLinha || data < tempoInicialLinha) {
        tempoInicialLinha = data
      }

      if (!tempoFinalLinha || data > tempoFinalLinha) {
        tempoFinalLinha = data
      }

      // pegar último registro de cada ônibus
      if (!ultimos[b.ordem] || data > new Date(ultimos[b.ordem].datahora)) {
        ultimos[b.ordem] = b
      }

    })

    const velocidades = Object.values(ultimos)
      .map(b => b.velocidade)
      .filter(v => v > 0 && v < 100)

    if (velocidades.length > 0) {

      velMedia = Math.round(
        velocidades.reduce((a,b)=>a+b,0) / velocidades.length
      )

    }

  }

  const trajetos = {}
  const pontosBounds = []

  dadosFiltrados
  .sort((a,b)=> new Date(a.datahora) - new Date(b.datahora))
  .forEach(p=>{

    if(!trajetos[p.ordem]) trajetos[p.ordem]=[]

    const coord=[p.latitude,p.longitude]

    trajetos[p.ordem].push(coord)

    pontosBounds.push(coord)

  })

  return (

<div className="layout">

  {!onibusCarregados && (
    <div className="loading-overlay">
      <div className="loading-box">
        <div className="spinner"></div>
        <p>Inicializando servidor...</p>
      </div>
    </div>
  )}

{/* SIDEBAR */}

<div className="sidebar">

  {/* HEADER */}

  <div className="header">

  <div className="logo">
    <Bus size={20} strokeWidth={2.5} />
  </div>

    <div>
      <h1>RioBus Radar</h1>
      <p>Últimos 5 minutos · SMTR/RJ</p>
    </div>

  </div>

  <div className="divider"></div>

  {/* BUSCA */}

  <div className="section-title">
    Linha de ônibus
  </div>

  <div className="busca">

  <input
    placeholder="Ex: 473"
    value={inputLinha}
    onChange={(e)=>setInputLinha(e.target.value)}
    onKeyDown={(e)=>{
      if(e.key === "Enter"){
        buscarLinha()
      }
    }}
  />

    <button onClick={()=>buscarLinha()} className="botao-buscar">
      <Search size={16}/>
      Buscar no mapa
    </button>
  </div>


  <div className="divider"></div>


  {/* LISTA DE LINHAS */}

  <div className="section-title">
    Todas as linhas
  </div>

  <div className="linhas">

    <div className="linhas-grid">

      {linhas.map(l => (

        <button
          key={l}
          className={linhaSelecionada === String(l) ? "linha ativa" : "linha"}
          onClick={()=>buscarLinha(String(l))}
        >
          {l}
        </button>

      ))}

    </div>

  </div>


  <div className="divider"></div>


  {/* INDICADORES */}

  <div className="section-title">
    Indicadores
  </div>

  <div className="kpis">

    <div className="card verde">
      <div className="kpi-title">
        <Bus size={14}/>
        <span>Ônibus</span>
      </div>
      <h2>{quantidade}</h2>
    </div>

    <div className="card amarelo">
      <div className="kpi-title">
        <Gauge size={14}/>
        <span>Vel. média</span>
      </div>
      <h2>{velMedia} km/h</h2>
    </div>

    <div className="card azul">
      <div className="kpi-title">
        <Clock size={14}/>
        <span>Tempo inicial</span>
      </div>
      <h2>
        {tempoInicialLinha ? tempoInicialLinha.toLocaleTimeString() : "-"}
      </h2>
    </div>

    <div className="card roxo">
      <div className="kpi-title">
        <ClockArrowUp size={14}/>
        <span>Tempo final</span>
      </div>
      <h2>
        {tempoFinalLinha ? tempoFinalLinha.toLocaleTimeString() : "-"}
      </h2>
    </div>

  </div>


  {/* STATUS */}

  <div className="update">

    <div className="dot"></div>

    <span>
      Atualizado {ultimaAtualizacao}
    </span>

  </div>


  {/* FOOTER */}

  <footer>
    Dados: SMTR Rio de Janeiro
  </footer>

</div>



{/* MAPA */}

<div className="mapa">

<MapContainer
center={[-22.90,-43.20]}
zoom={11}
scrollWheelZoom
>

<TileLayer
url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
/>

{Object.entries(trajetos).map(([ordem,pontos],i)=>{

const ultimo=pontos[pontos.length-1]

return(
<>
<Polyline
key={ordem}
positions={pontos}
pathOptions={{color:cor(ordem),weight:4}}
/>

<Marker
  position={ultimo}
  icon={criarIconeBus(cor(ordem))}
>

<Tooltip direction="top" offset={[0,-10]} opacity={1}>

<div style={{fontSize:"12px"}}>

<b>Ônibus:</b> {ordem}<br/>

<b>Velocidade:</b> {
dadosFiltrados
.filter(b=>b.ordem===ordem)
.sort((a,b)=>new Date(b.datahora)-new Date(a.datahora))[0]?.velocidade
} km/h

<br/>

<b>Última atualização:</b> {
new Date(
dadosFiltrados
.filter(b=>b.ordem===ordem)
.sort((a,b)=>new Date(b.datahora)-new Date(a.datahora))[0]?.datahora
).toLocaleTimeString()
}

</div>

</Tooltip>

</Marker>
</>
)

})}

<FitBounds pontos={pontosBounds} trigger={fitTrigger}/>

</MapContainer>

</div>

</div>

  )

}

export default App