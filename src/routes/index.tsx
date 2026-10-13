import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Album, ArrowDown, AudioLines, ChevronDown, CircleHelp, Clock3, Compass,
  Disc3, Heart, Home, Library, ListMusic, Menu, Mic2, MoreHorizontal,
  Music2, Pause, Play, Plus, Search, Settings2, Shuffle, SkipBack,
  SkipForward, Sparkles, Volume2, X,
} from "lucide-react";

export const Route = createFileRoute("/")({ component: SpotifyCompanion });

type Track = { title: string; artist: string; cover: string; album?: string; duration: string };
const tracks: Track[] = [
  { title: "Midnight City", artist: "M83", album: "Hurry Up, We're Dreaming", cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500&auto=format&fit=crop&q=85", duration: "4:03" },
  { title: "The Less I Know The Better", artist: "Tame Impala", album: "Currents", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=500&auto=format&fit=crop&q=85", duration: "3:36" },
  { title: "Instant Crush", artist: "Daft Punk, Julian Casablancas", album: "Random Access Memories", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&auto=format&fit=crop&q=85", duration: "5:37" },
  { title: "Sweater Weather", artist: "The Neighbourhood", album: "I Love You.", cover: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=500&auto=format&fit=crop&q=85", duration: "4:00" },
  { title: "After Dark", artist: "Mr.Kitty", album: "Time", cover: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=500&auto=format&fit=crop&q=85", duration: "4:17" },
  { title: "Feels Like We Only Go Backwards", artist: "Tame Impala", album: "Lonerism", cover: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=500&auto=format&fit=crop&q=85", duration: "3:12" },
];
const mixes = [
  { title: "Noite em órbita", subtitle: "Eletrônica • indie • atmosfera", image: "photo-1519608487953-e999c86e7455" },
  { title: "Indie sem pressa", subtitle: "Guitarras para desacelerar", image: "photo-1493225457124-a3eb161ffa5f" },
  { title: "Foco profundo", subtitle: "Sons para entrar no ritmo", image: "photo-1470225620780-dba8ba36b745" },
  { title: "Descobertas", subtitle: "Artistas que combinam com você", image: "photo-1511379938547-c1f69419868d" },
];

function SpotifyCompanion() {
  const [section, setSection] = useState("Início");
  const [query, setQuery] = useState("");
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [liked, setLiked] = useState<number[]>([1]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const filtered = useMemo(() => tracks.filter(t => (t.title + " " + t.artist + " " + (t.album ?? "")).toLowerCase().includes(query.toLowerCase())), [query]);
  const track = tracks[current];
  const chooseSection = (s: string) => { setSection(s); setMobileMenu(false); if (s === "Pesquisa") setTimeout(() => document.getElementById("music-search")?.focus(), 40); };
  const playTrack = (index: number) => { setCurrent(index); setPlaying(true); setNotice("Prévia visual: a reprodução real será habilitada após a integração oficial com o Spotify."); };
  const toggleLike = (index: number) => setLiked(old => old.includes(index) ? old.filter(i => i !== index) : [...old, index]);
  const navItems = [
    { label: "Início", icon: Home }, { label: "Pesquisa", icon: Search }, { label: "Sua biblioteca", icon: Library },
  ];
  return (
    <div className="spotify-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><AudioLines size={23} strokeWidth={2.5}/></span><span>friendly<span className="brand-light">hello</span></span><button className="icon-btn sidebar-close" onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><X size={19}/></button></div>
        <nav className="primary-nav" aria-label="Navegação principal">
          {navItems.map(({label, icon: Icon}) => <button key={label} onClick={() => chooseSection(label)} className={`nav-item ${section === label ? "nav-active" : ""}`}><Icon size={21}/><span>{label}</span></button>)}
        </nav>
        <div className="library-heading"><div><Library size={20}/><span>Sua biblioteca</span></div><button className="icon-btn" aria-label="Criar playlist" onClick={() => setNotice("A criação e sincronização de playlists será conectada à sua conta Spotify.")}><Plus size={21}/></button></div>
        <button className="library-prompt" onClick={() => setNotice("Entre com Spotify para carregar suas playlists reais.")}><span className="prompt-icon"><ListMusic size={18}/></span><span><b>Suas playlists</b><small>Suas músicas, do seu jeito</small></span><ChevronDown size={16}/></button>
        <div className="sidebar-playlists">
          <button onClick={() => chooseSection("Feitas para você")}><span className="playlist-cover gradient-cover"><Sparkles size={18}/></span><span><b>Feitas para você</b><small>Mixes personalizados</small></span></button>
          <button onClick={() => chooseSection("Curtidas")}><span className="playlist-cover liked-cover"><Heart size={18} fill="currentColor"/></span><span><b>Músicas curtidas</b><small>{liked.length} músicas salvas nesta demonstração</small></span></button>
          <button onClick={() => chooseSection("Ouvidas recentemente")}><span className="playlist-cover recent-cover"><Clock3 size={18}/></span><span><b>Ouvidas recentemente</b><small>Volte para o som</small></span></button>
        </div>
        <div className="sidebar-bottom"><div className="connect-card"><span className="connect-icon"><Music2 size={18}/></span><b>Seu Spotify, do seu jeito.</b><p>Conecte sua conta para explorar o que a API oficial permite.</p><button onClick={() => setNotice("A autenticação Spotify com PKCE será implementada na próxima etapa. Nenhuma conta foi conectada.")}>Conectar Spotify <ArrowDown size={14}/></button></div><button className="nav-item settings-item" onClick={() => chooseSection("Configurações")}><Settings2 size={19}/><span>Configurações</span></button></div>
      </aside>
      {mobileMenu && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileMenu(false)}/>}
      <main className="main-panel">
        <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu size={21}/></button><button className="history-btn" aria-label="Voltar" onClick={() => chooseSection("Início")}>‹</button><button className="history-btn" aria-label="Avançar" onClick={() => chooseSection("Pesquisa")}>›</button><div className="mobile-brand"><AudioLines size={20}/> friendlyhello</div></div><div className="topbar-actions"><span className="preview-pill"><span/> MODO PRÉVIA</span><button className="help-btn" onClick={() => setNotice("Friendly Hello é um cliente independente em desenvolvimento. Recursos dependem da API e das regras do Spotify.")}><CircleHelp size={18}/><span>Ajuda</span></button><button className="login-btn" onClick={() => setNotice("Login ainda não está ativo. Vamos configurar OAuth PKCE sem expor segredos no navegador.")}>Entrar com Spotify</button></div></header>
        <div className="page-scroll">
          <section className="welcome-row"><div><p className="eyebrow"><span className="live-dot"/> SEU UNIVERSO MUSICAL</p><h1>{section === "Início" ? "Boa música. Do seu jeito." : section}</h1><p className="welcome-copy">{section === "Início" ? "Um novo espaço para encontrar o som certo para cada momento." : section === "Pesquisa" ? "Busque artistas, faixas e álbuns para descobrir seu próximo favorito." : "Sua experiência musical, organizada em um só lugar."}</p></div><div className="welcome-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><AudioLines size={43}/><span className="orb-spark spark-a">✳</span><span className="orb-spark spark-b">✦</span></div></section>
          <div className="search-wrap"><Search size={20}/><input id="music-search" value={query} onChange={e => {setQuery(e.target.value); if (e.target.value) setSection("Pesquisa");}} placeholder="O que você quer ouvir?" aria-label="Buscar músicas, artistas e álbuns"/>{query && <button className="icon-btn" onClick={() => setQuery("")} aria-label="Limpar pesquisa"><X size={17}/></button>}<kbd>⌘ K</kbd></div>
          {notice && <div className="notice-banner"><span><Sparkles size={17}/>{notice}</span><button onClick={() => setNotice("")} aria-label="Fechar aviso"><X size={17}/></button></div>}
          {query ? <section className="content-section"><div className="section-heading"><div><p className="eyebrow">RESULTADOS</p><h2>Encontrado para você</h2></div><span className="result-count">{filtered.length} faixas de demonstração</span></div>{filtered.length ? <div className="track-list">{filtered.map(t => {const i=tracks.indexOf(t);return <div className={`track-row ${current===i && playing ? "track-playing" : ""}`} key={t.title}><button className="track-art" onClick={() => playTrack(i)}><img src={t.cover} alt=""/><span><Play size={17} fill="currentColor"/></span></button><div className="track-info"><b>{t.title}</b><span>{t.artist}</span></div><span className="track-album">{t.album}</span><button className={`like-btn ${liked.includes(i)?"liked":""}`} onClick={() => toggleLike(i)} aria-label="Curtir música"><Heart size={17} fill={liked.includes(i)?"currentColor":"none"}/></button><span className="track-duration">{t.duration}</span><button className="icon-btn" aria-label="Mais opções" onClick={() => setNotice("Opções avançadas serão adicionadas conforme os recursos oficiais disponíveis.")}><MoreHorizontal size={19}/></button></div>})}</div> : <div className="empty-state"><Search size={28}/><b>Nenhum resultado por aqui</b><span>Tente buscar por outro nome ou artista.</span></div>}</section> : <><section className="content-section"><div className="section-heading"><div><p className="eyebrow">SELEÇÃO FRIENDLY</p><h2>Seu próximo repeat</h2></div><button className="text-link" onClick={() => chooseSection("Explorar")}>Explorar tudo <span>↗</span></button></div><div className="mix-grid">{mixes.map((mix,i)=><button className="mix-card" key={mix.title} onClick={() => {setQuery(i===1?"Tame Impala":i===2?"Daft Punk":""); if(i===0) playTrack(0); else if(i===1) playTrack(1); else if(i===2) playTrack(2); else chooseSection("Pesquisa");}}><img src={`https://images.unsplash.com/${mix.image}?w=700&auto=format&fit=crop&q=85`} alt=""/><span className="mix-shade"/><span className="mix-copy"><small>{mix.subtitle}</small><b>{mix.title}</b></span><span className="mix-play"><Play size={18} fill="currentColor"/></span></button>)}</div></section>
          <section className="content-section"><div className="section-heading"><div><p className="eyebrow">PRA COMEÇAR</p><h2>Uma vibe para agora</h2></div><button className="text-link" onClick={() => chooseSection("Pesquisa")}>Ver catálogo <span>↗</span></button></div><div className="album-grid">{tracks.slice(0,4).map((t,i)=><button className="album-card" key={t.title} onClick={() => playTrack(i)}><div className="album-image"><img src={t.cover} alt="Capa ilustrativa"/><span className="album-play"><Play size={19} fill="currentColor"/></span></div><b>{t.title}</b><span>{t.artist}</span></button>)}</div></section>
          <section className="feature-strip"><div className="feature-icon"><Disc3 size={22}/></div><div><b>Seu Spotify. Uma nova experiência.</b><p>Conecte sua conta para acessar perfil, busca e biblioteca conforme as permissões oficiais.</p></div><button onClick={() => setNotice("Integração planejada: OAuth PKCE e Spotify Web API. A reprodução dependerá do plano e da compatibilidade.")}>Como funciona <span>→</span></button></section></>}
          <footer className="page-footer"><span>FRIENDLY HELLO <i>•</i> SPOTIFY COMPANION</span><span>Uma experiência independente, ainda em desenvolvimento.</span></footer>
        </div>
      </main>
      <footer className="player-bar"><div className="now-playing"><img src={track.cover} alt=""/><div><b>{track.title}</b><span>{track.artist}</span></div><button className={`like-btn ${liked.includes(current)?"liked":""}`} onClick={() => toggleLike(current)} aria-label="Curtir faixa atual"><Heart size={17} fill={liked.includes(current)?"currentColor":"none"}/></button></div><div className="player-controls"><div className="control-buttons"><button aria-label="Aleatório" onClick={() => setNotice("O modo aleatório estará disponível com a integração de reprodução.")}><Shuffle size={16}/></button><button aria-label="Faixa anterior" onClick={() => {setCurrent((current+tracks.length-1)%tracks.length);setPlaying(true);}}><SkipBack size={19} fill="currentColor"/></button><button className="main-play" aria-label={playing?"Pausar":"Reproduzir"} onClick={() => setPlaying(!playing)}>{playing?<Pause size={19} fill="currentColor"/>:<Play size={19} fill="currentColor"/>}</button><button aria-label="Próxima faixa" onClick={() => {setCurrent((current+1)%tracks.length);setPlaying(true);}}><SkipForward size={19} fill="currentColor"/></button><button aria-label="Fila" onClick={() => setNotice("A fila de reprodução real será ligada à integração oficial.")}><ListMusic size={17}/></button></div><div className="progress-line"><span>0:00</span><div className="progress-track"><span style={{width: playing ? "28%" : "0%"}}/></div><span>{track.duration}</span></div></div><div className="player-extra"><button aria-label="Dispositivo de reprodução" onClick={() => setNotice("A reprodução em dispositivos depende do Spotify, do plano e da compatibilidade.")}><Mic2 size={17}/></button><button aria-label="Volume" onClick={() => setNotice("Controle de volume visual da demonstração.")}><Volume2 size={18}/></button><div className="volume-track"><span/></div><button aria-label="Expandir player" onClick={() => setNotice("O player expandido será adicionado em uma próxima versão.")}><ArrowDown size={17}/></button></div></footer>
      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">{navItems.map(({label,icon:Icon})=><button key={label} className={section===label?"mobile-nav-active":""} onClick={() => chooseSection(label)}><Icon size={21}/><span>{label==="Sua biblioteca"?"Biblioteca":label}</span></button>)}</nav>
    </div>
  );
}
