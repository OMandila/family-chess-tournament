import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const starterPlayers = [
  { id: 1, name: 'Oliver Mandila', initials: 'OM', rating: 1240, wins: 2, draws: 0, losses: 0, points: 2 },
  { id: 2, name: 'Maya Mandila', initials: 'MM', rating: 1180, wins: 1, draws: 1, losses: 0, points: 1.5 },
  { id: 3, name: 'Sam Carter', initials: 'SC', rating: 1120, wins: 1, draws: 0, losses: 1, points: 1 },
  { id: 4, name: 'Nadia Khan', initials: 'NK', rating: 1050, wins: 0, draws: 1, losses: 1, points: 0.5 },
  { id: 5, name: 'Theo Mandila', initials: 'TM', rating: 980, wins: 0, draws: 1, losses: 1, points: 0.5 },
  { id: 6, name: 'Aisha Carter', initials: 'AC', rating: 920, wins: 0, draws: 0, losses: 2, points: 0 },
]
const starterPairings = { 2: [{ id: 'round-2-1', white: 1, black: 2 }, { id: 'round-2-2', white: 3, black: 4 }, { id: 'round-2-3', white: 5, black: 6 }] }
const defaultTournament = { name: 'Autumn Family Cup', date: '2026-09-07', rounds: 4, scoring: 'chess' }

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}

function generatePairings(players, round, allRounds) {
  const remaining = [...players].sort((a, b) => b.rating - a.rating)
  const played = allRounds.flatMap((roundPairings) => Array.isArray(roundPairings) ? roundPairings : []).map((pairing) => [pairing.white, pairing.black].sort().join('-'))
  const result = []
  while (remaining.length > 1) {
    const white = remaining.shift()
    const available = remaining.findIndex((player) => !played.includes([white.id, player.id].sort().join('-')))
    const black = remaining.splice(available < 0 ? 0 : available, 1)[0]
    result.push({ id: `round-${round}-${result.length + 1}`, white: white.id, black: black.id })
  }
  return result
}

