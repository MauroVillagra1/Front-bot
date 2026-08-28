/**
 * Chat — pantalla principal del asistente "UTNIA".
 *
 * Rediseño oscuro con sidebar, inspirado en la referencia visual provista.
 *
 * Props:
 *   usuario:   objeto con { nombre, email, rol }
 *   onLogout:  función para cerrar sesión
 *   sinHeader: bool — si es true, oculta el header propio (lo maneja App.jsx)
 *
 * NOTA DE INTEGRACIÓN:
 * Este archivo es una demo autocontenida (usa una función `enviarMensaje`
 * simulada más abajo para poder previsualizarse). En tu proyecto real,
 * reemplazá esa función por tu import real:
 *
 *   import { enviarMensaje } from '../api'
 *
 * y borrá el bloque "MOCK API" de abajo.
 */
import { useState, useRef, useEffect } from 'react'
import { Send, LogOut, Sparkles, User } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────
// MOCK API — borrar este bloque e importar tu `enviarMensaje` real
// ─────────────────────────────────────────────────────────────────────────
function enviarMensaje(texto, conversacionId) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        conversacion_id: conversacionId ?? 'demo-1',
        respuesta:
          'Esta es una respuesta simulada. Conectá tu API real (`../api`) para respuestas de verdad. Preguntaste: “' +
          texto +
          '”',
      })
    }, 900)
  })
}
// ─────────────────────────────────────────────────────────────────────────

const ROLES_DISPLAY = {
  administrador:      { label: 'Administrador', color: 'bg-[#e8592e]/15 text-[#f2894f]' },
  profesor_directivo: { label: 'Profesor / Directivo', color: 'bg-emerald-500/15 text-emerald-400' },
  alumno:             { label: 'Alumno', color: 'bg-sky-500/15 text-sky-400' },
}

const PREGUNTAS_EJEMPLO = [
  '¿Cuál es el horario de AM1 en la comisión 1K01?',
  '¿Qué aula tiene Análisis Matemático II hoy?',
  '¿Cuándo es el próximo parcial de Física I?',
]

function ahora() {
  return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

// ── Logo UTNIA (asterisco dentro de anillo degradado) ────────────────────
function LogoUTNIA({ size = 36 }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-full flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: 'conic-gradient(from 200deg, #e8592e, #0a0a0c 65%, #0a0a0c 100%)',
        padding: 2,
      }}
    >
      <div className="w-full h-full rounded-full bg-[#0a0a0c] flex items-center justify-center">
        <svg viewBox="0 0 24 24" width={size * 0.5} height={size * 0.5} fill="none">
          <path
            d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"
            stroke="#f4f4f5"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}

