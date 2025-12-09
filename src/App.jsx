import { useState, useEffect, useRef } from 'react'
import './App.css'


const getNamesForLetter = (letter) => {
  return { authorName: letter.author, counterpartName: letter.recipient }
}

const buildThreadsFromLetters = (items) => {
  const letterById = new Map(items.map((letter) => [letter.id, letter]))

  return items.map((letter) => {
    const { authorName, counterpartName } = getNamesForLetter(letter)

    const flatText = (letter.text || '').replace(/\s+/g, ' ').trim()
    const snippet =
      flatText.length > 140 ? `${flatText.slice(0, 140).trimEnd()}…` : flatText

    // Собираем всю цепочку reply_to от корня до текущего письма
    const chain = []
    const visited = new Set()
    let current = letter

    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      chain.push(current)

      const replyToId = current.reply_to
      if (!replyToId) {
        break
      }
      current = letterById.get(replyToId) || null
    }

    const orderedChain = chain.slice().reverse()

    const messages = orderedChain.map((entry) => {
      const { authorName: entryAuthor, counterpartName: entryCounterpart } =
        getNamesForLetter(entry)

      return {
        id: `m-${entry.id}`,
        from: entryAuthor,
        to: entryCounterpart,
        time: entry.date,
        body: entry.text,
      }
    })

    return {
      id: String(letter.id),
      subject: `${letter.date} • ${letter.location}`,
      snippet,
      participants: [authorName, counterpartName],
      labels: ['Inbox'],
      unread: false,
      updatedAt: letter.iso_date || letter.date,
      messages,
    }
  })
}

const MESSAGES_VISIBLE_LIMIT = 5

const PEOPLE = ['All Contacts', 'Nikolai', 'Alexandra', 'Wilhelm']