function App() {
  const [players, setPlayers] = useState(() => readStorage('family-chess-players', starterPlayers))
  const [tournament, setTournament] = useState(() => readStorage('family-chess-tournament', defaultTournament))
  const [pairingsByRound, setPairingsByRound] = useState(() => readStorage('family-chess-pairings', starterPairings))
  const [roundResults, setRoundResults] = useState(() => readStorage('family-chess-results', {}))
  const [knockoutResults, setKnockoutResults] = useState(() => readStorage('family-chess-knockout', {}))
  const [history, setHistory] = useState(() => readStorage('family-chess-history', []))
  const [round, setRound] = useState(() => Number(localStorage.getItem('family-chess-round') || 2))
  const [activeTab, setActiveTab] = useState('Overview')
  const [notice, setNotice] = useState('')
  const [showSetup, setShowSetup] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showPlayers, setShowPlayers] = useState(false)
  const [selectedHistory, setSelectedHistory] = useState(null)
  const importRef = useRef(null)

  const standings = useMemo(() => [...players].sort((a, b) => b.points - a.points || b.rating - a.rating), [players])
  const tournamentStats = useMemo(() => {
    // One chess game appears in two player records, so count the records and divide by two.
    const gamesPlayed = players.reduce((total, player) => total + player.wins + player.draws + player.losses, 0) / 2
    const totalGames = Math.floor(players.length / 2) * tournament.rounds
    return { gamesPlayed, totalGames, gamesRemaining: Math.max(totalGames - gamesPlayed, 0) }
  }, [players, tournament.rounds])
  const qualifiers = standings.slice(0, 4)
  const semifinals = qualifiers.length >= 4 ? [{ id: 'semifinal-1', white: qualifiers[0].id, black: qualifiers[3].id }, { id: 'semifinal-2', white: qualifiers[1].id, black: qualifiers[2].id }] : []
  const winnerOf = (pairing) => pairing && knockoutResults[pairing.id] ? (knockoutResults[pairing.id] === 'white-win' ? pairing.white : pairing.black) : null
  const final = winnerOf(semifinals[0]) && winnerOf(semifinals[1]) ? { id: 'final', white: winnerOf(semifinals[0]), black: winnerOf(semifinals[1]) } : null

  useEffect(() => { localStorage.setItem('family-chess-players', JSON.stringify(players)) }, [players])
  useEffect(() => { localStorage.setItem('family-chess-tournament', JSON.stringify(tournament)) }, [tournament])
  useEffect(() => { localStorage.setItem('family-chess-pairings', JSON.stringify(pairingsByRound)) }, [pairingsByRound])
  useEffect(() => { localStorage.setItem('family-chess-results', JSON.stringify(roundResults)) }, [roundResults])
  useEffect(() => { localStorage.setItem('family-chess-knockout', JSON.stringify(knockoutResults)) }, [knockoutResults])
  useEffect(() => { localStorage.setItem('family-chess-history', JSON.stringify(history)) }, [history])
  useEffect(() => { localStorage.setItem('family-chess-round', String(round)) }, [round])

  function recordResult(pairing, result) {
    if (roundResults[pairing.id]) return
    const winPoints = tournament.scoring === 'three-one-zero' ? 3 : 1
    const drawPoints = tournament.scoring === 'three-one-zero' ? 1 : 0.5
    const changes = { 'white-win': [[1, 0, 0, winPoints], [0, 0, 1, 0]], draw: [[0, 1, 0, drawPoints], [0, 1, 0, drawPoints]], 'black-win': [[0, 0, 1, 0], [1, 0, 0, winPoints]] }
    const [whiteChange, blackChange] = changes[result]
    setPlayers((current) => current.map((player) => {
      const change = player.id === pairing.white ? whiteChange : player.id === pairing.black ? blackChange : null
      if (!change) return player
      return { ...player, wins: player.wins + change[0], draws: player.draws + change[1], losses: player.losses + change[2], points: player.points + change[3] }
    }))
    setRoundResults((current) => ({ ...current, [pairing.id]: result }))
  }

  function snapshot() {
    return { id: Date.now(), tournament: { ...tournament }, players: players.map((player) => ({ ...player })), pairingsByRound: JSON.parse(JSON.stringify(pairingsByRound)), roundResults: { ...roundResults }, knockoutResults: { ...knockoutResults }, archivedAt: new Date().toISOString() }
  }

  function archive() { const item = snapshot(); setHistory((current) => [item, ...current]); setSelectedHistory(item); setActiveTab('History') }
  function deleteArchived(id) { setHistory((current) => current.filter((item) => item.id !== id)); setSelectedHistory(null) }
  function exportBackup() {
    const file = new Blob([JSON.stringify({ version: 1, tournament, players, pairingsByRound, roundResults, knockoutResults, history }, null, 2)], { type: 'application/json' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(file); link.download = 'family-chess-backup.json'; link.click(); URL.revokeObjectURL(link.href); setNotice('Backup downloaded successfully.')
  }
  async function importBackup(event) {
    try {
      const imported = JSON.parse(await event.target.files[0].text())
      if (!imported.tournament || !Array.isArray(imported.players) || !Array.isArray(imported.history)) throw new Error('This is not a Family Chess backup file.')
      setTournament(imported.tournament); setPlayers(imported.players); setPairingsByRound(imported.pairingsByRound || {}); setRoundResults(imported.roundResults || {}); setKnockoutResults(imported.knockoutResults || {}); setHistory(imported.history); setRound(1); setActiveTab('Overview'); setNotice('Backup imported successfully.')
    } catch (error) { setNotice(`Import failed: ${error.message}`) }
    event.target.value = ''
  }
  function startNew(event) {
    event.preventDefault()
    const form = new FormData(event.target); const names = String(form.get('players')).split('\n').map((line) => line.trim()).filter(Boolean)
    if (names.length < 2) { setNotice('Please add at least two players, one per line.'); return }
    const freshPlayers = names.map((line, index) => { const [name, rating] = line.split(','); const cleanName = name.trim(); return { id: Date.now() + index, name: cleanName, initials: cleanName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), rating: Number(rating) || 1000, wins: 0, draws: 0, losses: 0, points: 0 } })
    setHistory((current) => [snapshot(), ...current]); setTournament({ name: form.get('name'), date: form.get('date'), rounds: Number(form.get('rounds')), scoring: form.get('scoring') }); setPlayers(freshPlayers); setPairingsByRound({}); setRoundResults({}); setKnockoutResults({}); setRound(1); setShowNew(false); setActiveTab('Overview')
  }

  function renderResultButtons(pairing, knockout = false) {
    const results = knockout ? knockoutResults : roundResults; const result = results[pairing.id]
    if (result) return <span className="result done">{result === 'white-win' ? '1 - 0' : result === 'black-win' ? '0 - 1' : '½ - ½'}</span>
    return <div className="result-actions"><button className="result pending" onClick={() => knockout ? setKnockoutResults((current) => ({ ...current, [pairing.id]: 'white-win' })) : recordResult(pairing, 'white-win')}>White wins</button>{!knockout && <button className="result pending" onClick={() => recordResult(pairing, 'draw')}>Draw</button>}<button className="result pending" onClick={() => knockout ? setKnockoutResults((current) => ({ ...current, [pairing.id]: 'black-win' })) : recordResult(pairing, 'black-win')}>Black wins</button></div>
  }

  return <main className="app-shell">
    <header className="topbar"><a className="brand" href="/" aria-label="Family Chess home"><span className="brand-mark">FC</span><span>Family Chess</span></a><nav aria-label="Main navigation">{['Overview', 'Championship', 'Players', 'History'].map((tab) => <button className={activeTab === tab ? 'nav-link active' : 'nav-link'} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav><button className="avatar" aria-label="Open profile">OM</button></header>
    <section className="page-heading"><div><p className="eyebrow">{new Date(`${tournament.date}T12:00:00`).toLocaleDateString('en-GB', { dateStyle: 'long' })}</p><h1>{activeTab === 'Overview' ? tournament.name : activeTab}</h1><p className="subheading">A friendly tournament for family and friends.</p></div><div className="heading-actions"><button className="button secondary" onClick={exportBackup}>Export</button><button className="button secondary" onClick={() => importRef.current?.click()}>Import</button><input className="hidden-file-input" ref={importRef} type="file" accept="application/json" onChange={importBackup} />{activeTab === 'Overview' && <button className="button secondary" onClick={archive}>Archive tournament</button>}<button className="button secondary" onClick={() => setShowNew(true)}>+ New tournament</button><button className="button primary" onClick={() => setShowSetup(true)}>Tournament setup</button></div></section>
    {notice && <p className="backup-notice" role="status">{notice}</p>}
    {showNew && <form className="modal-backdrop" onSubmit={startNew}><div className="setup-modal"><div className="modal-header"><div><p className="eyebrow">Start fresh</p><h2>New tournament</h2></div><button className="close-button" type="button" onClick={() => setShowNew(false)}>×</button></div><p className="modal-help">The current tournament will be archived automatically.</p><label>Tournament name<input name="name" defaultValue="Spring Family Cup" required /></label><label>Date<input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></label><label>Number of rounds<select name="rounds" defaultValue="4"><option value="2">2 rounds</option><option value="3">3 rounds</option><option value="4">4 rounds</option><option value="5">5 rounds</option><option value="6">6 rounds</option></select></label><label>Scoring system<select name="scoring" defaultValue="chess"><option value="chess">Chess: win 1, draw 0.5</option><option value="three-one-zero">Three-point: win 3, draw 1</option></select></label><label>Players<textarea name="players" rows="5" placeholder={'Maya Smith, 1200\nOliver Smith, 1100'} required /></label><p className="field-help">One player per line. Rating after a comma is optional.</p><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setShowNew(false)}>Cancel</button><button className="button primary" type="submit">Archive and start</button></div></div></form>}
    {showSetup && <form className="modal-backdrop" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.target); setTournament({ name: form.get('name'), date: form.get('date'), rounds: Number(form.get('rounds')), scoring: form.get('scoring') }); setShowSetup(false) }}><div className="setup-modal"><div className="modal-header"><div><p className="eyebrow">Tournament details</p><h2>Set up your cup</h2></div><button className="close-button" type="button" onClick={() => setShowSetup(false)}>×</button></div><label>Tournament name<input name="name" defaultValue={tournament.name} required /></label><label>Date<input name="date" type="date" defaultValue={tournament.date} required /></label><label>Number of rounds<select name="rounds" defaultValue={tournament.rounds}><option value="2">2 rounds</option><option value="3">3 rounds</option><option value="4">4 rounds</option><option value="5">5 rounds</option><option value="6">6 rounds</option></select></label><label>Scoring system<select name="scoring" defaultValue={tournament.scoring}><option value="chess">Chess: win 1, draw 0.5</option><option value="three-one-zero">Three-point: win 3, draw 1</option></select></label><div className="modal-actions"><button className="button secondary" type="button" onClick={() => setShowSetup(false)}>Cancel</button><button className="button primary" type="submit">Save settings</button></div></div></form>}
    {activeTab === 'Overview' && <><section className="stats-grid" aria-label="Tournament summary"><article className="stat-card accent"><span className="stat-label">Tournament progress</span><strong>Round {round} <small>of {tournament.rounds}</small></strong><div className="progress"><span style={{ width: `${round / tournament.rounds * 100}%` }} /></div><span className="stat-foot">{Math.round(round / tournament.rounds * 100)}% complete</span></article><article className="stat-card"><span className="stat-label">Players</span><strong>{players.length} <small>players</small></strong><span className="stat-foot online"><i /> All checked in</span></article><article className="stat-card"><span className="stat-label">Games played</span><strong>{tournamentStats.gamesPlayed} <small>of {tournamentStats.totalGames}</small></strong><span className="stat-foot">{tournamentStats.gamesRemaining} games remaining</span></article><article className="stat-card"><span className="stat-label">Next round</span><strong>14:30</strong><span className="stat-foot">Starts in 42 minutes</span></article></section><section className="content-grid"><article className="panel standings-panel"><div className="panel-header"><div><p className="eyebrow">Live results</p><h2>Standings</h2></div></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Rating</th><th>W</th><th>D</th><th>L</th><th>Points</th></tr></thead><tbody>{standings.map((player, index) => <tr key={player.id}><td className="rank">{index + 1}</td><td><div className="player-cell"><span className="player-avatar">{player.initials}</span><span>{player.name}{index === 0 && <em>Leader</em>}</span></div></td><td className="muted">{player.rating}</td><td>{player.wins}</td><td>{player.draws}</td><td>{player.losses}</td><td className="points">{player.points}</td></tr>)}</tbody></table></div></article><article className="panel round-panel"><div className="panel-header"><div><p className="eyebrow">Pairings</p><h2>Round {round}</h2></div><select value={round} onChange={(event) => setRound(Number(event.target.value))}>{Array.from({ length: tournament.rounds }, (_, index) => <option value={index + 1} key={index + 1}>Round {index + 1}</option>)}</select></div><div className="pairings">{(pairingsByRound[round] || []).length === 0 ? <p className="empty-pairings">No pairings yet. Generate this round to get started.</p> : (pairingsByRound[round] || []).map((pairing) => <div className="pairing" key={pairing.id}><div><strong>{players.find((player) => player.id === pairing.white)?.name}</strong><span className="vs">vs</span><strong>{players.find((player) => player.id === pairing.black)?.name}</strong></div>{renderResultButtons(pairing)}</div>)}</div><button className="button outline full" onClick={() => setPairingsByRound((current) => ({ ...current, [round]: generatePairings(players, round, Object.values(current)) }))}>Generate round</button></article></section></>}
    {activeTab === 'Championship' && <section className="championship-view"><div className="view-toolbar"><div><p className="eyebrow">Top four qualifiers</p><h2>Championship</h2><p className="subheading">The top four now play for the title.</p></div></div>{qualifiers.length < 4 ? <div className="empty-panel"><h2>Four players are needed</h2><p>Finish the preliminary stage with at least four players.</p></div> : <><div className="qualifier-strip">{qualifiers.map((player, index) => <div key={player.id}><span>{index + 1}</span><strong>{player.name}</strong><small>{player.points} points</small></div>)}</div><div className="bracket"><div className="bracket-column"><p className="eyebrow">Semifinals</p>{semifinals.map((pairing) => <article className="knockout-match" key={pairing.id}><div><span>{players.find((player) => player.id === pairing.white).name}</span><span>{players.find((player) => player.id === pairing.black).name}</span></div>{renderResultButtons(pairing, true)}</article>)}</div><div className="bracket-column final-column"><p className="eyebrow">Final</p>{final ? <article className="knockout-match"><div><span>{players.find((player) => player.id === final.white).name}</span><span>{players.find((player) => player.id === final.black).name}</span></div>{renderResultButtons(final, true)}</article> : <div className="waiting-final">The final appears after both semifinals have winners.</div>}{knockoutResults.final && <div className="champion-banner"><span>Champion</span><strong>{players.find((player) => player.id === winnerOf(final)).name}</strong></div>}</div></div></>}</section>}
    {activeTab === 'Players' && <section className="players-view"><div className="view-toolbar"><div><p className="eyebrow">Tournament roster</p><h2>Players</h2></div><button className="button primary" onClick={() => setShowPlayers(!showPlayers)}>+ Add player</button></div>{showPlayers && <form className="add-player-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.target); const name = form.get('name').trim(); const rating = Number(form.get('rating')) || 1000; setPlayers((current) => [...current, { id: Date.now(), name, initials: name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase(), rating, wins: 0, draws: 0, losses: 0, points: 0 }]); setShowPlayers(false) }}><label>Name<input name="name" placeholder="e.g. Jordan Lee" required /></label><label>Rating<input name="rating" type="number" placeholder="1200" /></label><button className="button primary">Add to roster</button></form>}<div className="player-grid">{players.map((player) => <article className="player-card" key={player.id}><div className="player-avatar">{player.initials}</div><div className="player-card-info"><strong>{player.name}</strong><span>{player.rating} rating</span></div><div className="player-card-record"><strong>{player.points}</strong><span>points</span></div></article>)}</div></section>}
    {activeTab === 'History' && <section className="history-view"><div className="view-toolbar"><div><p className="eyebrow">Your archive</p><h2>Tournament history</h2></div></div>{history.length === 0 ? <div className="empty-panel"><h2>Nothing archived yet</h2></div> : <div className="history-layout"><div className="history-list">{history.map((item) => <button className="history-card" key={item.id} onClick={() => setSelectedHistory(item)}><span className="eyebrow">{item.tournament.date}</span><strong>{item.tournament.name}</strong><span>{item.players.length} players</span></button>)}</div>{selectedHistory && <article className="history-detail"><p className="eyebrow">Archived tournament</p><h2>{selectedHistory.tournament.name}</h2><h3>Final standings</h3><ol>{[...selectedHistory.players].sort((a, b) => b.points - a.points).map((player) => <li key={player.id}><span>{player.name}</span><strong>{player.points} pts</strong></li>)}</ol></article>}</div>}</section>}
    {activeTab === 'History' && selectedHistory && <button className="delete-history" onClick={() => deleteArchived(selectedHistory.id)}>Delete archived tournament</button>}
    <footer><span>{tournament.name} · {new Date(`${tournament.date}T12:00:00`).getFullYear()}</span><span>Saved locally <i className="saved-dot" /> · Last updated just now</span></footer>
  </main>
}

export default App
