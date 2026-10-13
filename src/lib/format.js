const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const number = new Intl.NumberFormat('en-US')
const date = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTime = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

export const formatMoney = (n) => money.format(n)
export const formatNumber = (n) => number.format(n)
export const formatDate = (iso) => date.format(new Date(iso))
export const formatDateTime = (iso) => dateTime.format(new Date(iso))

export const COUNTRY_NAMES = {
  IN: 'India', US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  CA: 'Canada', AU: 'Australia', SG: 'Singapore', AE: 'UAE', JP: 'Japan',
}

export const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)