function App() {
  const [threads, setThreads] = useState([])
  const [activeSection, setActiveSection] = useState('inbox')
  const [selectedPerson, setSelectedPerson] = useState('All Contacts')
  const [selectedThreadId, setSelectedThreadId] = useState(null)
  const [isThreadOpen, setIsThreadOpen] = useState(false)
  const [showAllMessages, setShowAllMessages] = useState(false)
  const listScrollPositionRef = useRef(0)
  const listContainerRef = useRef(null) // оставляем ref, вдруг пригодится для других задач

  useEffect(() => {
    setShowAllMessages(false)
  }, [selectedThreadId])

  useEffect(() => {
    if (!isThreadOpen) {
      const y = listScrollPositionRef.current ?? 0
      // даём React дорендерить список, а потом восстанавливаем скролл окна
      requestAnimationFrame(() => {
        window.scrollTo(0, y)
      })
    }
  }, [isThreadOpen])

  useEffect(() => {
    const loadLetters = async () => {
      try {
        // Use environment variable for API URL, fallback to localhost for dev
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        let url = `${apiBaseUrl}/letters`
        if (selectedPerson !== 'All Contacts') {
          url += `?author=${encodeURIComponent(selectedPerson)}`
        }
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch letters')
        }
        const data = await response.json()
        const threadsData = buildThreadsFromLetters(data)
        setThreads(threadsData)
      } catch (error) {
        console.error('Error fetching letters:', error)
      }
    }
    loadLetters()
  }, [selectedPerson])

  const filteredThreads = threads.filter((thread) => {
    if (activeSection === 'starred') {
      return thread.labels?.includes('Starred')
    }
    if (activeSection === 'sent') {
      return thread.labels?.includes('Sent')
    }
    // inbox
    return thread.labels?.includes('Inbox')
  })

  const selectedThread = filteredThreads.find((t) => t.id === selectedThreadId) ?? null

  const currentSectionTitle =
    activeSection === 'starred' ? 'Starred' : activeSection === 'sent' ? 'Sent' : 'Inbox'

  const allMessages = selectedThread?.messages ?? []
  const hasHiddenMessages = allMessages.length > MESSAGES_VISIBLE_LIMIT
  const hiddenCount = hasHiddenMessages ? allMessages.length - MESSAGES_VISIBLE_LIMIT : 0
  const messagesToRender =
    showAllMessages || !hasHiddenMessages
      ? allMessages
      : allMessages.slice(-MESSAGES_VISIBLE_LIMIT)

  return (
    <div className="app gmail">
      <div className="gmail-shell">
        <header className="gmail-topbar">
          <div className="gmail-topbar-left">
            <span className="gmail-logo-dot" />
            <span className="gmail-logo-text">Gmail</span>
          </div>
          <div className="gmail-topbar-right">
            <span className="gmail-user-pill">you@gmail.com</span>
          </div>
        </header>

        <div className="gmail-main">
          <aside className="gmail-nav">
            <div className="gmail-nav-inner">
              <button type="button" className="gmail-compose-button">
                Compose
              </button>

              <div className="gmail-nav-section">
                <button
                  type="button"
                  className={`gmail-nav-item${
                    activeSection === 'inbox' ? ' gmail-nav-item--active' : ''
                  }`}
                  onClick={() => setActiveSection('inbox')}
                >
                  Inbox
                </button>
                <button
                  type="button"
                  className={`gmail-nav-item${
                    activeSection === 'starred' ? ' gmail-nav-item--active' : ''
                  }`}
                  onClick={() => setActiveSection('starred')}
                >
                  Starred
                </button>
                <button
                  type="button"
                  className={`gmail-nav-item${
                    activeSection === 'sent' ? ' gmail-nav-item--active' : ''
                  }`}
                  onClick={() => setActiveSection('sent')}
                >
                  Sent
                </button>
              </div>

              <div className="gmail-people">
                <div className="gmail-people-title">People</div>
                <div className="gmail-people-list">
                  {PEOPLE.map((person) => (
                    <button
                      key={person}
                      type="button"
                      className={`gmail-people-item${
                        selectedPerson === person ? ' gmail-people-item--active' : ''
                      }`}
                      onClick={() => setSelectedPerson(person)}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="gmail-list-column" ref={listContainerRef}>
            {isThreadOpen && selectedThread ? (
              <div className="gmail-thread-view">
                <header className="gmail-thread-header">
                  <button
                    type="button"
                    className="gmail-back-to-list"
                    onClick={() => setIsThreadOpen(false)}
                  >
                    ← Back to {currentSectionTitle}
                  </button>
                  <div>
                    <div className="gmail-thread-header-subject">{selectedThread.subject}</div>
                    <div className="gmail-thread-header-participants">
                      <span>
                        <strong>Автор письма:</strong> {selectedThread.participants[0]}
                      </span>
                      {' · '}
                      <span>
                        <strong>Адресат:</strong> {selectedThread.participants[1]}
                      </span>
                    </div>
                    <div className="gmail-thread-header-thread-meta">
                      Цепочка писем · {selectedThread.messages.length}{' '}
                      {selectedThread.messages.length === 1 ? 'сообщение' : 'сообщения'}
                    </div>
                  </div>
                </header>

                <main className="gmail-messages">
                  {hasHiddenMessages && !showAllMessages ? (
                    <button
                      type="button"
                      className="gmail-thread-show-older"
                      onClick={() => setShowAllMessages(true)}
                    >
                      Показать предыдущие {hiddenCount}{' '}
                      {hiddenCount === 1
                        ? 'письмо'
                        : hiddenCount > 1 && hiddenCount < 5
                        ? 'письма'
                        : 'писем'}
                    </button>
                  ) : null}

                  {messagesToRender.map((message) => (
                    <article key={message.id} className="gmail-message">
                      <header className="gmail-message-header">
                        <div className="gmail-message-from-to">
                          <div className="gmail-message-from">
                            <strong>От:</strong> {message.from}
                          </div>
                          <div className="gmail-message-to">
                            <strong>Кому:</strong> {message.to}
                          </div>
                        </div>
                        <div className="gmail-message-meta">
                          <div className="gmail-message-time">{message.time}</div>
                        </div>
                      </header>
                      <div className="gmail-message-body">{message.body}</div>
                    </article>
                  ))}
                </main>
              </div>
            ) : (
              <>
                <div className="gmail-sidebar-header">
                  <h1 className="gmail-sidebar-title">{currentSectionTitle}</h1>
                  <span className="gmail-sidebar-count">{filteredThreads.length}</span>
                </div>

                {filteredThreads.length === 0 ? (
                  <div className="gmail-empty-state">
                    В разделе {currentSectionTitle} пока нет писем.
                  </div>
                ) : (
                  <div className="gmail-thread-list">
                    {filteredThreads.map((thread) => (
                      <button
                        key={thread.id}
                        type="button"
                        className={`gmail-thread-row${thread.unread ? ' gmail-thread-row--unread' : ''}`}
                        onClick={() => {
                          listScrollPositionRef.current = window.scrollY ?? 0
                          setSelectedThreadId(thread.id)
                          setIsThreadOpen(true)
                        }}
                      >
                        <div className="gmail-thread-row-main">
                          <div className="gmail-thread-subject">{thread.subject}</div>
                          <div className="gmail-thread-meta">
                            <span className="gmail-thread-participants">
                              <strong>Автор:</strong> {thread.participants[0]} ·{' '}
                              <strong>Адресат:</strong> {thread.participants[1]}
                            </span>
                            <span className="gmail-thread-time">{thread.updatedAt}</span>
                          </div>
                        </div>
                        <div className="gmail-thread-snippet">{thread.snippet}</div>
                        {thread.labels?.length ? (
                          <div className="gmail-thread-labels">
                            {thread.labels.map((label) => (
                              <span key={label} className="gmail-label-pill">
                                {label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

export default App
