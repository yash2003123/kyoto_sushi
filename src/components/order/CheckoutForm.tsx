"use client";

import { AnimatePresence, m } from "motion/react";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart";
import { findItem, t } from "@/lib/menu";
import { formatPrice, type Locale } from "@/lib/i18n";
import { TRANSPORT_QUESTION_THRESHOLD } from "@/lib/pricing";
import { EMAIL, isValidPhone } from "@/lib/validation";
import type { Dictionary } from "@/lib/dictionary";
import type { PaymentMethodId } from "@/lib/payment-methods";
import { SlotPicker } from "./SlotPicker";
import { PaymentMethods } from "./PaymentMethods";
import { Field, TextareaField } from "./Field";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AnimatedNumber, Reveal, duration, ease, spring } from "@/components/motion";

type Errors = Partial<Record<string, string>>;

/**
 * Maps a checkout failure to copy the customer can act on. The API returns a
 * specific code for every case it distinguishes; showing the same generic
 * sentence for all of them hides whether the fix is "pick another time" or
 * "call the restaurant" — different enough that it is worth a few extra
 * strings rather than one catch-all.
 */
function errorCopy(dict: Dictionary, code: string): string {
  switch (code) {
    case "no-slots":
      return dict.checkout.errorNoSlots;
    case "slot-unavailable":
      return dict.checkout.errorSlotTaken;
    case "orders-paused":
      return dict.checkout.errorPaused;
    case "closed":
      return dict.checkout.errorClosed;
    case "store-unavailable":
    case "settlement-failed":
    case "payment-create-failed":
    case "no-checkout-url":
      return dict.checkout.errorUnavailable;
    case "network":
      return dict.checkout.errorNetwork;
    default:
      return dict.checkout.error;
  }
}

