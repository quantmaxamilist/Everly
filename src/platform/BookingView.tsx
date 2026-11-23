import Link from 'next/link';
import Icon from '@/components/Icon';
import { db, getSetting } from './db';
import { messagesOf, type Booking, type Supplier } from './data';
import { sendMessage, sendContract, declineEnquiry, signContract, recordPayment, cancelBooking, saveNote } from './actions/booking';
import { ConfirmSubmit, ScrollEnd, Submit } from './client';
import { StatusTag, s } from './ui';
import { balanceDue, daysUntil, depositOf, fmtDate, fmtWhen, gbp, isBooked } from './util';

type Side = 'supplier' | 'couple';

const DEFAULT_TERMS = (sup: Supplier) => `1. Booking: Your date is secured once this contract is signed and the deposit is paid. Until then the date may be booked by another couple.
2. Payments: The deposit is due on signing. The remaining balance is due by the date shown in this booking.
3. Cancellation: The deposit is non-refundable. Other payments are refundable if you cancel more than 12 weeks before the wedding.
4. Changes: Changes to guest numbers or the package can be made up to 4 weeks before the wedding and may change the total.
5. ${sup.name} will provide the services described in the package and extras listed in this booking.`;

const PIPE = [['enquiry', 'Enquiry'], ['contract', 'Contract'], ['deposit', 'Deposit · date held'], ['paid', 'Fully paid']] as const;

