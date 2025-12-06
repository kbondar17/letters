import { useState } from 'react'
import './App.css'
import letters from '../merged_letters.json'

const AUTHOR_DISPLAY = {
  Nickolai: 'Николай II',
  Alexandra: 'Александра Фёдоровна',
}

const buildThreadsFromLetters = (items) =>
  items.map((letter) => {
    const authorKey = letter.author
    const authorName = AUTHOR_DISPLAY[authorKey] ?? 'Неизвестный автор'
    const counterpartName =
      authorKey === 'Nickolai'
        ? 'Александра Фёдоровна'
        : authorKey === 'Alexandra'
        ? 'Николай II'
        : 'Супруг(а)'

    const flatText = (letter.text || '').replace(/\s+/g, ' ').trim()
    const snippet =
      flatText.length > 140 ? `${flatText.slice(0, 140).trimEnd()}…` : flatText

    return {
      id: String(letter.id),
      subject: `${letter.date} • ${letter.location}`,
      snippet,
      participants: [authorName, counterpartName],
      labels: ['Inbox'],
      unread: false,
      updatedAt: letter.iso_date || letter.date,
      messages: [
        {
          id: `m-${letter.id}`,
          from: authorName,
          to: counterpartName,
          time: letter.date,
          body: letter.text,
        },
      ],
    }
  })

const LETTER_THREADS = buildThreadsFromLetters(letters)

const PEOPLE = ['All Contacts', 'Николай II', 'Александра Фёдоровна', 'Неизвестный автор']

function App() {
  const [threads] = useState(LETTER_THREADS)
  const [activeSection, setActiveSection] = useState('inbox')
  const [selectedThreadId, setSelectedThreadId] = useState(null)
  const [isThreadOpen, setIsThreadOpen] = useState(false)

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
                    <button key={person} type="button" className="gmail-people-item">
                      {person}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <section className="gmail-list-column">
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
                      {selectedThread.participants.join(' · ')}
                    </div>
                    <div className="gmail-thread-header-thread-meta">
                      Цепочка писем · {selectedThread.messages.length}{' '}
                      {selectedThread.messages.length === 1 ? 'сообщение' : 'сообщения'}
                    </div>
                  </div>
                </header>

                <main className="gmail-messages">
                  {selectedThread.messages.map((message) => (
                    <article key={message.id} className="gmail-message">
                      <header className="gmail-message-header">
                        <div className="gmail-message-from">{message.from}</div>
                        <div className="gmail-message-meta">
                          <div className="gmail-message-to">{message.to}</div>
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
                          setSelectedThreadId(thread.id)
                          setIsThreadOpen(true)
                        }}
                      >
                        <div className="gmail-thread-row-main">
                          <div className="gmail-thread-subject">{thread.subject}</div>
                          <div className="gmail-thread-meta">
                            <span className="gmail-thread-participants">
                              {thread.participants.join(' · ')}
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
