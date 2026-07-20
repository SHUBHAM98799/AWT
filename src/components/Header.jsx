export default function Header({ name, studentName }) {
  const displayName = name || studentName || 'Student Name'
  return (
    <header>
      <h1>{displayName}</h1>
      <p>Student Portfolio</p>
    </header>
  )
}
