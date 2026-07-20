export default function CriticCorrection({ correction }) {
  if (!correction?.triggered) return null

  return (
    <div className="critic-correction" role="region" aria-label="Critic self-correction">
      <div className="critic-band critic-original">
        <div className="critic-band-label">Original claim</div>
        <div className="critic-text">{correction.original_claim || '—'}</div>
      </div>
      <div className="critic-band critic-reason">
        <div className="critic-band-label">Flag reason</div>
        <div>{correction.flag_reason || 'Unsupported by retrieved records'}</div>
      </div>
      <div className="critic-band critic-corrected">
        <div className="critic-band-label">Corrected claim</div>
        <div>{correction.corrected_claim || '—'}</div>
      </div>
    </div>
  )
}