export async function BookingView({ b, sup, side, meId }: { b: Booking; sup: Supplier; side: Side; meId: string }) {
  const sql = await db();
  if (side === 'supplier') await sql`update messages set read_supplier = true where booking_id = ${b.id} and not read_supplier`;
  else await sql`update messages set read_couple = true where booking_id = ${b.id} and not read_couple`;
  const msgs = await messagesOf(b.id);
  const pays = await sql<{ id: string; amount: number; kind: string; method: string; created_at: Date }[]>`select id, amount, kind, method, created_at from payments where booking_id = ${b.id} order by created_at`;
  const stage = PIPE.findIndex(([k]) => k === b.status);
  const dep = depositOf(b); const owed = Math.max(0, b.total - b.paid);
  const closed = b.status === 'declined' || b.status === 'cancelled';
  const terms = b.contract_terms || (await getSetting('terms:' + sup.id)) || DEFAULT_TERMS(sup);
  const other = side === 'supplier' ? b.couple_name : sup.name;
  const extras = Array.isArray(b.extras) ? b.extras : [];

  const summary = (
    <div className={s.card}>
      <div className={s.row}><b className={s.h3}>{b.package_name || 'Booking'}</b><StatusTag status={b.status} side={side} /></div>
      <ul className={s.lines}>
        <li><span>Date</span><b>{fmtDate(b.date, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}{b.end_date ? ` – ${fmtDate(b.end_date)}` : ''}</b></li>
        <li><span>Guests</span><span>{b.guests || '—'}</span></li>
        {extras.map((x, i) => <li key={i} className={s.muted}><span>+ {x.name}</span><span>{gbp(x.price)}</span></li>)}
        <li><span>Total</span><b>{gbp(b.total)}</b></li>
        <li className={s.muted}><span>Deposit ({b.deposit_pct}%)</span><span>{gbp(dep)}</span></li>
        <li className={s.muted}><span>Balance due</span><span>{fmtDate(balanceDue(b))}</span></li>
        <li><span>Paid so far</span><b>{gbp(b.paid)}</b></li>
        {!closed && <li><span>Still to pay</span><b>{gbp(owed)}</b></li>}
      </ul>
      {side === 'supplier' ? (
        <p className={s.muted}>{b.source === 'direct' ? 'Direct booking (no Asteria commission)' : `Via Asteria · ${b.couple_email}${b.couple_phone ? ` · ${b.couple_phone}` : ''}`}</p>
      ) : <p className={s.muted}><Link href={`/platform/couple/s/${sup.id}`}>View {sup.name}’s listing</Link></p>}
    </div>
  );

  const pipeline = !closed && (
    <ol className={s.pipe}>
      {PIPE.map(([k, l], i) => <li key={k} className={i < stage ? s.done : i === stage ? s.now : ''}><span>{i < stage ? <Icon name="check" size={13} /> : i + 1}</span>{l}</li>)}
    </ol>
  );

  /* ---------- the next step for whoever is looking ---------- */
  let step: React.ReactNode = null;
  if (side === 'supplier' && (b.status === 'enquiry' || b.status === 'contract')) {
    step = (
      <div className={s.card}>
        <b className={s.h3}>{b.status === 'enquiry' ? 'Reply with your contract' : b.contract_signed_at ? 'Contract signed — waiting for the deposit' : 'Contract sent — waiting for signature'}</b>
        {b.status === 'contract' && <p className={s.muted}>Sent {fmtWhen(b.contract_sent_at!)}{b.contract_signed_at ? ` · signed ${fmtWhen(b.contract_signed_at)}` : ''}. The date is still open to other couples until the deposit is paid.</p>}
        {b.source === 'asteria' && (
          <details className={s.box} open={b.status === 'enquiry'}>
            <summary>{b.status === 'enquiry' ? 'Set the price & terms, then send' : 'Edit and re-send the contract'}</summary>
            <form action={sendContract} className={s.form}>
              <input type="hidden" name="id" value={b.id} />
              <div className={`${s.f2} ${s.f3}`}>
                <div className={s.field}><label htmlFor="ct-t">Total (£)</label><input id="ct-t" name="total" inputMode="numeric" className={s.input} defaultValue={b.total} /></div>
                <div className={s.field}><label htmlFor="ct-d">Deposit %</label><input id="ct-d" name="deposit_pct" inputMode="numeric" className={s.input} defaultValue={b.deposit_pct} /></div>
                <div className={s.field}><label htmlFor="ct-w">Balance due (weeks before)</label><input id="ct-w" name="balance_weeks" inputMode="numeric" className={s.input} defaultValue={b.balance_weeks} /></div>
              </div>
              <div className={s.field}><label htmlFor="ct-x">Contract terms <small>(saved as your default for next time)</small></label><textarea id="ct-x" name="terms" className={s.input} style={{ minHeight: 180 }} defaultValue={terms} /></div>
              <Submit pending="Sending…">{b.status === 'enquiry' ? 'Send contract' : 'Re-send contract'}</Submit>
            </form>
          </details>
        )}
        {b.status === 'enquiry' && (
          <form action={declineEnquiry} className={s.btnRow}>
            <input type="hidden" name="id" value={b.id} />
            <input name="reason" className={s.input} placeholder="Reason (optional) — e.g. we’re booked that day" style={{ flex: 1, minWidth: 200 }} />
            <ConfirmSubmit className={s.ghost} confirm="Decline enquiry">Decline</ConfirmSubmit>
          </form>
        )}
      </div>
    );
  }
  if (side === 'couple' && b.status === 'contract') {
    step = (
      <div className={s.card}>
        <b className={s.h3}>{b.contract_signed_at ? 'Contract signed — pay your deposit' : `${sup.name} sent their contract`}</b>
        <div className={s.notice} style={{ whiteSpace: 'pre-wrap', maxHeight: 280, overflowY: 'auto' }}>{b.contract_terms}</div>
        {!b.contract_signed_at ? (
          <form action={signContract} className={s.form}>
            <input type="hidden" name="id" value={b.id} />
            <div className={s.field}><label htmlFor="sg">Type your full name to sign</label><input id="sg" name="signature" className={s.input} required /></div>
            <label className={s.check}><input type="checkbox" name="agree" required /><span>I agree to this contract, including a {b.deposit_pct}% deposit of {gbp(dep)} to secure {fmtDate(b.date)}.</span></label>
            <Submit pending="Signing…">Sign contract</Submit>
          </form>
        ) : (
          <div className={s.notice}>
            <b>Deposit due: {gbp(Math.max(0, dep - b.paid))}</b>
            <p className={s.muted}>Card payments through Asteria are being switched on. For now, pay {sup.name} the deposit directly — they’ll confirm it here and your date will be booked.</p>
          </div>
        )}
      </div>
    );
  }
  if (side === 'supplier' && (b.status === 'contract' || b.status === 'deposit') && owed > 0) {
    step = (
      <>
        {step}
        <div className={s.card}>
          <b className={s.h3}>Record a payment</b>
          <p className={s.muted}>{b.status === 'contract' ? `Deposit due: ${gbp(Math.max(0, dep - b.paid))}. Recording it holds the date.` : `Balance due ${fmtDate(balanceDue(b))} (${daysUntil(balanceDue(b))} days): ${gbp(owed)}.`}</p>
          <form action={recordPayment} className={s.form}>
            <input type="hidden" name="id" value={b.id} />
            <div className={`${s.f2} ${s.f3}`}>
              <div className={s.field}><label htmlFor="pa">Amount (£)</label><input id="pa" name="amount" inputMode="numeric" className={s.input} defaultValue={b.status === 'contract' ? Math.max(0, dep - b.paid) : owed} /></div>
              <div className={s.field}><label htmlFor="pk">Type</label><select id="pk" name="kind" className={s.input} defaultValue={b.status === 'contract' ? 'deposit' : 'balance'}><option value="deposit">Deposit</option><option value="instalment">Instalment</option><option value="balance">Final payment</option></select></div>
              <div className={s.field}><label htmlFor="pm">Method</label><select id="pm" name="method" className={s.input}><option value="bank">Bank transfer</option><option value="card">Card</option><option value="cash">Cash</option></select></div>
            </div>
            <Submit pending="Saving…">Record payment</Submit>
          </form>
        </div>
      </>
    );
  }

  const thread = (
    <div className={s.card} id="composer">
      <div className={s.row}><b className={s.h3}>Messages with {other}</b><span className={s.muted}>Updates every few seconds</span></div>
      <div className={s.thread}>
        {side === 'supplier' && b.message && <div className={s.bubble}><span>{b.message}</span><small>{b.couple_name} · enquiry · {fmtWhen(b.created_at)}</small></div>}
        {side === 'couple' && b.message && <div className={`${s.bubble} ${s.mine}`}><span>{b.message}</span><small>You · enquiry · {fmtWhen(b.created_at)}</small></div>}
        {msgs.map((m) => m.kind === 'note'
          ? <p key={m.id} className={s.sys}>{m.body} · {fmtWhen(m.created_at)}</p>
          : <div key={m.id} className={`${s.bubble} ${m.sender_id === meId ? s.mine : ''}`}><span>{m.body}</span><small>{m.sender_id === meId ? 'You' : m.sender_name || other} · {fmtWhen(m.created_at)}</small></div>)}
        {!msgs.length && !b.message && <p className={s.empty}>No messages yet.</p>}
        <ScrollEnd />
      </div>
      {!closed || msgs.length ? (
        <form action={sendMessage} className={s.composer}>
          <input type="hidden" name="id" value={b.id} />
          <textarea name="body" className={s.input} placeholder={`Message ${other}…`} required aria-label="Message" />
          <Submit pending="…">Send</Submit>
        </form>
      ) : null}
    </div>
  );

  const payments = pays.length > 0 && (
    <div className={s.card}>
      <b className={s.h3}>Payments</b>
      <div className={s.list}>{pays.map((p) => <div key={p.id} className={s.li}><span><b>{gbp(p.amount)}</b><small>{p.kind} · {p.method} · {fmtDate(p.created_at)}</small></span><span className={`${s.tag} ${s.t_ok}`}>Received</span></div>)}</div>
    </div>
  );

  const cancel = !closed && (
    <form action={cancelBooking} className={s.card}>
      <input type="hidden" name="id" value={b.id} />
      <b className={s.h3}>Cancel {isBooked(b.status) ? 'booking' : 'request'}</b>
      <p className={s.muted}>{isBooked(b.status) ? `${gbp(b.paid)} has been paid. Refunds follow the contract’s cancellation terms.` : 'Nothing has been paid yet.'}</p>
      <input name="reason" className={s.input} placeholder="Reason (optional)" />
      <ConfirmSubmit className={s.danger} confirm="Yes, cancel it">Cancel</ConfirmSubmit>
    </form>
  );

  const privateNote = side === 'supplier' && (
    <form action={saveNote} className={s.card}>
      <input type="hidden" name="id" value={b.id} />
      <b className={s.h3}>Private note</b>
      <textarea name="note" className={s.input} defaultValue={b.note} placeholder="Only you can see this" />
      <Submit className={`${s.ghost} ${s.sm}`}>Save note</Submit>
    </form>
  );

  return (
    <>
      {pipeline}
      <div className={`${s.split}`}>
        <div className={s.stack} style={{ gap: 16 }}>{step}{thread}</div>
        <div className={s.stack} style={{ gap: 16 }}>{summary}{payments}{privateNote}{cancel}</div>
      </div>
    </>
  );
}
