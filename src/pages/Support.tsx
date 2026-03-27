import { HelpCircle, Mail, MessageCircle } from "lucide-react";

const Support = () => {
  return (
    <div className="animate-fade-in space-y-6 ml-12 md:ml-0">
      <h1 className="text-2xl md:text-3xl font-bold font-display text-primary">Support</h1>
      <div className="grid gap-6 md:grid-cols-2 max-w-2xl">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <Mail className="mx-auto h-10 w-10 text-primary mb-3" />
          <h3 className="font-semibold font-display mb-1">Email Support</h3>
          <p className="text-sm text-muted-foreground">support@sustaina.app</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <MessageCircle className="mx-auto h-10 w-10 text-primary mb-3" />
          <h3 className="font-semibold font-display mb-1">FAQs</h3>
          <p className="text-sm text-muted-foreground">Check our frequently asked questions</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-4">
          <HelpCircle className="h-5 w-5 text-primary" />
          <h3 className="font-semibold font-display">Common Questions</h3>
        </div>
        <div className="space-y-4">
          {[
            { q: "How do I add a new room?", a: "Go to Dashboard and click '+ Add' next to the room tabs." },
            { q: "How do I track consumption?", a: "Add devices to rooms and toggle them on/off. Consumption is logged automatically." },
            { q: "How do reminders work?", a: "Set up schedule reminders with specific times and days. You'll get browser notifications when it's time." },
            { q: "How do I set monthly targets?", a: "On the Dashboard, click 'Set Target' under the Monthly Target section." },
          ].map((faq, i) => (
            <div key={i}>
              <p className="font-medium text-sm">{faq.q}</p>
              <p className="text-sm text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Support;
