import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/imports')({
  component: ImportsPage,
})

function ImportsPage() {
  return <h1>Imports</h1>
}
