import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Send } from 'lucide-react'
import { api } from '../api/client'
import CriticCorrection from '../components/CriticCorrection'
import { useCrossLink } from '../context/CrossLinkContext'

function CitationRail({ citations }) {
  if (!citations?.length) {
    return (
      <div className="empty-state">
        <h3>Citations</h3>
        <p>Source excerpts appear here after you ask.</p>
      </div>
    )
  }
  return (
    <div className="citation-list">
      {citations.map((c, i) => (
        <div key={c.record_id || i} className="citation-item">
          <div className="citation-ref">{c.case_ref || c.record_id || `Source ${i + 1}`}</div>
          <p className="citation-excerpt">{c.excerpt || 'No excerpt'}</p>
        </div>
      ))}
    </div>
  )
}

export default function Ask() {
  const navigate = useNavigate()
  const { resolved, pinToSee, clearPin } = useCrossLink()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [citations, setCitations] = useState([])
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const seeded = useRef(false)

  useEffect(() => {
    if (seeded.current) return
    if (resolved?.suggested_query) {
      setInput(resolved.suggested_query)
      seeded.current = true
    } else if (resolved?.zone_id && resolved?.target === 'ask') {
      setInput(`Summarize recent cases in zone ${resolved.zone_id}.`)
      seeded.current = true
    }
  }, [resolved])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, pending])

  const send = async (e) => {
    e?.preventDefault()
    const query = input.trim()
    if (!query || pending) return

    setError('')
    setInput('')
    setPending(true)
    setMessages((m) => [...m, { role: 'user', text: query }])

    try {
      const res = await api.ask(query)
      setCitations(res.citations || [])
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          text: res.answer,
          correction: res.correction,
          confidence: res.confidence,
          audit_id: res.audit_id,
          citations: res.citations,
          caseRefs: (res.citations || []).map((c) => c.case_ref).filter(Boolean),
        },
      ])
    } catch (err) {
      setError(err.message || 'Ask failed')
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: `Unable to complete that query: ${err.message}`, error: true },
      ])
    } finally {
      setPending(false)
    }
  }

  const pinAnswer = async (msg) => {
    const case_ref = msg.caseRefs?.[0] || null
    const zone_id = resolved?.zone_id || null
    await pinToSee({ case_ref, zone_id })
    navigate('/app/see')
  }

  return (
    <div className="app-content flush" style={{ padding: 16 }}>
      {resolved?.fallback && (
        <div className="banner banner-warning" style={{ marginBottom: 12 }}>
          {resolved.fallback}
          <button type="button" className="btn btn-sm btn-ghost" onClick={clearPin} style={{ marginLeft: 'auto' }}>
            Dismiss
          </button>
        </div>
      )}
      {resolved?.zone_id && resolved?.target === 'ask' && (
        <div className="banner banner-info" style={{ marginBottom: 12 }}>
          Context pinned from SEE — zone <code className="mono">{resolved.zone_id}</code>
          {resolved.record?.fir_number && (
            <> · case <code className="mono">{resolved.record.fir_number}</code></>
          )}
        </div>
      )}

      <div className="ask-layout">
        <div className="ask-chat-pane">
          <div className="ask-messages">
            {messages.length === 0 && !pending && (
              <div className="empty-state">
                <h3>Ask ARGUS</h3>
                <p>Query case records. Answers arrive cited — and critic-checked.</p>
                <p className="form-hint" style={{ marginTop: 12 }}>
                  Canary hint: queries that invent unsupported weapon claims will trigger a visible correction.
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`msg ${msg.role === 'user' ? 'msg-user' : 'msg-assistant'}`}>
                {msg.role === 'user' ? (
                  msg.text
                ) : (
                  <>
                    <div className="msg-assistant-body">
                      {msg.text}
                      {msg.correction?.triggered && (
                        <CriticCorrection correction={msg.correction} />
                      )}
                    </div>
                    {!msg.error && (
                      <div className="msg-meta">
                        {typeof msg.confidence === 'number' && (
                          <span className="badge">
                            Confidence <span className="mono">{msg.confidence.toFixed(2)}</span>
                          </span>
                        )}
                        {msg.correction?.triggered && (
                          <span className="badge badge-amber">Critic corrected</span>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => pinAnswer(msg)}
                        >
                          <MapPin size={14} /> Pin to SEE
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
            {pending && (
              <div className="msg msg-assistant">
                <div className="msg-assistant-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="skeleton" style={{ width: '90%' }} />
                  <div className="skeleton" style={{ width: '70%' }} />
                  <div className="skeleton" style={{ width: '40%' }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && <div className="inline-alert" style={{ margin: '0 12px 8px' }}>{error}</div>}

          <form className="ask-composer" onSubmit={send}>
            <textarea
              className="form-textarea"
              placeholder="Ask about a case, zone, or pattern…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              rows={2}
              disabled={pending}
            />
            <button type="submit" className="btn btn-primary" disabled={pending || !input.trim()} style={{ cursor: pending ? 'progress' : 'pointer' }}>
              {pending ? <span className="spinner" /> : <Send size={16} />}
              Send
            </button>
          </form>
        </div>

        <div className="ask-citations-pane">
          <div className="citations-header">Citations & sources</div>
          <CitationRail citations={citations} />
        </div>
      </div>
    </div>
  )
}
