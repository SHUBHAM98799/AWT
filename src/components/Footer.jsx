export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-socials">
        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="social-link">
          [ GitHub ]
        </a>
        <a href="https://www.linkedin.com/in/shubham-dholakiya-054512271/" target="_blank" rel="noopener noreferrer" className="social-link">
          [ LinkedIn ]
        </a>
        <a href="mailto:shubhamdholakiya@example.com" className="social-link">
          [ Email ]
        </a>
      </div>
      <p className="footer-copyright">
        © {new Date().getFullYear()} SHUBHAM DHOLAKIYA. CORE CORE PROTOCOL ACTIVE.
      </p>
    </footer>
  )
}
