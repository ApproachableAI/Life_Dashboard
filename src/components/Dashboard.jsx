import { useEffect, useState } from 'react'
import TopBar from './TopBar'
import ThisWeekView from './ThisWeekView'
import SharedView from './SharedView'
import BusinessView from './BusinessView'
import LaneSettings from './LaneSettings'

export default function Dashboard({ data, setData, saving, userEmail, onSignOut }) {
  // Default to Jordyn on load.
  const [view, setView] = useState('jordyn')
  const [settingsOpen, setSettingsOpen] = useState(false)

  const lanes = data.settings?.lanes ?? []

  // Tint the page background per view so each zone has its own color identity.
  useEffect(() => {
    document.body.dataset.view = view
    return () => {
      delete document.body.dataset.view
    }
  }, [view])

  return (
    <div className="app">
      <TopBar
        view={view}
        setView={setView}
        saving={saving}
        userEmail={userEmail}
        onOpenSettings={() => setSettingsOpen(true)}
        onSignOut={onSignOut}
      />

      <main className="main">
        {view === 'shared' ? (
          <SharedView data={data} setData={setData} />
        ) : view === 'business' ? (
          <BusinessView data={data} setData={setData} />
        ) : (
          // key={view} resets week navigation to the current week when you
          // switch between Jordyn and Ty.
          <ThisWeekView
            key={view}
            person={view}
            data={data}
            setData={setData}
            lanes={lanes}
          />
        )}
      </main>

      {settingsOpen && (
        <LaneSettings
          lanes={lanes}
          setData={setData}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
