import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AudioLines, CircleHelp, ExternalLink, Heart, Home, Library, ListMusic,
  LogOut, Menu, Music2, Play, Search, Settings2, Sparkles, X,
} from "lucide-react";
import {
  beginSpotifyLogin,
  clearSpotifySession,
  getSavedSpotifyTracks,
  getSpotifyProfile,
  handleSpotifyRedirect,
  isSpotifyConnected,
  searchSpotifyTracks,
  spotifyConfigured,
  spotifyDuration,
  type SpotifyTrack,
  type SpotifyUser,
} from "../lib/spotify";

export const Route = createFileRoute("/")({ component: SpotifyCompanion });

function SpotifyCompanion() {
  const [section, setSection] = useState("Início");
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [savedTracks, setSavedTracks] = useState<SpotifyTrack[]>([]);
  const [profile, setProfile] = useState<SpotifyUser | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        await handleSpotifyRedirect();
        if (!active) return;
        const hasSession = isSpotifyConnected();
        setConnected(hasSession);
        if (!hasSession) return;
        setLoading(true);
        const user = await getSpotifyProfile();
        if (!active) return;
        setProfile(user);
        const saved = await getSavedSpotifyTracks();
        if (!active) return;
        setSavedTracks(saved);
        const initial = await searchSpotifyTracks("genre:pop");
        if (!active) return;
        setTracks(initial);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Não foi possível conectar ao Spotify.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!connected || !query.trim()) return;
    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await searchSpotifyTracks(query.trim());
        if (active) setTracks(result);
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : "Falha ao pesquisar no Spotify.");
      } finally {
        if (active) setLoading(false);
      }
    }, 300);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, connected]);

  const chooseSection = (next: string) => {
    setSection(next);
    setMobileMenu(false);
    setNotice("");
    if (next === "Pesquisa") window.setTimeout(() => document.getElementById("music-search")?.focus(), 40);
    if (next === "Sua biblioteca") {
      if (!connected) setNotice("Conecte sua conta para ver as músicas que você salvou no Spotify.");
      else {
        setLoading(true);
        getSavedSpotifyTracks().then(setSavedTracks).catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível carregar sua biblioteca.")).finally(() => setLoading(false));
      }
    }
    if (next === "Início" && connected && !query) {
      setLoading(true);
      searchSpotifyTracks("genre:pop").then(setTracks).catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível carregar o catálogo.")).finally(() => setLoading(false));
    }
  };

  const connect = async () => {
    setError("");
    try { await beginSpotifyLogin(); }
    catch (e) { setError(e instanceof Error ? e.message : "Não foi possível iniciar o login Spotify."); }
  };
  const disconnect = () => {
    clearSpotifySession();
    setConnected(false);
    setProfile(null);
    setTracks([]);
    setSavedTracks([]);
    setQuery("");
    setSection("Início");
    setNotice("Sua conta Spotify foi desconectada deste navegador.");
  };

  const navItems = [
    { label: "Início", icon: Home },
    { label: "Pesquisa", icon: Search },
    { label: "Sua biblioteca", icon: Library },
  ];
  const visibleTracks = section === "Sua biblioteca" ? savedTracks : tracks;
  const isSearching = Boolean(query.trim()) || section === "Pesquisa";
  const pageTitle = section === "Início" ? "Sua música, de verdade." : section;
  const openSpotify = (track: SpotifyTrack) => track.external_urls?.spotify ?? track.album.external_urls?.spotify ?? "https://open.spotify.com/";

  return (
    <div className="spotify-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand"><span className="brand-mark"><AudioLines size={23} strokeWidth={2.5}/></span><span>friendly<span className="brand-light">hello</span></span><button className="icon-btn sidebar-close" onClick={() => setMobileMenu(false)} aria-label="Fechar menu"><X size={19}/></button></div>
        <nav className="primary-nav" aria-label="Navegação principal">
          {navItems.map(({ label, icon: Icon }) => <button key={label} onClick={() => chooseSection(label)} className={`nav-item ${section === label ? "nav-active" : ""}`}><Icon size={21}/><span>{label}</span></button>)}
        </nav>
        <div className="library-heading"><div><Library size={20}/><span>Sua biblioteca</span></div><button className="icon-btn" aria-label="Abrir biblioteca" onClick={() => chooseSection("Sua biblioteca")}><ListMusic size={20}/></button></div>
        <button className="library-prompt" onClick={() => chooseSection("Sua biblioteca")}><span className="prompt-icon"><Music2 size={18}/></span><span><b>Músicas salvas</b><small>{connected ? `${savedTracks.length} carregadas do Spotify` : "Conecte para sincronizar"}</small></span></button>
        <div className="sidebar-playlists">
          <button onClick={() => chooseSection("Sua biblioteca")}><span className="playlist-cover liked-cover"><Heart size={18} fill="currentColor"/></span><span><b>Suas músicas</b><small>Biblioteca da sua conta</small></span></button>
        </div>
        <div className="sidebar-bottom">
          <div className="connect-card"><span className="connect-icon"><Music2 size={18}/></span><b>{connected ? `Olá, ${profile?.display_name || "ouvinte"}!` : "Seu Spotify, sem invenções."}</b><p>{connected ? "Os resultados e as capas vêm do catálogo oficial." : "Entre para buscar músicas reais e ver sua biblioteca."}</p>
            {connected ? <button onClick={disconnect}>Desconectar <LogOut size={14}/></button> : <button onClick={connect}>Conectar Spotify <ExternalLink size={14}/></button>}
          </div>
          <button className="nav-item settings-item" onClick={() => setNotice("Configuração por ambiente: VITE_SPOTIFY_CLIENT_ID e VITE_SPOTIFY_REDIRECT_URI.")}><Settings2 size={19}/><span>Configurações</span></button>
        </div>
      </aside>
      {mobileMenu && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileMenu(false)}/>}
      <main className="main-panel">
        <header className="topbar"><div className="topbar-left"><button className="icon-btn mobile-menu-btn" onClick={() => setMobileMenu(true)} aria-label="Abrir menu"><Menu size={21}/></button><button className="history-btn" aria-label="Início" onClick={() => chooseSection("Início")}>‹</button><button className="history-btn" aria-label="Pesquisa" onClick={() => chooseSection("Pesquisa")}>›</button><div className="mobile-brand"><AudioLines size={20}/> friendlyhello</div></div><div className="topbar-actions"><span className="preview-pill"><span/> {connected ? "SPOTIFY CONECTADO" : "CATÁLOGO OFICIAL"}</span><button className="help-btn" onClick={() => setNotice("Friendly Hello é um cliente independente. As faixas e capas exibidas após a conexão vêm da API oficial do Spotify.")}><CircleHelp size={18}/><span>Ajuda</span></button>{connected ? <button className="login-btn" onClick={disconnect}>Sair</button> : <button className="login-btn" onClick={connect}>Entrar com Spotify</button>}</div></header>
        <div className="page-scroll">
          <section className="welcome-row"><div><p className="eyebrow"><span className="live-dot"/>{connected ? "CONECTADO AO SPOTIFY" : "SEM MÚSICAS FICTÍCIAS"}</p><h1>{pageTitle}</h1><p className="welcome-copy">{section === "Início" ? "Busque o catálogo oficial e encontre suas músicas favoritas." : section === "Pesquisa" ? "Pesquise faixas reais, artistas e álbuns no Spotify." : "As músicas salvas diretamente na sua conta Spotify."}</p></div><div className="welcome-orb"><div className="orb-ring ring-one"/><div className="orb-ring ring-two"/><AudioLines size={43}/><span className="orb-spark spark-a">✳</span><span className="orb-spark spark-b">✦</span></div></section>
          <div className="search-wrap"><Search size={20}/><input id="music-search" value={query} onChange={e => {setQuery(e.target.value); setSection("Pesquisa");}} placeholder="Buscar músicas, artistas e álbuns no Spotify" aria-label="Buscar músicas, artistas e álbuns"/>{query && <button className="icon-btn" onClick={() => {setQuery(""); setSection("Início"); if (connected) {setLoading(true); searchSpotifyTracks("genre:pop").then(setTracks).catch((e: unknown) => setError(e instanceof Error ? e.message : "Não foi possível carregar o catálogo.")).finally(() => setLoading(false));}}} aria-label="Limpar pesquisa"><X size={17}/></button>}<kbd>Spotify</kbd></div>
          {notice && <div className="notice-banner"><span><Sparkles size={17}/>{notice}</span><button onClick={() => setNotice("")} aria-label="Fechar aviso"><X size={17}/></button></div>}
          {error && <div className="notice-banner error-banner"><span>{error}</span><button onClick={() => setError("")} aria-label="Fechar erro"><X size={17}/></button></div>}
          {!spotifyConfigured && <section className="connect-required"><div className="connect-required-icon"><Music2 size={28}/></div><h2>Conecte o catálogo oficial</h2><p>O app já está preparado para buscar músicas reais, capas originais e dados da sua biblioteca. Falta cadastrar o Client ID do Spotify no ambiente do projeto.</p><button className="login-btn" onClick={connect}>Configurar conexão</button><small>Não exibimos músicas de exemplo nem capas aleatórias.</small></section>}
          {spotifyConfigured && !connected && <section className="connect-required"><div className="connect-required-icon"><Music2 size={28}/></div><h2>Entre na sua conta Spotify</h2><p>Depois de autorizar, o Friendly Hello vai carregar faixas reais do catálogo e, na biblioteca, as músicas salvas na sua conta.</p><button className="login-btn" onClick={connect}>Conectar Spotify</button></section>}
          {connected && <section className="content-section"><div className="section-heading"><div><p className="eyebrow">{section === "Sua biblioteca" ? "SUA CONTA" : isSearching ? "BUSCA OFICIAL" : "CATÁLOGO OFICIAL"}</p><h2>{section === "Sua biblioteca" ? "Músicas salvas" : query ? `Resultados para “${query}”` : "Faixas do Spotify"}</h2></div><span className="result-count">{loading ? "Carregando…" : `${visibleTracks.length} faixas`}</span></div>
            {loading && visibleTracks.length === 0 ? <div className="empty-state"><span className="loading-spinner"/><b>Buscando no Spotify…</b></div> : visibleTracks.length > 0 ? <div className="track-list">{visibleTracks.map(track => <div className="track-row" key={track.id}><a className="track-art" href={openSpotify(track)} target="_blank" rel="noreferrer" aria-label={`Abrir ${track.name} no Spotify`}>{track.album.images?.[0]?.url ? <img src={track.album.images[track.album.images.length - 1]?.url ?? track.album.images[0].url} alt={`Capa do álbum ${track.album.name}`}/> : <span className="no-art"><Music2 size={20}/></span>}<span><Play size={17} fill="currentColor"/></span></a><div className="track-info"><a href={openSpotify(track)} target="_blank" rel="noreferrer"><b>{track.name}</b></a><span>{track.artists.map(a => a.name).join(", ")}</span></div><span className="track-album">{track.album.name}</span><a className="spotify-open-link" href={openSpotify(track)} target="_blank" rel="noreferrer" aria-label="Ouvir no Spotify"><ExternalLink size={17}/></a><span className="track-duration">{spotifyDuration(track.duration_ms)}</span></div>)}</div> : <div className="empty-state"><Search size={28}/><b>{section === "Sua biblioteca" ? "Sua biblioteca não trouxe faixas" : query ? "Nenhuma música encontrada" : "Nenhuma faixa para mostrar"}</b><span>{section === "Sua biblioteca" ? "Salve músicas no Spotify e atualize esta seção." : "Tente outro termo de busca."}</span></div>}
          </section>}
          {connected && <section className="feature-strip"><div className="feature-icon"><Music2 size={22}/></div><div><b>Conteúdo real, vindo do Spotify</b><p>Capas originais sem alterações e links para abrir cada faixa no serviço oficial.</p></div><a href="https://open.spotify.com/" target="_blank" rel="noreferrer">Abrir Spotify <ExternalLink size={15}/></a></section>}
          <footer className="page-footer"><span>FRIENDLY HELLO <i>•</i> SPOTIFY COMPANION</span><a href="https://open.spotify.com/" target="_blank" rel="noreferrer">Spotify <ExternalLink size={13}/></a></footer>
        </div>
      </main>
      <nav className="mobile-bottom-nav" aria-label="Navegação móvel">{navItems.map(({label, icon: Icon}) => <button key={label} className={section === label ? "mobile-nav-active" : ""} onClick={() => chooseSection(label)}><Icon size={21}/><span>{label === "Sua biblioteca" ? "Biblioteca" : label}</span></button>)}</nav>
    </div>
  );
}
