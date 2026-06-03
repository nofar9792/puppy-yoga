interface SearchBarProps {
  search: string
  dateFrom: string
  dateTo: string
  onSearchChange: (v: string) => void
  onDateFromChange: (v: string) => void
  onDateToChange: (v: string) => void
}

export default function SearchBar({
  search, dateFrom, dateTo,
  onSearchChange, onDateFromChange, onDateToChange,
}: SearchBarProps) {
  return (
    <div className="search-bar">
      <div className="search-input-wrap">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="Search by class name, instructor, or dog breed..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => onSearchChange('')} aria-label="Clear search">×</button>
        )}
      </div>

      <div className="date-filters">
        <label className="date-label">From</label>
        <input
          type="date"
          className="date-input"
          value={dateFrom}
          onChange={e => onDateFromChange(e.target.value)}
        />
        <label className="date-label">To</label>
        <input
          type="date"
          className="date-input"
          value={dateTo}
          onChange={e => onDateToChange(e.target.value)}
        />
        {(dateFrom || dateTo) && (
          <button
            className="date-clear"
            onClick={() => { onDateFromChange(''); onDateToChange('') }}
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  )
}
