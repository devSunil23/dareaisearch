import { CATEGORIES, COUNTRIES, STATUSES } from '../mocks/data'
import { COUNTRY_NAMES, capitalize } from '../lib/format'

function Select({ id, label, value, options, onChange }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">All</option>
        {options.map(([v, text]) => (
          <option key={v} value={v}>{text}</option>
        ))}
      </select>
    </div>
  )
}

const statusOptions = STATUSES.map((s) => [s, capitalize(s)])
const categoryOptions = CATEGORIES.map((c) => [c, c])
const countryOptions = COUNTRIES.map((c) => [c, COUNTRY_NAMES[c]])

export default function Filters({ params, onChange }) {
  return (
    <>
      <Select id="f-status" label="Status" value={params.status} options={statusOptions}
        onChange={(status) => onChange({ status })} />
      <Select id="f-category" label="Category" value={params.category} options={categoryOptions}
        onChange={(category) => onChange({ category })} />
      <Select id="f-country" label="Country" value={params.country} options={countryOptions}
        onChange={(country) => onChange({ country })} />
    </>
  )
}
