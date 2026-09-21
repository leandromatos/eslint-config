import { useState } from 'react'

export const Panel = ({ open }: { open: boolean }) => {
  if (open) {
    const [value] = useState(0)

    return <span>{value}</span>
  }

  return null
}
