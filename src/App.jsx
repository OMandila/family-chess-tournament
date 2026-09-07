import { useEffect, useMemo, useState } from 'react'
import './App.css'

const initialPlayers = [
  { id: 1, name: 'Oliver Mandila', initials: 'OM', rating: 1240, wins: 2, draws: 0, losses: 0, points: 2 },
  { id: 2, name: 'Maya Mandila', initials: 'MM', rating: 1180, wins: 1, draws: 1, losses: 0, points: 1.5 },
  { id: 3, name: 'Sam Carter', initials: 'SC', rating: 1120, wins: 1, draws: 0, losses: 1, points: 1 },
  { id: 4, name: 'Nadia Khan', initials: 'NK', rating: 1050, wins: 0, draws: 1, losses: 1, points: 0.5 },
  { id: 5, name: 'Theo Mandila', initials: 'TM', rating: 980, wins: 0, draws: 1, losses: 1, points: 0.5 },
  { id: 6, name: 'Aisha Carter', initials: 'AC', rating: 920, wins: 0, draws: 0, losses: 2, points: 0 },
]

const initialPairings = [
  { id: 'round-2-1', white: 1, black: 2 },
  { id: 'round-2-2', white: 3, black: 4 },
  { id: 'round-2-3', white: 5, black: 6 },
]

const totalRounds = 4

