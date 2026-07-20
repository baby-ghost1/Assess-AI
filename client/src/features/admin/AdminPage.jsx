import { useState } from 'react'
import { LayoutDashboard, Users, Shield, Settings2 } from 'lucide-react'
import AdminOverview from './AdminOverview'
import UserManagement from './UserManagement'
import RoleManagement from './RoleManagement'
import SystemSettings from './SystemSettings'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, component: AdminOverview },
  { id: 'users', label: 'Users', icon: Users, component: UserManagement },
  { id: 'roles', label: 'Roles', icon: Shield, component: RoleManagement },
  { id: 'settings', label: 'Settings', icon: Settings2, component: SystemSettings },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const ActiveComponent = TABS.find((t) => t.id === activeTab)?.component

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-text-primary">Admin Panel</h2>
        <p className="text-sm text-text-secondary mt-1">Manage users, roles, and system settings</p>
      </div>

      <div className="flex gap-1 border-b border-border pb-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary'
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          )
        })}
      </div>

      {ActiveComponent && <ActiveComponent />}
    </div>
  )
}
