export function hasActiveMembership(user) {
  if (!user) return false
  return (user.capabilities?.auction === true || user.subscriptionStatus === 'active')
    && Boolean(user.subscriptionExpiry)
    && new Date(user.subscriptionExpiry).getTime() > Date.now()
}
