import { useState } from 'react'

export default function Contact() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [showHelp, setShowHelp] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    alert(`Transmission encrypted! Thank you, ${name}. Message received successfully.`)
    setName('')
    setEmail('')
    setMessage('')
  }

  return (
    <section>
      <h2>// CONTACT INITIATION</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
        Open a secure communication socket. Enter your parameters to send a message.
      </p>

      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-group">
          <label htmlFor="name">System: User Name</label>
          <input
            type="text"
            id="name"
            className="form-control"
            placeholder="Identity e.g. John Doe"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">System: Network Address</label>
          <input
            type="email"
            id="email"
            className="form-control"
            placeholder="Mail e.g. user@network.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="message">System: Payload Data</label>
          <textarea
            id="message"
            className="form-control"
            rows={5}
            placeholder="Type your message payload..."
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="contact-meta">
          <span>Payload size: {message.length} characters</span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn" onClick={() => setShowHelp(s => !s)}>
              Help
            </button>
            <button type="submit" className="btn-primary">
              Send Transmission
            </button>
          </div>
        </div>
      </form>

      {showHelp && (
        <div className="help-box">
          <p style={{ margin: 0 }}>
            This form is connected to React state values. Upon clicking 'Send Transmission', 
            a prompt mock submission executes, verifying fields are complete.
          </p>
        </div>
      )}
    </section>
  )
}