export function CheckoutForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const { lines, subtotal, clear, ready } = useCart();
  const router = useRouter();

  const [slotMinutes, setSlotMinutes] = useState<number | null>(null);
  const [method, setMethod] = useState<PaymentMethodId>("bancontact");
  const [transport, setTransport] = useState<"car" | "bike" | "foot" | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [service, setService] = useState({ paused: false, hasSlots: true });

  const onSlotState = useCallback(
    (next: { paused: boolean; hasSlots: boolean }) => setService(next),
    [],
  );

  const total = subtotal;
  const needsTransport = total >= TRANSPORT_QUESTION_THRESHOLD;

  const set = (key: keyof typeof form) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  function validate(): boolean {
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = dict.checkout.required;
    if (!EMAIL.test(form.email.trim())) next.email = dict.checkout.invalidEmail;
    if (!isValidPhone(form.phone)) next.phone = dict.checkout.invalidPhone;
    if (needsTransport && !transport) next.transport = dict.checkout.required;
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setServerError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          locale,
          slotMinutes,
          method,
          notes: form.notes,
          transport,
          customer: form,
          cart: lines.map((line) => ({ id: line.id, quantity: line.quantity })),
        }),
      });

      const json = (await response.json()) as { checkoutUrl?: string; error?: string };
      if (!response.ok || !json.checkoutUrl) {
        setServerError(json.error ?? "unknown");
        setSubmitting(false);
        return;
      }

      // The basket has become an order; keeping it would double it if the
      // customer comes back through the browser's back button.
      clear();

      if (json.checkoutUrl.startsWith("http")) {
        window.location.href = json.checkoutUrl;
      } else {
        router.push(json.checkoutUrl);
      }
    } catch {
      setServerError("network");
      setSubmitting(false);
    }
  }

  const summaryLines = useMemo(
    () =>
      lines.flatMap((line) => {
        const item = findItem(line.id);
        return item ? [{ line, item }] : [];
      }),
    [lines],
  );

  // The cart is read from localStorage after mount. Rendering the full form
  // during that beat and then swapping it for the empty state is a whole-page
  // layout shift on every visit, so hold a fixed-height placeholder instead.
  if (!ready) {
    return <div className="min-h-[70vh]" aria-hidden />;
  }

  if (lines.length === 0) {
    return (
      <Reveal onMount className="py-20 text-center">
        <p className="m-0 text-lg">{dict.cart.empty}</p>
        <p className="text-washi-dim mt-1">{dict.cart.emptyHint}</p>
        <ButtonLink href={`/${locale}/menu`} className="mt-6">
          {dict.checkout.back}
        </ButtonLink>
      </Reveal>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
      <div className="flex flex-col gap-9">
        <Block title={dict.checkout.method}>
          <div className="border-rule bg-kaki/10 border px-4 py-3.5">
            <span className="block text-[15px] font-medium">{dict.checkout.pickup}</span>
            <span className="text-washi-dim block text-[12.5px]">
              {dict.checkout.pickupHint}
            </span>
          </div>
        </Block>

        <Block title={dict.checkout.when}>
          <SlotPicker
            dict={dict}
            value={slotMinutes}
            onChange={setSlotMinutes}
            onStateChange={onSlotState}
          />
          <AnimatePresence initial={false}>
            {service.paused ? (
              <Collapse>
                <p className="text-kaki m-0 pt-3 text-[13px]">{dict.status.paused}</p>
              </Collapse>
            ) : null}
          </AnimatePresence>
        </Block>

        <Block title={dict.checkout.contact}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={dict.checkout.name}
              value={form.name}
              onChange={set("name")}
              error={errors.name}
              autoComplete="name"
              required
            />
            <Field
              label={dict.checkout.phone}
              value={form.phone}
              onChange={set("phone")}
              error={errors.phone}
              inputMode="tel"
              autoComplete="tel"
              placeholder="0470 12 34 56"
              required
            />
            <div className="sm:col-span-2">
              <Field
                label={dict.checkout.email}
                value={form.email}
                onChange={set("email")}
                error={errors.email}
                type="email"
                inputMode="email"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <TextareaField
              label={dict.checkout.notes}
              value={form.notes}
              onChange={set("notes")}
              placeholder={dict.checkout.notesHint}
            />
          </div>
        </Block>

        {/* Only asked above €60, where the packing genuinely differs. */}
        <AnimatePresence initial={false}>
          {needsTransport ? (
            <Collapse>
              <Block title={dict.checkout.transport}>
                <p className="text-washi-dim m-0 mb-3 text-[12.5px]">
                  {dict.checkout.transportHint}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["car", dict.checkout.transportCar],
                      ["bike", dict.checkout.transportBike],
                      ["foot", dict.checkout.transportFoot],
                    ] as const
                  ).map(([id, label]) => (
                    <m.button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTransport(id);
                        setErrors((c) => ({ ...c, transport: undefined }));
                      }}
                      aria-pressed={transport === id}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring.press}
                      className={`border px-4 py-2.5 text-[13px] transition-colors duration-200 ${
                        transport === id
                          ? "border-kaki bg-kaki text-white"
                          : "border-rule text-washi-dim hover:text-washi"
                      }`}
                    >
                      {label}
                    </m.button>
                  ))}
                </div>
                {errors.transport ? (
                  <p className="text-kaki m-0 mt-2 text-[12px]">{errors.transport}</p>
                ) : null}
              </Block>
            </Collapse>
          ) : null}
        </AnimatePresence>

        <Block title={dict.checkout.payment}>
          <PaymentMethods value={method} onChange={setMethod} />
          <p className="text-washi-dim m-0 mt-3 text-[12.5px]">{dict.checkout.secure}</p>
        </Block>
      </div>

      {/* ---- summary ---- */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border-rule bg-ai-deep/50 border p-6">
          <h2 className="font-display m-0 mb-4 text-xl font-bold">
            {dict.checkout.summary}
          </h2>

          <ul className="m-0 list-none p-0">
            <AnimatePresence initial={false}>
              {summaryLines.map(({ line, item }) => (
                <m.li
                  key={line.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: duration.fast, ease: ease.out, layout: spring.panel }}
                  className="border-rule-soft flex justify-between gap-3 border-b py-2 text-[14px]"
                >
                  <span>
                    <span className="tabular text-washi-dim">{line.quantity}×</span>{" "}
                    {t(item.name, locale)}
                  </span>
                  <span className="tabular shrink-0">
                    {formatPrice(item.price * line.quantity, locale)}
                  </span>
                </m.li>
              ))}
            </AnimatePresence>
          </ul>

          <div className="mt-4 flex justify-between text-[14px]">
            <span className="text-washi-dim">{dict.cart.subtotal}</span>
            <span className="tabular">{formatPrice(subtotal, locale)}</span>
          </div>

          <div className="border-rule mt-4 flex items-baseline justify-between border-t pt-4">
            <span className="text-[13px] tracking-[0.16em] uppercase">
              {dict.cart.total}
            </span>
            <AnimatedNumber
              value={total}
              format={(n) => formatPrice(Math.round(n), locale)}
              className="font-display tabular text-3xl font-bold"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting || service.paused}
            className="mt-6 w-full"
          >
            {submitting
              ? dict.checkout.paying
              : `${dict.checkout.pay} ${formatPrice(total, locale)}`}
          </Button>

          <AnimatePresence initial={false}>
            {serverError ? (
              <Collapse>
                <p className="text-kaki m-0 pt-3 text-[13px]">
                  {errorCopy(dict, serverError)}
                </p>
              </Collapse>
            ) : null}
          </AnimatePresence>

          <ButtonLink
            href={`/${locale}/menu`}
            variant="ghost"
            size="sm"
            className="mt-2 w-full border-transparent"
          >
            {dict.checkout.back}
          </ButtonLink>
        </div>
      </aside>
    </form>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Reveal onMount>
      <h2 className="text-moss m-0 mb-4 text-[11px] font-bold tracking-[0.28em] uppercase">
        {title}
      </h2>
      {children}
    </Reveal>
  );
}

/** Height-animated container for content that appears mid-form. */
function Collapse({ children }: { children: React.ReactNode }) {
  return (
    <m.div
      className="overflow-hidden"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: duration.base, ease: ease.inOut }}
    >
      {children}
    </m.div>
  );
}
