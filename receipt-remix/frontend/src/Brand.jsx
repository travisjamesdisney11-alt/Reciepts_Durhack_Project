export default function Brand({ onClick }) {
  const preventNavigation = (event) => event.preventDefault()

  return (
    <a className="brand" href="#" onClick={onClick ?? preventNavigation}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 36 36" focusable="false">
          <path d="M11 7.5h15v20l-3-1.8-2.5 1.8-2.5-1.8-2.5 1.8-2.5-1.8-2 1.2z" fill="#fff8ec" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round" />
          <circle cx="15.5" cy="15.5" r="1.2" fill="#754b5d" />
          <circle cx="21.5" cy="15.5" r="1.2" fill="#754b5d" />
          <path d="M15.5 19.2q3 3 6 0" fill="none" stroke="#754b5d" strokeWidth="1.5" strokeLinecap="round" />
          <path d="m27.5 7 .9 2.2 2.1.8-2.1.9-.9 2.1-.8-2.1-2.2-.9 2.2-.8z" fill="#fff1a8" />
        </svg>
      </span>
      <span>receipt<span className="brand-light">remix</span></span>
    </a>
  )
}
