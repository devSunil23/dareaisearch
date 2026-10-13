export default function ErrorPanel({ title = "Couldn't load orders", error, onRetry, compact = false }) {
  return (
    <div className={compact ? 'error-inline' : 'panel panel-error'} role="alert">
      <div>
        <strong>{title}</strong>
        {error?.message && <span className="muted"> {error.message}</span>}
      </div>
      {onRetry && (
        <button type="button" className="btn" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  )
}
