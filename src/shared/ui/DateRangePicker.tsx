import { useEffect, useMemo, useState } from 'react'
import styled, { css } from 'styled-components'
import { Icon } from '../Icon/Icon'
import { useOutsideClick } from '@shared/lib/useOutsideClick'

export interface DateRange {
  start: Date | null
  end: Date | null
}

interface DateRangePickerProps {
  value: DateRange
  onChange: (range: DateRange) => void
  /** BCP-47 locale for month / weekday names (defaults to en-GB). */
  locale?: string
  labels?: { placeholder?: string; clear?: string; apply?: string }
  /** Which edge of the trigger the (wide) calendar anchors to. Use 'right' near the
   *  right edge of the screen so the two-month panel doesn't overflow off-screen. */
  align?: 'left' | 'right'
}

// ── date helpers (dependency-free) ────────────────────────────────
const pad = (n: number) => String(n).padStart(2, '0')
const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)
const sameDay = (a: Date | null, b: Date | null) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const within = (d: Date, s: Date, e: Date) => {
  const t = startOfDay(d).getTime()
  return t >= startOfDay(s).getTime() && t <= startOfDay(e).getTime()
}
const ordered = (a: Date, b: Date): [Date, Date] => (a.getTime() <= b.getTime() ? [a, b] : [b, a])

const toDateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const toTimeStr = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
const fmtCompact = (d: Date) => `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${toTimeStr(d)}`

function parseTime(str: string): { h: number; m: number; s: number } | null {
  const m = /^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/.exec(str.trim())
  if (!m) return null
  const h = +m[1], mi = +m[2], s = m[3] ? +m[3] : 0
  if (h > 23 || mi > 59 || s > 59) return null
  return { h, m: mi, s }
}

const withTime = (day: Date, t: { h: number; m: number; s: number }) =>
  new Date(day.getFullYear(), day.getMonth(), day.getDate(), t.h, t.m, t.s)

const Wrap = styled.div`position: relative; display: inline-flex;`

const Trigger = styled.button<{ $active: boolean }>`
  display: inline-flex; align-items: center; gap: 8px;
  height: 38px; padding: 0 13px;
  font: inherit; font-size: 13px; font-weight: 500; font-variant-numeric: tabular-nums;
  color: #f3f4f6;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.3);
  transition: border-color 0.15s cubic-bezier(0.4,0,0.2,1), box-shadow 0.15s cubic-bezier(0.4,0,0.2,1), background 0.15s cubic-bezier(0.4,0,0.2,1);
  &:hover { background: rgba(255,255,255,0.08); }
  ${(p) => p.$active && css`border-color: #4f8fff; box-shadow: 0 0 0 3px rgba(79,143,255,0.30);`}
  svg { color: rgba(255,255,255,0.45); }
`
const Placeholder = styled.span`color: rgba(255,255,255,0.45); font-weight: 400;`

const Pop = styled.div<{ $align: 'left' | 'right' }>`
  position: absolute; top: 44px; z-index: 41;
  ${(p) => (p.$align === 'right' ? css`right: 0; left: auto;` : css`left: 0; right: auto;`)}
  width: 552px;
  max-width: calc(100vw - 32px);
  background: #141824;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0,0,0,0.5);
  @media (max-width: 620px) { width: 300px; }
`

const Head = styled.div`
  display: flex; align-items: center; gap: 6px;
  padding: 12px 14px 8px;
