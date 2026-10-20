export const Label = ({ title }: { title: string }) => (
  <span
    role="note"
    className={[
      'a-class-long-enough-to-break-the-line',
      'another-class-long-enough-to-break-the-line',
      'a-third-class-long-enough-to-break-the-line',
    ].join(' ')}
  >
    {title}
  </span>
)
