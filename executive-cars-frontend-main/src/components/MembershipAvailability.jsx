export default function MembershipAvailability({ capability, showDemoNote = false }) {
  if (capability.available) return showDemoNote ? <p className="text-sm text-amber-800 mt-3">Demonstration only. No payment is collected.</p> : null
  return <div className="text-sm mt-3" role={capability.status === 'error' ? 'alert' : 'status'}>
    <p>{capability.status === 'loading' ? 'Checking membership activation availability…' :
      capability.status === 'error' ? 'Could not check membership activation availability.' :
        'Membership activation is currently unavailable.'}</p>
    {capability.status === 'error' && <button type="button" onClick={capability.retry} className="font-bold text-blue-700 underline mt-2">Retry</button>}
  </div>
}
