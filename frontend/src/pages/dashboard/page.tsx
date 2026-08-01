import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  return <h1>Dashboard</h1>
}
