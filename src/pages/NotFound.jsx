import { Link } from 'react-router-dom'
import { Paisley } from '../components/Decorations.jsx'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center">
      <Paisley size={120} className="mx-auto text-terracotta-300 animate-sway" />
      <h1 className="mt-6 font-display text-5xl">404</h1>
      <p className="mt-2 font-hand text-2xl text-terracotta-500">
        That page slipped between the threads.
      </p>
      <div className="mt-6">
        <Link to="/" className="btn-primary">Back home</Link>
      </div>
    </div>
  )
}
