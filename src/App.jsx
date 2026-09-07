import { useMemo, useState } from 'react'
import './App.css'

const initialPlayers = [
  { id: 1, name: 'Oliver Mandila', initials: 'OM', rating: 1240, wins: 2, draws: 0, losses: 0, points: 2 },
  { id: 2, name: 'Maya Mandila', initials: 'MM', rating: 1180, wins: 1, draws: 1, losses: 0, points: 1.5 },
  { id: 3, name: 'Sam Carter', initials: 'SC', rating: 1120, wins: 1, draws: 0, losses: 1, points: 1 },
  { id: 4, name: 'Nadia Khan', initials: 'NK', rating: 1050, wins: 0, draws: 1, losses: 1, points: 0.5 },
  { id: 5, name: 'Theo Mandila', initials: 'TM', rating: 980, wins: 0, draws: 1, losses: 1, points: 0.5 },
  { id: 6, name: 'Aisha Carter', initials: 'AC', rating: 920, wins: 0, draws: 0, losses: 2, points: 0 },
]

function App() {
  const [players, setPlayers] = useState(initialPlayers)
  const [activeTab, setActiveTab] = useState('Overview')
  const [round, setRound] = useState(2)
  const standings = useMemo(() => [...players].sort((a, b) => b.points - a.points || b.rating - a.rating), [players])

  function updateResult(playerId, result) {
    const changes = { win: [1, 0, 0, 1], draw: [0, 1, 0, 0.5], loss: [0, 0, 1, 0] }
    setPlayers((current) => current.map((player) => {
      if (player.id !== playerId) return player
      const [wins, draws, losses, points] = changes[result]
      return { ...player, wins: player.wins + wins, draws: player.draws + draws, losses: player.losses + losses, points: player.points + points }
    }))
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
          <article className="stat-card accent"><span className="stat-label">Tournament progress</span><strong>Round {round} <small>of 4</small></strong><div className="progress"><span style={{ width: `${round * 25}%` }} /></div><span className="stat-foot">{round * 25}% complete</span></article>
          <article className="stat-card"><span className="stat-label">Players</span><strong>6 <small>players</small></strong><span className="stat-foot online"><i /> All checked in</span></article>
          <article className="stat-card"><span className="stat-label">Games played</span><strong>6 <small>of 12</small></strong><span className="stat-foot">4 games remaining</span></article>
          <article className="stat-card"><span className="stat-label">Next round</span><strong>14:30</strong><span className="stat-foot">Starts in 42 minutes</span></article>
        </section>

        <section className="content-grid">
          <article className="panel standings-panel"><div className="panel-header"><div><p className="eyebrow">Live results</p><h2>Standings</h2></div><button className="text-button">View full table <span>→</span></button></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Player</th><th>Rating</th><th>W</th><th>D</th><th>L</th><th>Points</th></tr></thead><tbody>{standings.map((player, index) => <tr key={player.id}><td className="rank">{index + 1}</td><td><div className="player-cell"><span className={`player-avatar avatar-${index + 1}`}>{player.initials}</span><span>{player.name}{index === 0 && <em>Leader</em>}</span></div></td><td className="muted">{player.rating}</td><td>{player.wins}</td><td>{player.draws}</td><td>{player.losses}</td><td className="points">{player.points % 1 === 0 ? player.points : player.points.toFixed(1)}</td></tr>)}</tbody></table></div></article>
          <article className="panel round-panel"><div className="panel-header"><div><p className="eyebrow">Pairings</p><h2>Round {round}</h2></div><select value={round} onChange={(event) => setRound(Number(event.target.value))} aria-label="Select round"><option value="1">Round 1</option><option value="2">Round 2</option><option value="3">Round 3</option><option value="4">Round 4</option></select></div><div className="pairings"><div className="pairing"><div><strong>Oliver Mandila</strong><span className="vs">vs</span><strong>Maya Mandila</strong></div><span className="result done">1 - 0</span></div><div className="pairing"><div><strong>Sam Carter</strong><span className="vs">vs</span><strong>Nadia Khan</strong></div><button className="result pending" onClick={() => updateResult(3, 'draw')}>Enter result</button></div><div className="pairing"><div><strong>Theo Mandila</strong><span className="vs">vs</span><strong>Aisha Carter</strong></div><button className="result pending" onClick={() => updateResult(5, 'win')}>Enter result</button></div></div><button className="button outline full">Manage pairings <span>→</span></button></article>
        </section>
      </> : <section className="empty-panel"><p className="eyebrow">Coming next</p><h2>{activeTab} view</h2><p>This area will become the home for your {activeTab.toLowerCase()} and tournament history.</p><button className="button primary" onClick={() => setActiveTab('Overview')}>Back to overview</button></section>}

      <footer><span>Autumn Family Cup · 2026</span><span>Live session <i className="saved-dot" /> · Last updated just now</span></footer>
    </main>
  )
}

export default App