function App() {
  const [players, setPlayers] = useState(() => {
    const savedPlayers = localStorage.getItem('family-chess-players')
    return savedPlayers ? JSON.parse(savedPlayers) : initialPlayers
  })
  const [activeTab, setActiveTab] = useState('Overview')
  const [round, setRound] = useState(2)
  const [roundResults, setRoundResults] = useState(() => JSON.parse(localStorage.getItem('family-chess-results') || '{}'))
  const [showPlayerForm, setShowPlayerForm] = useState(false)
  const [newPlayer, setNewPlayer] = useState({ name: '', rating: '' })
  const standings = useMemo(() => [...players].sort((a, b) => b.points - a.points || b.rating - a.rating), [players])
  // Every game appears in two player records, so divide the record total by two.
  const tournamentStats = useMemo(() => {
    const playerGameRecords = players.reduce((total, player) => total + player.wins + player.draws + player.losses, 0)
    const gamesPlayed = playerGameRecords / 2
    const totalGames = (players.length * (players.length - 1) * totalRounds) / 2
    return { gamesPlayed, totalGames, gamesRemaining: Math.max(totalGames - gamesPlayed, 0) }
  }, [players])

  useEffect(() => {
    localStorage.setItem('family-chess-players', JSON.stringify(players))
  }, [players])

  useEffect(() => {
    localStorage.setItem('family-chess-results', JSON.stringify(roundResults))
  }, [roundResults])

  function recordResult(pairing, result) {
    if (roundResults[pairing.id]) return
    const changes = {
      'white-win': [[1, 0, 0, 1], [0, 0, 1, 0]],
      draw: [[0, 1, 0, 0.5], [0, 1, 0, 0.5]],
      'black-win': [[0, 0, 1, 0], [1, 0, 0, 1]],
    }
    const [whiteChange, blackChange] = changes[result]
    setPlayers((current) => current.map((player) => {
      const change = player.id === pairing.white ? whiteChange : player.id === pairing.black ? blackChange : null
      if (!change) return player
      const [wins, draws, losses, points] = change
      return { ...player, wins: player.wins + wins, draws: player.draws + draws, losses: player.losses + losses, points: player.points + points }
    }))
    setRoundResults((current) => ({ ...current, [pairing.id]: result }))
  }

  function addPlayer(event) {
    event.preventDefault()
    const name = newPlayer.name.trim()
    const rating = Number(newPlayer.rating)
    if (!name || !rating) return
    const initials = name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    setPlayers((current) => [...current, { id: Date.now(), name, initials, rating, wins: 0, draws: 0, losses: 0, points: 0 }])
    setNewPlayer({ name: '', rating: '' })
    setShowPlayerForm(false)
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Family Chess home"><span className="brand-mark">FC</span><span>Family Chess</span></a>
        <nav aria-label="Main navigation">{['Overview', 'Players', 'History'].map((tab) => <button className={activeTab === tab ? 'nav-link active' : 'nav-link'} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>)}</nav>
        <button className="avatar" aria-label="Open profile">OM</button>
      </header>

      <section className="page-heading">
        <div><p className="eyebrow">Sunday, 7 September 2026</p><h1>{activeTab === 'Overview' ? 'Autumn Family Cup' : activeTab}</h1><p className="subheading">A friendly tournament for family and friends.</p></div>
        <div className="heading-actions"><button className="button secondary">Export</button><button className="button primary">+ New tournament</button></div>
      </section>

      {activeTab === 'Overview' ? <>
        <section className="stats-grid" aria-label="Tournament summary">
          <article className="stat-card accent"><span className="stat-label">Tournament progress</span><strong>Round {round} <small>of {totalRounds}</small></strong><div className="progress"><span style={{ width: `${(round / totalRounds) * 100}%` }} /></div><span className="stat-foot">{Math.round((round / totalRounds) * 100)}% complete</span></article>
          <article className="stat-card"><span className="stat-label">Players</span><strong>{players.length} <small>players</small></strong><span className="stat-foot online"><i /> All checked in</span></article>
          <article className="stat-card"><span className="stat-label">Games played</span><strong>{tournamentStats.gamesPlayed} <small>of {tournamentStats.totalGames}</small></strong><span className="stat-foot">{tournamentStats.gamesRemaining} games remaining</span></article>
          <article className="stat-card"><span className="stat-label">Next round</span><strong>14:30</strong><span className="stat-foot">Starts in 42 minutes</span></article>
        </section>

        <section className="content-grid">
          <article className="panel standings-panel"><div className="panel-header"><div><p className="eyebrow">Live results</p><h2>Standings</h2></div><button className="text-button">View full table <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Rating</th><th>W</th><th>D</th><th>L</th><th>Points</th></tr></thead><tbody>{standings.map((player, index) => <tr key={player.id}><td className="rank">{index + 1}</td><td><div className="player-cell"><span className={`player-avatar avatar-${index + 1}`}>{player.initials}</span><span>{player.name}{index === 0 && <em>Leader</em>}</span></div></td><td className="muted">{player.rating}</td><td>{player.wins}</td><td>{player.draws}</td><td>{player.losses}</td><td className="points">{player.points % 1 === 0 ? player.points : player.points.toFixed(1)}</td></tr>)}</tbody></table></div></article>
          <article className="panel round-panel"><div className="panel-header"><div><p className="eyebrow">Pairings</p><h2>Round {round}</h2></div><select value={round} onChange={(event) => setRound(Number(event.target.value))} aria-label="Select round"><option value="1">Round 1</option><option value="2">Round 2</option><option value="3">Round 3</option><option value="4">Round 4</option></select></div><div className="pairings">{initialPairings.map((pairing) => { const white = players.find((player) => player.id === pairing.white); const black = players.find((player) => player.id === pairing.black); const result = roundResults[pairing.id]; return <div className="pairing" key={pairing.id}><div><strong>{white?.name || 'Player removed'}</strong><span className="vs">vs</span><strong>{black?.name || 'Player removed'}</strong></div>{result ? <span className="result done">{result === 'white-win' ? '1 - 0' : result === 'black-win' ? '0 - 1' : '½ - ½'}</span> : <div className="result-actions"><button className="result pending" onClick={() => recordResult(pairing, 'white-win')}>White wins</button><button className="result pending" onClick={() => recordResult(pairing, 'draw')}>Draw</button><button className="result pending" onClick={() => recordResult(pairing, 'black-win')}>Black wins</button></div>}</div> })}</div><button className="button outline full">Manage pairings <span>→</span></button></article>
        </section>
      </> : activeTab === 'Players' ? <section className="players-view"><div className="view-toolbar"><div><p className="eyebrow">Tournament roster</p><h2>Players</h2><p className="subheading">Manage everyone taking part in the Autumn Family Cup.</p></div><button className="button primary" onClick={() => setShowPlayerForm((visible) => !visible)}>+ Add player</button></div>{showPlayerForm && <form className="add-player-form" onSubmit={addPlayer}><label>Name<input value={newPlayer.name} onChange={(event) => setNewPlayer({ ...newPlayer, name: event.target.value })} placeholder="e.g. Jordan Lee" autoFocus /></label><label>Rating<input type="number" min="1" value={newPlayer.rating} onChange={(event) => setNewPlayer({ ...newPlayer, rating: event.target.value })} placeholder="1200" /></label><button className="button primary" type="submit">Add to roster</button></form>}<div className="player-grid">{players.map((player, index) => <article className="player-card" key={player.id}><div className={`player-avatar avatar-${(index % 6) + 1}`}>{player.initials}</div><div className="player-card-info"><strong>{player.name}</strong><span>{player.rating} rating</span></div><div className="player-card-record"><strong>{player.points}</strong><span>points</span></div><button className="remove-player" aria-label={`Remove ${player.name}`} onClick={() => setPlayers((current) => current.filter((item) => item.id !== player.id))}>×</button></article>)}</div></section> : <section className="empty-panel"><p className="eyebrow">Coming next</p><h2>{activeTab} view</h2><p>This area will become the home for your tournament history.</p><button className="button primary" onClick={() => setActiveTab('Overview')}>Back to overview</button></section>}

      <footer><span>Autumn Family Cup · 2026</span><span>Saved locally <i className="saved-dot" /> · Last updated just now</span></footer>
    </main>
  )
}

export default App