`
const NavBtn = styled.button`
  display: grid; place-items: center; width: 28px; height: 28px;
  border: none; background: transparent; color: rgba(255,255,255,0.72);
  border-radius: 8px;
  transition: background 0.12s, color 0.12s;
  &:hover { background: rgba(255,255,255,0.08); color: #f3f4f6; }
`
const MonthLabel = styled.span`
  flex: 1; text-align: center;
  font-size: 13.5px; font-weight: 600; text-transform: capitalize;
`

const Months = styled.div`
  display: flex; gap: 0;
  padding: 0 14px;
  @media (max-width: 620px) { flex-direction: column; }
`
const MonthCol = styled.div`
  flex: 1; min-width: 0;
  &:first-child { padding-right: 14px; border-right: 1px solid rgba(255,255,255,0.08); }
  &:last-child { padding-left: 14px; }
  @media (max-width: 620px) {
    &:first-child { padding-right: 0; border-right: none; }
    &:last-child { padding-left: 0; margin-top: 10px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 10px; }
  }
`
const Grid = styled.div`display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;`
const Weekday = styled.span`
  display: grid; place-items: center; height: 26px;
  font-size: 11px; font-weight: 600; color: rgba(255,255,255,0.45); text-transform: capitalize;
`
const Day = styled.button<{ $muted: boolean; $inRange: boolean; $edge: boolean; $today: boolean }>`
  height: 30px;
  border: none; background: transparent;
  font: inherit; font-size: 12.5px; font-variant-numeric: tabular-nums;
  color: ${(p) => (p.$muted ? 'rgba(255,255,255,0.45)' : '#f3f4f6')};
  border-radius: 8px;
  transition: background 0.1s, color 0.1s;
  &:hover { background: rgba(255,255,255,0.08); }
  ${(p) => p.$inRange && css`background: rgba(79,143,255,0.18); border-radius: 0;`}
  ${(p) => p.$today && !p.$edge && css`box-shadow: inset 0 0 0 1px rgba(255,255,255,0.16);`}
  ${(p) => p.$edge && css`
    background: #4f8fff; color: #fff; font-weight: 600; border-radius: 8px;
    &:hover { background: #3d7bef; }
  `}
`

const Inputs = styled.div`
  display: flex; align-items: center; gap: 6px;
  padding: 12px 14px;
  margin-top: 6px;
  border-top: 1px solid rgba(255,255,255,0.08);
  flex-wrap: wrap;
`
const Dash = styled.span`color: rgba(255,255,255,0.45); padding: 0 2px;`
const TextInput = styled.input<{ $w: number }>`
  width: ${(p) => p.$w}px;
  height: 32px; padding: 0 8px;
  font: inherit; font-size: 12.5px; font-variant-numeric: tabular-nums;
  color: #f3f4f6;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.16);
  border-radius: 8px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;
  &:focus { border-color: #4f8fff; box-shadow: 0 0 0 3px rgba(79,143,255,0.30); }
`
const Footer = styled.div`
  display: flex; align-items: center; gap: 8px;
  padding: 0 14px 14px;
`
const Spacer = styled.div`flex: 1;`
const FooterBtn = styled.button<{ $primary?: boolean }>`
  height: 32px; padding: 0 18px;
  font: inherit; font-size: 13px; font-weight: 550;
  border-radius: 8px; border: 1px solid transparent;
  transition: background 0.12s, color 0.12s;
  ${(p) => p.$primary
    ? css`background: #4f8fff; color: #fff; &:hover { background: #3d7bef; }`
    : css`background: transparent; color: rgba(255,255,255,0.72); &:hover { background: rgba(255,255,255,0.08); color: #f3f4f6; }`}
`

export function DateRangePicker({ value, onChange, locale = 'en-GB', labels, align = 'left' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useOutsideClick<HTMLDivElement>(() => setOpen(false), open)
  const [leftView, setLeftView] = useState<Date>(() => startOfDay(value.start ?? new Date()))
  const [draft, setDraft] = useState<DateRange>(value)
  const [hover, setHover] = useState<Date | null>(null)
  const [sd, setSd] = useState('')
  const [stime, setStime] = useState('00:00:00')
  const [ed, setEd] = useState('')
  const [etime, setEtime] = useState('23:59:59')

  // Reset the working draft + inputs each time the popover opens.
  useEffect(() => {
    if (!open) return
    setDraft(value)
    setLeftView(startOfDay(value.start ?? new Date()))
    setSd(value.start ? toDateStr(value.start) : '')
    setStime(value.start ? toTimeStr(value.start) : '00:00:00')
    setEd(value.end ? toDateStr(value.end) : '')
    setEtime(value.end ? toTimeStr(value.end) : '23:59:59')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const weekdays = useMemo(() => {
    const sunday = new Date(2021, 7, 1) // 1 Aug 2021 is a Sunday
    const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
    return Array.from({ length: 7 }, (_, i) => fmt.format(addDays(sunday, i)))
  }, [locale])

  const cellsFor = (view: Date) => {
    const first = new Date(view.getFullYear(), view.getMonth(), 1)
    const offset = first.getDay() // Sunday-first
    const gridStart = addDays(first, -offset)
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  }

  const rightView = addMonths(leftView, 1)
  const today = startOfDay(new Date())
  const monthLabel = (v: Date) => new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(v)

  // Highlight range, with a live preview of the end while picking.
  const previewEnd = draft.start && !draft.end ? hover : null
  const rangeEnd = draft.end ?? previewEnd
  const [rs, re] = draft.start && rangeEnd ? ordered(draft.start, rangeEnd) : [null, null]

  // Clicks only set the dates; the time inputs are the source of truth for times.
  function applyDraft(next: DateRange) {
    setDraft(next)
    setSd(next.start ? toDateStr(next.start) : '')
    setEd(next.end ? toDateStr(next.end) : '')
  }

  function pick(day: Date) {
    const ts = parseTime(stime) ?? { h: 0, m: 0, s: 0 }
    const te = parseTime(etime) ?? { h: 23, m: 59, s: 59 }
    if (!draft.start || (draft.start && draft.end)) {
      applyDraft({ start: withTime(day, ts), end: null })
    } else {
      // Order by calendar day; start keeps the start-time, end the end-time.
      const [d1, d2] =
        startOfDay(day).getTime() < startOfDay(draft.start).getTime()
          ? [day, draft.start]
          : [draft.start, day]
      applyDraft({ start: withTime(d1, ts), end: withTime(d2, te) })
    }
  }

  function onDateInput(which: 's' | 'e', str: string) {
    which === 's' ? setSd(str) : setEd(str)
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(str.trim())
    if (!m) return
    const t = parseTime(which === 's' ? stime : etime)
    const d = new Date(+m[1], +m[2] - 1, +m[3], t?.h ?? 0, t?.m ?? 0, t?.s ?? 0)
    setDraft((prev) => (which === 's' ? { ...prev, start: d } : { ...prev, end: d }))
  }

  function onTimeInput(which: 's' | 'e', str: string) {
    which === 's' ? setStime(str) : setEtime(str)
    const t = parseTime(str)
    if (!t) return
    const base = which === 's' ? draft.start : draft.end
    if (!base) return
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate(), t.h, t.m, t.s)
    setDraft((prev) => (which === 's' ? { ...prev, start: d } : { ...prev, end: d }))
  }

  function apply() {
    let final = draft
    if (final.start && !final.end) {
      const e = new Date(final.start)
      e.setHours(23, 59, 59, 0)
      final = { start: final.start, end: e }
    }
    onChange(final)
    setOpen(false)
  }

  const renderMonth = (view: Date) => (
    <MonthCol>
      <Grid>
        {weekdays.map((w) => <Weekday key={w}>{w}</Weekday>)}
        {cellsFor(view).map((d) => {
          const muted = d.getMonth() !== view.getMonth()
          const edge = sameDay(d, draft.start) || sameDay(d, draft.end) || sameDay(d, previewEnd)
          const inRange = !!rs && !!re && within(d, rs, re)
          return (
            <Day
              key={d.toISOString()}
              type="button"
              $muted={muted}
              $inRange={inRange && !edge}
              $edge={edge}
              $today={sameDay(d, today)}
              onMouseEnter={() => setHover(d)}
              onClick={() => pick(d)}
            >
              {d.getDate()}
            </Day>
          )
        })}
      </Grid>
    </MonthCol>
  )

  return (
    <Wrap ref={wrapRef}>
      <Trigger type="button" $active={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="calendar" size={16} />
        {value.start && value.end ? (
          <span>{fmtCompact(value.start)} ~ {fmtCompact(value.end)}</span>
        ) : (
          <Placeholder>{labels?.placeholder ?? 'Select dates'}</Placeholder>
        )}
        <Icon name="chevronDown" size={14} />
      </Trigger>

      {open && (
        <Pop className="fade-in" $align={align} onMouseLeave={() => setHover(null)}>
            <Head>
              <NavBtn style={{display:"flex"}} type="button" title="Previous year" onClick={() => setLeftView((v) => addMonths(v, -12))}>
                <Icon name="chevronLeft" size={14} style={{ marginRight: -6 }} />
                <Icon name="chevronLeft" size={14} />
              </NavBtn>
              <NavBtn type="button" title="Previous month" onClick={() => setLeftView((v) => addMonths(v, -1))}>
                <Icon name="chevronLeft" size={16} />
              </NavBtn>
              <MonthLabel>{monthLabel(leftView)}</MonthLabel>
              <MonthLabel>{monthLabel(rightView)}</MonthLabel>
              <NavBtn type="button" title="Next month" onClick={() => setLeftView((v) => addMonths(v, 1))}>
                <Icon name="chevronRight" size={16} />
              </NavBtn>
              <NavBtn style={{display:"flex"}} type="button" title="Next year" onClick={() => setLeftView((v) => addMonths(v, 12))}>
                <Icon name="chevronRight" size={14} style={{ marginRight: -6 }} />
                <Icon name="chevronRight" size={14} />
              </NavBtn>
            </Head>

            <Months>
              {renderMonth(leftView)}
              {renderMonth(rightView)}
            </Months>

            <Inputs>
              <TextInput $w={104} value={sd} placeholder="YYYY-MM-DD" onChange={(e) => onDateInput('s', e.target.value)} />
              <TextInput $w={84} value={stime} placeholder="00:00:00" onChange={(e) => onTimeInput('s', e.target.value)} />
              <Dash>—</Dash>
              <TextInput $w={104} value={ed} placeholder="YYYY-MM-DD" onChange={(e) => onDateInput('e', e.target.value)} />
              <TextInput $w={84} value={etime} placeholder="23:59:59" onChange={(e) => onTimeInput('e', e.target.value)} />
            </Inputs>

            <Footer>
              <FooterBtn
                type="button"
                onClick={() => { applyDraft({ start: null, end: null }); setStime('00:00:00'); setEtime('23:59:59'); setHover(null) }}
              >
                {labels?.clear ?? 'Clear'}
              </FooterBtn>
              <Spacer />
              <FooterBtn type="button" $primary onClick={apply}>
                {labels?.apply ?? 'OK'}
              </FooterBtn>
            </Footer>
        </Pop>
      )}
    </Wrap>
  )
}