export default function Chat({ usuario = { nombre: 'Invitado', rol: 'alumno' }, onLogout = () => {}, sinHeader = false }) {
  const [mensajes, setMensajes]             = useState([])
  const [input, setInput]                   = useState('')
  const [escribiendo, setEscribiendo]       = useState(false)
  const [conversacionId, setConversacionId] = useState(null)
  const bottomRef                            = useRef(null)
  const inputRef                             = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes, escribiendo])

  async function enviar(textoForzado) {
    const texto = (textoForzado ?? input).trim()
    if (!texto || escribiendo) return

    const msgUsuario = { id: Date.now(), tipo: 'usuario', texto, timestamp: ahora() }
    setMensajes(prev => [...prev, msgUsuario])
    setInput('')
    setEscribiendo(true)

    try {
      const data = await enviarMensaje(texto, conversacionId)
      if (data.conversacion_id) setConversacionId(data.conversacion_id)

      setMensajes(prev => [
        ...prev,
        { id: Date.now() + 1, tipo: 'asistente', texto: data.respuesta, timestamp: ahora() },
      ])
    } catch (err) {
      let textoError = 'Ocurrió un error al procesar tu consulta. Intentá de nuevo.'
      if (err.response?.status === 401) {
        textoError = 'Tu sesión expiró. Por favor volvé a iniciar sesión.'
        onLogout()
      } else if (err.response?.status === 429) {
        textoError = 'Demasiadas consultas en poco tiempo. Esperá un momento antes de continuar.'
      } else if (err.response?.data?.detail) {
        textoError = err.response.data.detail
      }
      setMensajes(prev => [...prev, { id: Date.now() + 1, tipo: 'error', texto: textoError, timestamp: ahora() }])
    } finally {
      setEscribiendo(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      enviar()
    }
  }

  const rolInfo = ROLES_DISPLAY[usuario.rol] ?? { label: usuario.rol, color: 'bg-gray-500/15 text-gray-300' }
  const hayConversacion = mensajes.length > 0

  return (
    <div className={`flex ${sinHeader ? 'h-full' : 'h-screen'} bg-[#0a0a0c] text-[#f4f4f5]`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-body { font-family: 'Inter', sans-serif; }
        .chat-scroll::-webkit-scrollbar { width: 6px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #2a2a30; border-radius: 999px; }
        .chat-scroll::-webkit-scrollbar-track { background: transparent; }
        @keyframes fadein { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .msg-in { animation: fadein 0.25s ease-out; }
      `}</style>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-16 md:w-56 flex-shrink-0 bg-[#0d0d10] border-r border-[#1e1e22] flex flex-col items-center md:items-stretch py-4">
        <div className="flex items-center gap-2.5 px-3 mb-8">
          <LogoUTNIA size={34} />
          <span className="hidden md:block font-display font-semibold text-[15px] tracking-tight">
            UTNIA
          </span>
        </div>

        <button
          onClick={() => setMensajes([])}
          className="hidden md:flex items-center gap-2 mx-3 mb-6 px-3 py-2 rounded-lg text-sm font-body font-medium
                     text-[#a8a8b3] border border-[#232327] hover:border-[#e8592e]/40 hover:text-[#f2894f]
                     transition-colors"
        >
          <Sparkles size={15} />
          Nueva consulta
        </button>

        <div className="flex-1" />

        {/* Usuario / logout */}
        <div className="px-3 pt-4 border-t border-[#1e1e22] mx-3">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-[#1a1a1e] border border-[#232327] flex items-center justify-center flex-shrink-0">
              <User size={14} className="text-[#8b8b93]" />
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-xs font-body font-medium text-[#f4f4f5] truncate">{usuario.nombre}</p>
              <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${rolInfo.color}`}>
                {rolInfo.label}
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center md:justify-start gap-2 text-xs font-body
                       text-[#8b8b93] hover:text-[#f2894f] px-2 py-1.5 rounded-lg hover:bg-[#17171b] transition-colors"
          >
            <LogOut size={13} />
            <span className="hidden md:block">Salir</span>
          </button>
        </div>
      </aside>

      {/* ── Área principal ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {!sinHeader && (
          <header className="border-b border-[#1e1e22] px-6 py-3 flex items-center justify-between">
            <p className="text-xs font-body text-[#6b6b73]">Consultas académicas</p>
          </header>
        )}

        <main className="flex-1 overflow-y-auto chat-scroll px-4">
          {!hayConversacion ? (
            /* ── Pantalla de bienvenida ─────────────────────────── */
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <LogoUTNIA size={52} />
              <h1 className="font-display text-2xl md:text-3xl font-semibold mt-6 mb-8 tracking-tight">
                Preguntale a UTNIA
              </h1>
              <div className="flex flex-col gap-2.5 w-full max-w-md">
                {PREGUNTAS_EJEMPLO.map((p) => (
                  <button
                    key={p}
                    onClick={() => enviar(p)}
                    className="font-body text-sm text-left text-[#c7c7cf] bg-[#141417] hover:bg-[#1a1a1e]
                               border border-[#232327] hover:border-[#e8592e]/40 rounded-full px-5 py-3
                               transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Historial de mensajes ──────────────────────────── */
            <div className="max-w-2xl mx-auto py-6">
              {mensajes.map(msg => (
                <div
                  key={msg.id}
                  className={`msg-in flex mb-4 ${msg.tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.tipo === 'asistente' && (
                    <div className="mr-2.5 mt-0.5 flex-shrink-0"><LogoUTNIA size={26} /></div>
                  )}
                  <div
                    className={`font-body text-sm leading-relaxed max-w-[80%] px-4 py-2.5 rounded-2xl ${
                      msg.tipo === 'usuario'
                        ? 'bg-[#e8592e] text-white rounded-br-sm'
                        : msg.tipo === 'error'
                        ? 'bg-red-500/10 text-red-300 border border-red-500/20 rounded-bl-sm'
                        : 'bg-[#17171b] text-[#e4e4e7] border border-[#232327] rounded-bl-sm'
                    }`}
                  >
                    {msg.texto}
                    <div className={`text-[10px] mt-1 ${msg.tipo === 'usuario' ? 'text-white/60' : 'text-[#6b6b73]'}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))}

              {escribiendo && (
                <div className="msg-in flex justify-start mb-4">
                  <div className="mr-2.5 mt-0.5 flex-shrink-0"><LogoUTNIA size={26} /></div>
                  <div className="bg-[#17171b] border border-[#232327] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1 items-center h-4">
                      <span className="w-1.5 h-1.5 bg-[#6b6b73] rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 bg-[#6b6b73] rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 bg-[#6b6b73] rounded-full animate-bounce" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </main>

        {/* ── Input ─────────────────────────────────────────────── */}
        <footer className="px-4 pb-5 pt-2">
          <div className="max-w-2xl mx-auto flex gap-2.5 items-end bg-[#141417] border border-[#232327]
                          focus-within:border-[#e8592e]/50 rounded-2xl px-3 py-2 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribí tu consulta..."
              rows={1}
              disabled={escribiendo}
              className="flex-1 resize-none bg-transparent font-body text-sm text-[#f4f4f5] placeholder-[#6b6b73]
                         focus:outline-none disabled:text-[#4b4b53] max-h-32 overflow-y-auto py-1.5"
              style={{ minHeight: '24px' }}
              onInput={e => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px'
              }}
            />
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || escribiendo}
              className="bg-[#e8592e] hover:bg-[#f2703f] disabled:bg-[#232327] disabled:cursor-not-allowed
                         text-white disabled:text-[#4b4b53] p-2 rounded-xl transition-colors flex-shrink-0"
              aria-label="Enviar mensaje"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[11px] font-body text-[#4b4b53] text-center mt-2.5">
            El asistente responde según la información disponible en el sistema.
          </p>
        </footer>
      </div>
    </div>
  )
}